import { useState, useMemo, useEffect } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { useAppDispatch } from "@/hooks/use-redux";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { signInWithGoogle, AuthUser } from "@/graphql/betterAuth";
import { useSession } from "@/lib/auth-client";
import { completeRegistration } from "@/app/actions/register";
import { useRouter } from "next/navigation";
import parsePhoneNumberFromString from "libphonenumber-js";
import { useCheckUserExists } from "@/hooks/useData/useUserData";
import { RegisterFormValues, AccreditationPreviewItem } from "../types";
import { UserTypeGQL, SpecialityGQL, EntityTypeGQL } from "@/types/User";
import { MAX_FILE_SIZE } from "@/utils/fileUpload";

const REGISTRATION_STATE_KEY = "pms-connect-registration-state";
const GOOGLE_REDIRECT_PENDING_KEY = "pms-connect-google-redirect-pending";

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
    const { data: session } = useSession();

    const [currentStep, setCurrentStep] = useState(getInitialStep());
    const [isRestored, setIsRestored] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);
    const [googleUser, setGoogleUser] = useState<AuthUser | null>(null);
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
        // Step 1: Account Type
        yup.object().shape({
            userType: yup.string().oneOf(Object.values(UserTypeGQL)).required(dict.register.userTypeLabel),
        }),
        // Step 2: Personal/Entity Details
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
        // Step 3: Optional Profile & Location
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
            // Optional at signup — can be added later from the profile page.
            accreditationsFile: yup.array().of(
                yup.mixed()
                    .test("fileType", dict.validation.file.unsupported, (value) => {
                        if (!value) return true;
                        return ["application/pdf", "image/jpeg", "image/png"].includes((value as File).type);
                    })
                    .test("fileSize", dict.validation.file.tooLarge, (value) => {
                        if (!value) return true;
                        return (value as File).size <= MAX_FILE_SIZE;
                    })
            )
                .max(2, dict.validation.file.max)
                .notRequired(),
            bio: yup.string().notRequired(),
            websiteUrl: yup.string().url(dict.validation.websiteUrl.invalidUrl).notRequired(),
            location: yup.object().shape({
                country: yup.string().required(dict.validation.country.required),
                stateOrProvince: yup.string().required(dict.validation.state.required),
                city: yup.string().required(dict.validation.city.required),
            }),
        }),
    ], [googleUser, dict]);

    const formik = useFormik({
        initialValues,
        validationSchema: validationSchemas[currentStep],
        validateOnChange: true,
        validateOnBlur: false,
        onSubmit: async (values) => {
            // Step 0 -> 1: just a duplicate-check gate, nothing is created yet
            // (the Better Auth account itself is only created at the very end,
            // see the final submission below).
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
                        return;
                    }
                    if (phoneExists) {
                        formik.setFieldError('phoneNumber', dict.validation.phoneNumber.alreadyInUse);
                        return;
                    }

                    setCurrentStep(currentStep + 1);
                } catch (error: unknown) {
                    open("error", "Erreur de vérification", { message: error instanceof Error ? error.message : "Impossible de vérifier l'e-mail pour le moment." });
                } finally {
                    setIsLoading(false);
                }
            } else if (currentStep < validationSchemas.length - 1) {
                setCurrentStep(currentStep + 1);
            } else {
                // Final submission: a single server action creates the Better
                // Auth account (or reuses the existing Google session), uploads
                // any files and creates the profile — all in one continuous
                // flow, no mid-wizard wait for email verification.
                setIsLoading(true);
                try {
                    const { email, password, phoneNumber, userType, firstName, lastName, speciality, entityName, entityType, bio, websiteUrl, location, profilePicFile, coverPicFile, accreditationsFile, professionalTitle } = values;

                    const submission = new FormData();
                    submission.set("isGoogleSignup", googleUser ? "1" : "0");
                    submission.set("email", email);
                    if (!googleUser) {
                        submission.set("password", password ?? "");
                    }
                    submission.set("phoneNumber", phoneNumber);
                    submission.set("userType", userType);
                    if (bio) submission.set("bio", bio);
                    if (websiteUrl) submission.set("websiteUrl", websiteUrl);
                    submission.set("location", JSON.stringify(location));
                    submission.set("providers", JSON.stringify(googleUser ? ["google.com"] : ["password"]));
                    if (userType === UserTypeGQL.INDIVIDUAL) {
                        if (firstName) submission.set("firstName", firstName);
                        if (lastName) submission.set("lastName", lastName);
                        if (speciality) submission.set("speciality", speciality);
                        if (professionalTitle) submission.set("professionalTitle", professionalTitle);
                    }
                    if (userType === UserTypeGQL.LEGAL_ENTITY) {
                        if (entityName) submission.set("entityName", entityName);
                        if (entityType) submission.set("entityType", entityType);
                    }
                    if (profilePicFile) submission.set("profilePicFile", profilePicFile);
                    if (coverPicFile) submission.set("coverPicFile", coverPicFile);
                    accreditationsFile?.forEach((file) => submission.append("accreditationsFile", file));

                    const result = await completeRegistration(submission);
                    if (!result.success) {
                        throw new Error(result.error);
                    }

                    localStorage.removeItem(REGISTRATION_STATE_KEY);

                    if (result.requiresEmailVerification) {
                        open("success", dict.notifications.register.success.pendingVerification.title, {
                            message: dict.notifications.register.success.pendingVerification.message,
                        });
                        router.push('/login');
                    } else {
                        open("success", dict.notifications.register.success.title, {
                            message: dict.notifications.register.success.message,
                        });
                        router.push('/');
                    }

                } catch (error: unknown) {
                    console.error("Registration error:", error);
                    let errorMessage = dict.notifications.register.error.message;
                    if (error instanceof Error) {
                        errorMessage = error.message === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL'
                            ? (dict.validation.email.alreadyInUse || "Cette adresse e-mail est déjà utilisée.")
                            : error.message;
                    }
                    open("error", dict.notifications.register.error.title, { message: errorMessage });
                } finally {
                    setIsLoading(false);
                }
            }
        },
    });

    const handleGoogleSignIn = async () => {
        setIsGoogleSignIn(true);
        try {
            // Better Auth's social sign-in is redirect-based (it navigates away to
            // Google and back), unlike Firebase's popup flow. Completion is picked
            // up by the session-watching effect below once the browser returns. The
            // flag lets that effect know a Google sign-in was actually in flight, so
            // it doesn't also fire after a plain email/password registration step.
            localStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, "1");
            await signInWithGoogle();
        } catch (error: unknown) {
            localStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
            console.error("Google sign-in error:", error);
        } finally {
            setIsGoogleSignIn(false);
        }
    };

    const handlePrevious = () => {
        setCurrentStep(currentStep - 1);
    };

    // Google Redirect Effect: after signInWithGoogle() redirects back, the
    // Better Auth session becomes available here; pick it up to prefill the form.
    useEffect(() => {
        const user = session?.user;
        if (user && user.id !== googleUser?.id && localStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === "1") {
            localStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
            setGoogleUser(user);
            formik.setValues({
                ...formik.values,
                email: user.email ?? "",
                profilePicUrl: user.image || "",
                firstName: user.name?.split(" ")[0] || "",
                lastName: user.name?.split(" ")[1] || "",
            });
            open("success", dict.notifications.register.success.googleAccount.title, {
                message: dict.notifications.register.success.googleAccount.message
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

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
