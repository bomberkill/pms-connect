"use client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppDispatch, useDictionary, useNotification } from "@/lib/hooks"
import * as yup from "yup"
import { useFormik } from "formik"
import { useEffect, useState } from "react"
import { googleProvider, resetPassword, signInWithGoogle } from "@/graphql/firebaseAuth"
import Link from "next/link"
import { FirebaseError } from "firebase/app"
import { loginAndFetchUser } from "@/redux/services/userService"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { getRedirectResult, signInWithRedirect } from "firebase/auth"
import { gql, useApolloClient } from "@apollo/client"
import Image from "next/image"
import { auth } from "@/lib/firebase"
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
    password: yup.string().min(6, dict.validation.password.min).required(dict.validation.password.required),
  });
  // const handleSubmit = async (
  //   values: typeof initialValues,
  //   formikHelpers: FormikHelpers<typeof initialValues>
  // ) => {
  // }
  const dispatch = useAppDispatch()
  const router = useRouter()
  const client = useApolloClient()
  const loginFormik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        // const user = await login(values.email, values.password)
        // if (user) {
        //   // Optionally, redirect the user here: router.push('/dashboard')
        // } else {
        //   open("error", dict.notifications.login.error.title, { message: dict.notifications.login.error.message })
        // }
        await dispatch(loginAndFetchUser({ email: values.email, password: values.password })).unwrap()
        open("success", dict.notifications.login.success.title, { message: dict.notifications.login.success.message })
        router.push('/')
      } catch (error: unknown) {
        console.error("Login error:", error);
        let errorMessage = dict.notifications.login.error.messages.default; // Message par défaut
        switch (error) {
          case "auth/invalid-credential":
            errorMessage = dict.notifications.login.error.messages["auth/invalid-credential"];
            break;
          case "auth/user-disabled":
            errorMessage = dict.notifications.login.error.messages["auth/user-disabled"];
            break;
          case "auth/user-not-found":
            errorMessage = dict.notifications.login.error.messages["auth/user-not-found"];
            break;
          case "auth/network-request-failed":
            errorMessage = dict.notifications.login.error.messages["auth/network-request-failed"] ;
            break;
          case "auth/too-many-requests":
            errorMessage = dict.notifications.login.error.messages["auth/too-many-requests"];
            break;
          default:
            errorMessage = dict.notifications.login.error.messages.default;
        }
        // if (error instanceof FirebaseError) {
        // } else 
        if (error instanceof Error) {
        // Erreur provenant du thunk createUser ou d'une autre partie
          errorMessage = error.message;
        }
        open("error", dict.notifications.login.error.title, { 
            message: errorMessage 
        });
      } finally {
        setIsLoading(false)
      }
    },
  })

  const resetSchema = yup.object().shape({
    email: yup.string().email(dict.validation.email.invalid).required(dict.validation.email.required),
  })

  const resetFormik = useFormik({
    initialValues: { email: "" },
    validationSchema: resetSchema,
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        const { data } = await client.query<{
          checkUserExistsByEmail: { exists: boolean; hasPassword: boolean; providers: string[] };
        }>({
          query: gql`
            query CheckUserExistsByEmail($email: String!) {
              checkUserExistsByEmail(email: $email) {
                exists
                hasPassword
                providers
              }
            }
          `,
          variables: { email: values.email },
          fetchPolicy: "network-only",
        });
        // console.log("check email data", data)
        if (data.checkUserExistsByEmail.exists && !data.checkUserExistsByEmail.hasPassword) {
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
        if (error instanceof FirebaseError) {
          switch (error.code) {
            case "auth/invalid-credential":
              errorMessage = dict.notifications.login.error.messages["auth/invalid-credential"];
              break;
            case "auth/user-disabled":
              errorMessage = dict.notifications.login.error.messages["auth/user-disabled"];
              break;
            case "auth/user-not-found":
              errorMessage = dict.notifications.login.error.messages["auth/user-not-found"];
              break;
            case "auth/network-request-failed":
              errorMessage = dict.notifications.login.error.messages["auth/network-request-failed"] ;
              break;
            case "auth/too-many-requests":
              errorMessage = dict.notifications.login.error.messages["auth/too-many-requests"];
              break;
            default:
              errorMessage = dict.notifications.login.error.messages.default;
          }
        }
        if (error instanceof Error) {
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
  useEffect(() => {
      const handleRedirectResult = async () => {
        console.log("Handling redirect result...");
        try {
          const result = await getRedirectResult(auth);
          if (result) {
            open("info", "Google redirect result:");
            router.push("/");
            open("success", dict.notifications.login.success.title, { message: dict.notifications.login.success.message })
            // Handle user data and token
          } else {
            console.log("No redirect result available.");
            open("info", "No redirect result available:", { message: JSON.stringify(result) });
          }
        } catch (error) {
          console.error("Error handling redirect result:", error);
          open("error", "Error handling redirect result:", { message: JSON.stringify(error) });
          // Handle errors (e.g., user cancelled sign-in)
        }
      };
  
      handleRedirectResult();
    }, []);
  const handleGoogleSignIn = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsGoogleSignIn(true);
    try {
      if (isMobile) {
        // await setPersistence(auth, browserLocalPersistence);
        await signInWithRedirect(auth, googleProvider);
      }else {
        const result = await signInWithGoogle();
        if (result) {
          router.push("/")
          open("success", dict.notifications.register.success.title, {
            message: dict.notifications.register.success.message,
          });
        }
      }
      
    } catch (error) {
      console.error("Google sign-in error:", error);
      let errorMessage: string = dict.notifications.register.error.message; // Message par défaut
      if (error instanceof FirebaseError) { // Gestion spécifique des erreurs Firebase
        switch (error.code) {
          case "auth/invalid-credential":
            errorMessage = dict.notifications.login.error.messages["auth/invalid-credential"];
            break;
          case "auth/user-disabled":
            errorMessage = dict.notifications.login.error.messages["auth/user-disabled"];
            break;
          case "auth/user-not-found":
            errorMessage = dict.notifications.login.error.messages["auth/user-not-found"];
            break;
          case "auth/network-request-failed":
            errorMessage = dict.notifications.login.error.messages["auth/network-request-failed"] ;
            break;
          case "auth/too-many-requests":
            errorMessage = dict.notifications.login.error.messages["auth/too-many-requests"];
            break;
          default:
            errorMessage = dict.notifications.login.error.messages.default;
        }
      } else if (error instanceof Error) {
        // Erreur provenant du thunk createUser ou d'une autre partie
        errorMessage = error.message;
      }
      open("error", dict.notifications.register.error.title, {
        message: errorMessage
      })
    }finally {
      setIsGoogleSignIn(false);
    }
  }

  return (
    <>
      {(isLoading || isGoogleSignIn) && <CustomLoader />}
      {!showResetForm ? (
        // ---------------- LOGIN FORM ----------------
        <form onSubmit={loginFormik.handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
          <div className="flex flex-col items-center gap-2 text-center">
            <Image src="/logo.png" alt="PMSCONNECT Logo" width={48} height={48} />
            <h1 className="text-2xl font-bold">{dict.login.title}</h1>
            <p className="text-muted-foreground text-sm text-balance">
              {dict.login.description}
            </p>
          </div>
          <div className="grid gap-6">
            <div className="grid gap-1">
              <Label htmlFor="email">{dict.login.emailLabel}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                onChange={loginFormik.handleChange}
                onBlur={loginFormik.handleBlur}
                value={loginFormik.values.email}
                // disabled={isLoading}
              />
              {loginFormik.touched.email && loginFormik.errors.email && (
                <p className="text-red-500 text-xs">{loginFormik.errors.email}</p>
              )}
            </div>
            <div className="grid gap-1">
              <div className="flex items-center">
                <Label htmlFor="password">{dict.login.passwordLabel}</Label>
                <button
                  type="button"
                  onClick={() => setShowResetForm(true)}
                  className="ml-auto text-sm underline-offset-4 hover:underline"
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
                // disabled={isLoading}
              />
              {loginFormik.touched.password && loginFormik.errors.password && (
                <p className="text-red-500 text-xs">{loginFormik.errors.password}</p>
              )}
            </div>
            <Button type="submit" className="cursor-pointer w-full">
              {dict.login.loginButton}
              {/* {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : dict.login.loginButton} */}
            </Button>
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"> 
              <span className="bg-background text-muted-foreground relative z-10 px-2"> {dict.login.continueWith} </span> 
            </div> 
            <Button type="button" onClick={() => handleGoogleSignIn()} variant="outline" className="cursor-pointer w-full"> 
              <Image src="/google-color.svg" alt="" width={4} height={4} className="h-4 w-4" />
              {dict.login.googleButton}
            </Button>
            </div>
            <div className="text-center text-sm">
              {dict.login.noAccount}{" "}
              <Link href="/register" className="underline underline-offset-4"> {dict.login.signUp} </Link>
            </div>
            {/* </div> */}
        </form>
      ) : (
        // ---------------- RESET PASSWORD FORM ----------------
        <form onSubmit={resetFormik.handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold">{dict.resetPassword.title}</h1>
            <p className="text-muted-foreground text-sm text-balance">
              {dict.resetPassword.description}
            </p>
          </div>
          <div className="grid gap-6">
            <div className="grid gap-1">
              <Label htmlFor="resetEmail">{dict.login.emailLabel}</Label>
              <Input
                id="resetEmail"
                name="email"
                type="email"
                placeholder="email@example.com"
                onChange={resetFormik.handleChange}
                onBlur={resetFormik.handleBlur}
                value={resetFormik.values.email}
                // disabled={isLoading}
              />
              {resetFormik.touched.email && resetFormik.errors.email && (
                <p className="text-red-500 text-xs">{resetFormik.errors.email}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              {dict.button.sendLink}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResetForm(false)}
              className="w-full"
            >
              {dict.button.backToLogin}
            </Button>
          </div>
        </form>
      )}
    </>
  )
}
