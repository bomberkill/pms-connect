import { useState, useMemo, useEffect } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { useDictionary } from "@/hooks/use-dictionary";
import { useNotification } from "@/hooks/use-notification";
import { signInWithGoogle, AuthUser, AuthApiError } from "@/graphql/betterAuth";
import { fetchUserByAuthId } from "@/graphql/authActions";
import { useSession } from "@/lib/auth-client";
import { completeRegistration } from "@/app/actions/register";
import { useRouter } from "next/navigation";
import parsePhoneNumberFromString from "libphonenumber-js";
import { useCheckUserExists } from "@/hooks/useData/useUserData";
import { RegisterFormValues, AccreditationPreviewItem } from "../types";
import { UserTypeGQL, SpecialityGQL, EntityTypeGQL } from "@/types/User";
import { MAX_FILE_SIZE } from "@/utils/fileUpload";
import { PASSWORD_MIN_LENGTH, PASSWORD_DIGIT_RE } from "@/utils/passwordStrength";

const REGISTRATION_STATE_KEY = "pms-connect-registration-state";

export const useRegisterForm = () => {
    const dict = useDictionary();
    const { open } = useNotification();
    const router = useRouter();
    const { checkByEmail, checkByPhone } = useCheckUserExists();
    const { data: session, isPending: sessionPending } = useSession();

    const [currentStep, setCurrentStep] = useState(0);
    const [isRestored, setIsRestored] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // True while: (a) the redirect to Google is in flight, or (b) we're
    // checking a just-returned session against our own profile API. Either
    // way the form isn't ready to show yet.
    const [isGoogleSignIn, setIsGoogleSignIn] = useState(true);
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
                then: schema => schema
                    .min(PASSWORD_MIN_LENGTH, dict.validation.password.min)
                    .matches(PASSWORD_DIGIT_RE, dict.validation.password.min)
                    .required(dict.validation.password.required),
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
                        if (result.error === 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL') {
                            open("error", dict.notifications.register.error.title, {
                                message: dict.validation.email.alreadyInUse || "Cette adresse e-mail est déjà utilisée.",
                            });
                            return;
                        }
                        throw new Error(result.error);
                    }

                    localStorage.removeItem(REGISTRATION_STATE_KEY);

                    if (result.requiresEmailVerification) {
                        open("success", dict.notifications.register.success.pendingVerification.title, {
                            message: dict.notifications.register.success.pendingVerification.message,
                        });
                        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
                    } else {
                        open("success", dict.notifications.register.success.title, {
                            message: dict.notifications.register.success.message,
                        });
                        router.push('/');
                    }

                } catch (error: unknown) {
                    console.error("Registration error:", error);
                    open("error", dict.notifications.register.error.title, {
                        message: error instanceof Error ? error.message : dict.notifications.register.error.message,
                    });
                } finally {
                    setIsLoading(false);
                }
            }
        },
    });

    const handleGoogleSignIn = async () => {
        setIsGoogleSignIn(true);
        try {
            // Better Auth's social sign-in is redirect-based: it navigates the
            // whole page away to Google and back, so nothing after this call
            // ever runs in this component instance. The returning page (this
            // one, or /login redirecting here) picks the session up fresh via
            // the effect below — no localStorage flag needed, the session
            // itself is the signal.
            await signInWithGoogle("/register");
        } catch (error: unknown) {
            console.error("Google sign-in error:", error);
            setIsGoogleSignIn(false);
        }
    };

    const handlePrevious = () => {
        setCurrentStep(currentStep - 1);
    };

    // Runs on every mount (including arriving here fresh from /login's
    // Google button, or a page refresh) and whenever the session settles.
    // A session with no matching app profile means: authenticated via
    // Google, but registration was never finished — show the completion
    // form pre-filled from what Google already told us. A session that DOES
    // have a profile means someone landed on /register by mistake (already
    // registered) — send them home instead of showing a signup form.
    useEffect(() => {
        if (sessionPending) return;
        const user = session?.user;
        if (!user) {
            setIsGoogleSignIn(false);
            return;
        }
        if (user.id === googleUser?.id) {
            // Already handled this exact session (e.g. a re-render after
            // prefill) — nothing new to do.
            setIsGoogleSignIn(false);
            return;
        }

        fetchUserByAuthId(user.id)
            .then(() => {
                open("success", dict.notifications.login.success.title, {
                    message: dict.notifications.login.success.message,
                });
                router.push("/");
            })
            .catch((error: unknown) => {
                if (error instanceof AuthApiError && error.code === "ACCOUNT_PENDING_APPROVAL") {
                    router.push("/pending-approval");
                    return;
                }

                if (!(error instanceof AuthApiError) || error.code !== "PROFILE_NOT_FOUND") {
                    console.error("Failed to restore registration flow:", error);
                    open("error", dict.notifications.register.error.title, {
                        message: error instanceof Error ? error.message : dict.notifications.register.error.message,
                    });
                    return;
                }

                setGoogleUser(user);
                formik.setValues({
                    ...formik.values,
                    email: user.email ?? "",
                    profilePicUrl: user.image || "",
                    firstName: user.name?.split(" ")[0] || "",
                    lastName: user.name?.split(" ").slice(1).join(" ") || "",
                });
                open("success", dict.notifications.register.success.googleAccount.title, {
                    message: dict.notifications.register.success.googleAccount.message
                });
            })
            .finally(() => setIsGoogleSignIn(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, sessionPending]);

    // Persistence Effect
    useEffect(() => {
        if (!isRestored || isLoading) return;
        // Never persist credentials or File objects to localStorage:
        // restored `{}` placeholders from JSON can corrupt the final FormData
        // submission after a refresh / tab restore / Google OAuth round-trip.
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const {
            profilePicFile,
            coverPicFile,
            accreditationsFile,
            password,
            confirmPassword,
            ...serializableValues
        } = formik.values;
        /* eslint-enable @typescript-eslint/no-unused-vars */

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
                const restoredStep = Number.isInteger(savedState.currentStep)
                    ? Math.min(Math.max(savedState.currentStep, 0), validationSchemas.length - 1)
                    : 0;
                setCurrentStep(restoredStep);
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
        isRestored,
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
    };
};
