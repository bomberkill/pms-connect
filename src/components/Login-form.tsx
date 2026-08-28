"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDictionary } from "@/hooks/use-dictionary"
import { useNotification } from "@/hooks/use-notification"
import * as yup from "yup"
import { useFormik } from "formik"
import { useState } from "react"
import { resetPassword, signInWithGoogle, AuthApiError } from "@/graphql/betterAuth"
import Link from "next/link"
import { loginAndFetchUser } from "@/graphql/authActions"
import { useRouter } from "next/navigation"
import { ArrowLeft, Info, LockKeyhole } from "lucide-react"
import { useCheckUserExists } from "../hooks/useData/index"
import Image from "next/image"
import CustomLoader from "./Loader"
export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const dict = useDictionary()
  const { open } = useNotification()
  const [isLoading, setIsLoading] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false)
  const initialValues = {
    email: "",
    password: ""
  }
  const loginSchema = yup.object().shape({
    email: yup.string().email(dict.validation.email.invalid).required(dict.validation.email.required),
    // No .min() here on purpose: this checks an *existing* password against
    // the server, not a new one — the strength rule only applies where a
    // password is being created (register, reset-password).
    password: yup.string().required(dict.validation.password.required),
  });
  // const handleSubmit = async (
  //   values: typeof initialValues,
  //   formikHelpers: FormikHelpers<typeof initialValues>
  // ) => {
  // }
  const router = useRouter()
  const loginFormik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        await loginAndFetchUser(values.email, values.password)
        open("success", dict.notifications.login.success.title, { message: dict.notifications.login.success.message })
        router.push('/')
      } catch (error: unknown) {
        // Expected outcomes of a login attempt (bad password, unverified
        // email, ...) are normal application flow, not bugs — don't log
        // them as console errors, or Next's dev overlay treats every failed
        // login as a crash. Only genuinely unexpected errors get logged.
        if (error instanceof AuthApiError) {
          switch (error.code) {
            case "PROFILE_NOT_FOUND":
              open("info", dict.notifications.login.info.title, { message: dict.notifications.login.info.message });
              router.push("/register");
              return;
            case "EMAIL_NOT_VERIFIED":
              open("info", dict.notifications.login.error.messages["auth/email-not-verified"].title, { message: dict.notifications.login.error.messages["auth/email-not-verified"].message });
              router.push(`/verify-email?email=${values.email}`);
              return;
            case "ACCOUNT_PENDING_APPROVAL":
              open("info", dict.notifications.login.error.messages["auth/account-pending-approval"].title, {
                message: dict.notifications.login.error.messages["auth/account-pending-approval"].message
              });
              router.push("/pending-approval");
              return;
            case "INVALID_EMAIL_OR_PASSWORD":
              open("error", dict.notifications.login.error.title, {
                message: dict.notifications.login.error.messages["auth/invalid-credential"]
              });
              return;
            default:
              console.error("Login error:", error);
              open("error", dict.notifications.login.error.title, {
                message: error.message || dict.notifications.login.error.messages.default
              });
              return;
          }
        }
        console.error("Login error:", error);
        open("error", dict.notifications.login.error.title, {
          message: error instanceof Error ? error.message : dict.notifications.login.error.messages.default
        });
      } finally {
        setIsLoading(false)
      }
    },
  })

  const resetSchema = yup.object().shape({
    email: yup.string().email(dict.validation.email.invalid).required(dict.validation.email.required),
  })

  const { checkByEmail } = useCheckUserExists();

  const resetFormik = useFormik({
    initialValues: { email: "" },
    validationSchema: resetSchema,
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        const { data } = await checkByEmail({ variables: { email: values.email } });

        const result = data?.checkUserExistsByEmail;

        if (result?.exists && !result.hasPassword) {
          // Email already exists
          // resetFormik.setFieldError('email', dict.validation.email.alreadyInUse);
          open("info", dict.notifications.forgotPassword.info.title, { message: dict.notifications.forgotPassword.info.message });
          return;
        }
        await resetPassword(values.email)
        open("success", dict.notifications.forgotPassword.success.title, {
          message: dict.notifications.forgotPassword.success.message
        })
        setShowResetForm(false) // Retour au login après succès
      } catch (error: unknown) {
        console.error("Reset password error:", error)
        let errorMessage = dict.notifications.forgotPassword.error.message;
        if (error instanceof AuthApiError) {
          errorMessage = error.message || dict.notifications.login.error.messages.default;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        open("error", dict.notifications.forgotPassword.error.title, {
          message: errorMessage
        })
      } finally {
        setIsLoading(false)
      }
    },
  })
  const handleGoogleSignIn = async () => {
    setIsGoogleSignIn(true);
    try {
      // Better Auth's social sign-in redirects the whole page to Google and
      // back, so nothing here runs after this call succeeds. It always
      // lands on /register, which checks the resulting session against our
      // profile API itself: existing users get bounced straight to the
      // feed, new ones see the signup form pre-filled from Google. Keeping
      // that check in one place (instead of duplicating it here) is what
      // used to lose the email/name on the way to /register.
      await signInWithGoogle("/register");
    } catch (error: unknown) {
      console.error("Google sign-in error:", error);
      open("error", dict.notifications.login.error.title, {
        message: dict.notifications.login.error.messages.default
      })
      setIsGoogleSignIn(false);
    }
  }

  return (
    <>
      {(isLoading || isGoogleSignIn) && <CustomLoader />}
      {!showResetForm ? (
        // ---------------- LOGIN FORM (A1) ----------------
        <form onSubmit={loginFormik.handleSubmit} className={cn("flex flex-col gap-8", className)} {...props}>
          <div className="flex flex-col items-center gap-3 text-center">
            <Image src="/logo.png" alt="PMSCONNECT" width={64} height={64} className="h-16 w-auto" />
            <div className="flex flex-col gap-1.5">
              <h1 className="font-heading text-2xl font-bold tracking-tight">{dict.login.title}</h1>
              <p className="text-muted-foreground text-sm text-balance">
                {dict.login.description}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <div className="grid gap-1.5">
              <Label htmlFor="email">{dict.login.emailLabel}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                onChange={loginFormik.handleChange}
                onBlur={loginFormik.handleBlur}
                value={loginFormik.values.email}
              />
              {loginFormik.touched.email && loginFormik.errors.email && (
                <p className="text-destructive text-xs">{loginFormik.errors.email}</p>
              )}
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center">
                <Label htmlFor="password">{dict.login.passwordLabel}</Label>
                <button
                  type="button"
                  onClick={() => setShowResetForm(true)}
                  className="ml-auto text-sm text-primary underline-offset-4 hover:underline"
                >
                  {dict.login.forgotPassword}
                </button>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="password"
                onChange={loginFormik.handleChange}
                onBlur={loginFormik.handleBlur}
                value={loginFormik.values.password}
              />
              {loginFormik.touched.password && loginFormik.errors.password && (
                <p className="text-destructive text-xs">{loginFormik.errors.password}</p>
              )}
            </div>
            <Button type="submit" size="xl">
              {dict.login.loginButton}
            </Button>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-background text-muted-foreground relative z-10 px-3"> {dict.login.continueWith} </span>
            </div>
            <Button type="button" onClick={() => handleGoogleSignIn()} variant="outline" size="xl">
              <Image src="/google-color.svg" alt="" width={16} height={16} className="h-4 w-4" />
              {dict.login.googleButton}
            </Button>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {dict.login.noAccount}{" "}
            <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline"> {dict.login.signUp} </Link>
          </div>
        </form>
      ) : (
        // ---------------- FORGOT PASSWORD FORM (A6) ----------------
        <form onSubmit={resetFormik.handleSubmit} className={cn("flex min-h-[calc(100svh-5rem)] flex-col gap-8", className)} {...props}>
          <div className="flex h-[52px] items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowResetForm(false)}
              className="-ml-2"
              aria-label={dict.button.backToLogin}
            >
              <ArrowLeft className="size-5" />
            </Button>
          </div>
          <div className="flex flex-col gap-5">
            <div className="flex size-13 items-center justify-center rounded-card border border-primary-100 bg-primary-50 text-primary dark:border-primary-900 dark:bg-primary-950 dark:text-primary-300">
              <LockKeyhole className="size-6" strokeWidth={1.8} />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight">{dict.resetPassword.title}</h1>
              <p className="text-muted-foreground text-sm leading-relaxed text-balance">
                {dict.resetPassword.description}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <div className="grid gap-1.5">
              <Label htmlFor="resetEmail">{dict.login.emailLabel}</Label>
              <Input
                id="resetEmail"
                name="email"
                type="email"
                placeholder="nom@etablissement.fr"
                onChange={resetFormik.handleChange}
                onBlur={resetFormik.handleBlur}
                value={resetFormik.values.email}
              />
              {resetFormik.touched.email && resetFormik.errors.email && (
                <p className="text-destructive text-xs">{resetFormik.errors.email}</p>
              )}
            </div>
            <Button type="submit" size="xl">
              {dict.button.sendLink}
            </Button>
            <div className="flex items-start gap-3 rounded-card bg-muted p-4">
              <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-5 text-muted-foreground">
                {dict.notifications.forgotPassword.info.message}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowResetForm(false)}
            className="mt-auto"
          >
            {dict.button.backToLogin}
          </Button>
        </form>
      )}
    </>
  )
}
