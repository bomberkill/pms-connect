import { useState, useMemo, useEffect } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { useAppDispatch } from "@/hooks/use-redux";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { createUser, registerAndSendVerification } from "@/redux/services/userService";
import { googleProvider, signInWithGoogle } from "@/graphql/firebaseAuth";
import { auth } from "@/lib/firebase";
import { User, deleteUser, signInWithRedirect } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import parsePhoneNumberFromString from "libphonenumber-js";
import { useCheckUserExists } from "@/hooks/useData/useUserData";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { RegisterFormValues, AccreditationPreviewItem } from "../types";
import { UserTypeGQL, SpecialityGQL, EntityTypeGQL, CreateUserInput } from "@/types/User";
import { MAX_FILE_SIZE, uploadFileToFirebase } from "@/utils/fileUpload";

const REGISTRATION_STATE_KEY = "pms-connect-registration-state";

const getInitialStep = (): number => {
    if (typeof window === "undefined") return 0;
    try {
        const savedStateJSON = localStorage.getItem(REGISTRATION_STATE_KEY);
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            return savedState.currentStep || 0;
        }
    } catch { }
    return 0;
};

export const useRegisterForm = () => {
    const dispatch = useAppDispatch();
    const dict = useDictionary();
    const { open } = useNotification();
    const router = useRouter();
    const { checkByEmail, checkByPhone } = useCheckUserExists();

    const [currentStep, setCurrentStep] = useState(getInitialStep());
    const [isRestored, setIsRestored] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);
    const [googleUser, setGoogleUser] = useState<User | null>(null);
    const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
    const [coverPicPreview, setCoverPicPreview] = useState<string | null>(null);
    const [accreditationsPreview, setAccreditationsPreview] = useState<AccreditationPreviewItem[]>([]);

    const initialValues: RegisterFormValues = {
        email: "",
        userType: UserTypeGQL.INDIVIDUAL,
        password: "",
        phoneNumber: "",
        confirmPassword: "",
        verificationCode: "",
        firstName: "",
        lastName: "",
        professionalTitle: "",
        speciality: SpecialityGQL.MEDICAL_DOCTORS,
        entityName: "",
        entityType: EntityTypeGQL.HOSPITAL,
        bio: "",
        profilePicUrl: "",
        coverPicUrl: "",
        websiteUrl: "",
        location: {
            addressLine1: "",
            addressLine2: "",
            city: "",
            stateOrProvince: "",
            postalCode: "",
            country: "",
        },
        providers: [],
        professionalAccreditation: [],
        accreditationsFile: [],
        profilePicFile: null,
        coverPicFile: null,
    };

    const validationSchemas = useMemo(() => [
        // Step 0: Credentials
        yup.object().shape({
            email: yup.string()
                .email(dict.validation.email.invalid)
                .required(dict.validation.email.required),
            phoneNumber: yup.string()
                .required(dict.validation.phoneNumber.required)
                .test("is-valid", dict.validation.phoneNumber.invalid, (value) => {
                    if (!value) return false;
                    const parsed = parsePhoneNumberFromString(value);
                    return parsed ? parsed.isValid() : false;
                }),
            password: yup.string().when([], {
                is: () => googleUser === null,
                then: schema => schema.min(6, dict.validation.password.min).required(dict.validation.password.required),
                otherwise: schema => schema.notRequired(),
            }),
            confirmPassword: yup.string().when([], {
                is: () => googleUser === null,
                then: schema => schema.oneOf([yup.ref('password')], dict.register.passwordsDoNotMatch).required(dict.validation.password.required),
                otherwise: schema => schema.notRequired()
            })
        }),
        // Step 1: Email Verification
        yup.object().shape({}),
        // Step 2: Account Type
        yup.object().shape({
            userType: yup.string().oneOf(Object.values(UserTypeGQL)).required(dict.register.userTypeLabel),
        }),
        // Step 3: Personal/Entity Details
        yup.object().shape({
            firstName: yup.string().when('userType', {
                is: UserTypeGQL.INDIVIDUAL,
                then: (schema) => schema.required(dict.register.firstNameLabel),
                otherwise: (schema) => schema.notRequired(),
            }),
            lastName: yup.string().when('userType', {
                is: UserTypeGQL.INDIVIDUAL,
                then: (schema) => schema.required(dict.register.lastNameLabel),
                otherwise: (schema) => schema.notRequired(),
            }),
            professionalTitle: yup.string().when("userType", {
                is: UserTypeGQL.INDIVIDUAL,
                otherwise: (schema) => schema.notRequired(),
            }),
            speciality: yup.string().when('userType', {
                is: UserTypeGQL.INDIVIDUAL,
                then: (schema) => schema.oneOf(Object.values(SpecialityGQL)).required(dict.register.specialityLabel),
                otherwise: (schema) => schema.notRequired(),
            }),
            entityName: yup.string().when('userType', {
                is: UserTypeGQL.LEGAL_ENTITY,
                then: (schema) => schema.required(dict.register.entityNameLabel),
                otherwise: (schema) => schema.notRequired(),
            }),
            entityType: yup.string().when('userType', {
                is: UserTypeGQL.LEGAL_ENTITY,
                then: (schema) => schema.oneOf(Object.values(EntityTypeGQL)).required(dict.register.entityTypeLabel),
                otherwise: (schema) => schema.notRequired(),
            }),
        }),
        // Step 4: Optional Profile & Location
        yup.object().shape({
            profilePicFile: yup.mixed().notRequired()
                .test("fileType", dict.validation.file.unsupported, (value) => {
                    if (!value) return true;
                    return ["image/jpeg", "image/png"].includes((value as File).type);
                })
                .test("fileSize", dict.validation.file.tooLarge, (value) => {
                    if (!value) return true;
                    return (value as File).size <= MAX_FILE_SIZE;
                }),
            coverPicFile: yup.mixed().notRequired()
                .test("fileType", dict.validation.file.unsupported, (value) => {
                    if (!value) return true;
                    return ["image/jpeg", "image/png"].includes((value as File).type);
                })
                .test("fileSize", dict.validation.file.tooLarge, (value) => {
                    if (!value) return true;
                    return (value as File).size <= MAX_FILE_SIZE;
                }),
            accreditationsFile: yup.array().of(
                yup.mixed().required(dict.validation.file.required)
                    .test("fileType", dict.validation.file.unsupported, (value) => {
                        if (!value) return false;
                        return ["application/pdf", "image/jpeg", "image/png"].includes((value as File).type);
                    })
                    .test("fileSize", dict.validation.file.tooLarge, (value) => {
                        if (!value) return false;
                        return (value as File).size <= MAX_FILE_SIZE;
                    })
            )
                .min(1, dict.validation.file.min)
                .max(2, dict.validation.file.max)
                .required(dict.validation.file.atLeast),
            bio: yup.string().notRequired(),
            websiteUrl: yup.string().url(dict.validation.websiteUrl.invalidUrl).notRequired(),
            location: yup.object().shape({
                country: yup.string().required(dict.validation.country.required),
                stateOrProvince: yup.string().required(dict.validation.state.required),
                city: yup.string().required(dict.validation.city.required),
            }),
        }),
    ], [googleUser, dict]);

    // Used for potential rollback
    const uploadedPaths: string[] = [];

    const formik = useFormik({
        initialValues,
        validationSchema: validationSchemas[currentStep],
        validateOnChange: true,
        validateOnBlur: false,
        onSubmit: async (values) => {
            const rollbackRegistration = async (firebaseUserToDelete: User | null, pathsToDelete: string[], isGoogleAuth: boolean) => {
                const storage = getStorage();
                if (pathsToDelete.length) {
                    try {
                        const deletePromises = pathsToDelete.map(path => {
                            const fileRef = ref(storage, path);
                            return deleteObject(fileRef);
                        });
                        await Promise.all(deletePromises);
                    } catch (err) {
                        console.error("Firebase Storage rollback failed:", err);
                    }
                }
                if (firebaseUserToDelete && !isGoogleAuth) {
                    try {
                        await deleteUser(firebaseUserToDelete);
                    } catch (err) {
                        console.error("Failed to delete Firebase user:", err);
                    }
                }
            };

            // Step 0 -> 1
            if (currentStep === 0) {
                setIsLoading(true);
                try {
                    const [emailResult, phoneResult] = await Promise.all([
                        checkByEmail({ variables: { email: values.email } }),
                        checkByPhone({ variables: { phoneNumber: values.phoneNumber } }),
                    ]);

                    const emailExists = emailResult.data?.checkUserExistsByEmail.exists;
                    const phoneExists = phoneResult.data?.checkUserExistsByPhoneNumber.exists;

                    if (emailExists) {
                        formik.setFieldError('email', dict.validation.email.alreadyInUse);
                        setIsLoading(false);
                        return;
                    }
                    if (phoneExists) {
                        formik.setFieldError('phoneNumber', dict.validation.phoneNumber.alreadyInUse);
                        setIsLoading(false);
                        return;
                    }

                    if (auth.currentUser && auth.currentUser.email === values.email && auth.currentUser.emailVerified) {
                        setCurrentStep(2);
                    } else {
                        try {
                            await dispatch(registerAndSendVerification({ email: values.email, password: values.password })).unwrap();
                            setCurrentStep(currentStep + 1);
                        } catch (error: unknown) {
                            let errorMessage = "Une erreur est survenue lors de l'inscription.";
                            if (typeof error === 'string') {
                                switch (error) {
                                    case 'auth/email-already-in-use':
                                        await auth.currentUser?.reload();
                                        if (auth.currentUser?.emailVerified) {
                                            setCurrentStep(2);
                                            return;
                                        }
                                        errorMessage = dict.validation.email.alreadyInUse;
                                        break;
                                    case 'auth/weak-password':
                                        errorMessage = dict.validation.password.weak;
                                        break;
                                }
                            }
                            open("error", "Erreur d'inscription", { message: errorMessage });
                        }
                    }
                } catch (error: unknown) {
                    open("error", "Erreur de vérification", { message: error instanceof Error ? error.message : "Impossible de vérifier l'e-mail pour le moment." });
                } finally {
                    setIsLoading(false);
                }
            } else if (currentStep < validationSchemas.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                // Final submission
                setIsLoading(true);
                let firebaseUser: User | null = null;
                try {
                    const { email, phoneNumber, userType, firstName, lastName, speciality, entityName, entityType, bio, websiteUrl, location, profilePicFile, coverPicFile, accreditationsFile, professionalTitle } = values;

                    if (googleUser) {
                        firebaseUser = googleUser;
                    } else if (auth.currentUser) {
                        firebaseUser = auth.currentUser;
                    } else {
                        throw new Error("Aucun utilisateur authentifié trouvé.");
                    }

                    const uid = firebaseUser.uid;
                    const [uploadedProfilePicUrl, uploadedCoverPicUrl, uploadedAccreditations] = await Promise.all([
                        profilePicFile ? uploadFileToFirebase(profilePicFile, `public/${uid}/profile`).then(url => {
                            if (url?.uploadedPath) uploadedPaths.push(url.uploadedPath);
                            return { publicUrl: url?.publicUrl ?? "" };
                        }) : Promise.resolve(undefined),
                        coverPicFile ? uploadFileToFirebase(coverPicFile, `public/${uid}/cover`).then(url => {
                            if (url?.uploadedPath) uploadedPaths.push(url.uploadedPath);
                            return { publicUrl: url?.publicUrl ?? "" };
                        }) : Promise.resolve(undefined),
                        accreditationsFile?.length > 0 ? Promise.all(
                            accreditationsFile.map(file => uploadFileToFirebase(file, `private/${uid}/accreditations`).then(url => {
                                if (url?.uploadedPath) uploadedPaths.push(url.uploadedPath);
                                return { documentUrl: url?.publicUrl ?? "" };
                            }))
                        ) : Promise.resolve([]),
                    ]);

                    const userData: CreateUserInput = {
                        email,
                        phoneNumber,
                        userType,
                        bio: bio || undefined,
                        websiteUrl: websiteUrl || undefined,
                        location,
                        profilePicUrl: uploadedProfilePicUrl?.publicUrl ?? "",
                        coverPicUrl: uploadedCoverPicUrl?.publicUrl ?? "",
                        providers: googleUser ? ['google.com'] : ['password'],
                        professionalAccreditation: uploadedAccreditations as { documentUrl: string }[],
                        ...(userType === UserTypeGQL.INDIVIDUAL && {
                            firstName,
                            lastName,
                            speciality,
                            professionalTitle
                        }),
                        ...(userType === UserTypeGQL.LEGAL_ENTITY && {
                            entityName,
                            entityType,
                        }),
                    };

                    await dispatch(createUser(userData)).unwrap();
                    open("success", dict.notifications.register.success.title, {
                        message: dict.notifications.register.success.message,
                    });
                    localStorage.removeItem(REGISTRATION_STATE_KEY);
                    router.push('/login');

                } catch (error: unknown) {
                    console.error("Registration error:", error);
                    let errorMessage = dict.notifications.register.error.message;
                    if (error instanceof FirebaseError) {
                        // Handle Firebase errors
                        switch (error.code) {
                            case 'auth/email-already-in-use':
                                errorMessage = dict.validation.email.alreadyInUse || "Cette adresse e-mail est déjà utilisée.";
                                break;
                            case 'auth/weak-password':
                                errorMessage = dict.validation.password.weak || "Le mot de passe est trop faible.";
                                break;
                            default:
                                errorMessage = error.message;
                        }
                    } else if (error instanceof Error) {
                        errorMessage = error.message;
                    }
                    await rollbackRegistration(firebaseUser, uploadedPaths, !!googleUser);
                    open("error", dict.notifications.register.error.title, { message: errorMessage });
                } finally {
                    setIsLoading(false);
                }
            }
        },
    });

    const handleGoogleSignIn = async () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        setIsGoogleSignIn(true);
        try {
            if (isMobile) {
                await signInWithRedirect(auth, googleProvider);
            } else {
                const result = await signInWithGoogle();
                if (result) {
                    setGoogleUser(result);
                    formik.setValues({
                        ...formik.values,
                        email: result.email ?? "",
                        password: "",
                        confirmPassword: "",
                        profilePicUrl: result.photoURL || "",
                        firstName: result.displayName?.split(" ")[0] || "",
                        lastName: result.displayName?.split(" ")[1] || "",
                    }, true);
                    open("success", dict.notifications.register.success.googleAccount.title, { message: dict.notifications.register.success.googleAccount.message });
                }
            }
        } catch (error: unknown) {
            if ((error as { code?: string })?.code === "auth/popup-closed-by-user") {
                console.warn("Google Sign-in popup closed by user.");
                return;
            }
            console.error("Google sign-in error:", error);
        } finally {
            setIsGoogleSignIn(false);
        }
    };

    const handlePrevious = () => {
        if (currentStep === 2 && auth.currentUser?.emailVerified) {
            setCurrentStep(0);
        } else {
            setCurrentStep(currentStep - 1);
        }
    };

    // Google Redirect Effect
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user && user.uid !== googleUser?.uid) {
                // Check if the user is actually signed in via Google
                const isGoogleAuth = user.providerData.some(
                    (provider) => provider.providerId === "google.com"
                );

                if (isGoogleAuth) {
                    setGoogleUser(user);
                    formik.setValues({
                        ...formik.values,
                        email: user.email ?? "",
                        firstName: user.displayName?.split(" ")[0] || "",
                        lastName: user.displayName?.split(" ")[1] || "",
                    });
                    open("success", dict.notifications.register.success.googleAccount.title, {
                        message: dict.notifications.register.success.googleAccount.message
                    });
                }
            }
        });
        return () => unsubscribe();
    }, []);

    // State Reset Effect
    useEffect(() => {
        if (googleUser && formik.values.email !== googleUser.email) {
            setGoogleUser(null);
        }
    }, [formik.values.email, googleUser]);

    // Persistence Effect
    useEffect(() => {
        if (!isRestored || isLoading) return;
        const {
            // profilePicFile,
            // coverPicFile,
            // accreditationsFile,
            ...serializableValues
        } = formik.values;

        const stateToSave = {
            values: serializableValues,
            currentStep,
        };
        localStorage.setItem(REGISTRATION_STATE_KEY, JSON.stringify(stateToSave));
    }, [formik.values, currentStep, googleUser, isLoading, isRestored]);

    // Restore Effect
    useEffect(() => {
        const savedStateJSON = localStorage.getItem(REGISTRATION_STATE_KEY);
        if (savedStateJSON) {
            try {
                const savedState = JSON.parse(savedStateJSON);
                formik.setValues({ ...initialValues, ...savedState.values });
            } catch {
                localStorage.removeItem(REGISTRATION_STATE_KEY);
            }
        }
        setIsRestored(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        formik,
        currentStep,
        setCurrentStep,
        isLoading,
        isGoogleSignIn,
        googleUser,
        handleGoogleSignIn,
        handlePrevious,
        profilePicPreview,
        setProfilePicPreview,
        coverPicPreview,
        setCoverPicPreview,
        accreditationsPreview,
        setAccreditationsPreview,
        validationSchemas,
        dict,
        dispatch
    };
};
