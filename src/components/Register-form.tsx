"use client"
import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import CustomLoader from "./Loader"
import { useRegisterForm } from "./auth/hooks/useRegisterForm"
import { StepCredentials } from "./auth/steps/StepCredentials"
import { EmailVerificationStep } from "./auth/steps/StepEmailVerification"
import { StepUserType } from "./auth/steps/StepUserType"
import { StepIdentity } from "./auth/steps/StepIdentity"
import { StepAdditionalInfo } from "./auth/steps/StepAdditionalInfo"
import { deleteCurrentUser } from "@/redux/services/userService"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const {
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
  } = useRegisterForm();

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepCredentials
            formik={formik}
            googleUser={googleUser}
            handleGoogleSignIn={handleGoogleSignIn}
          />
        )
      case 1:
        return (
          <EmailVerificationStep
            email={formik.values.email}
            onVerified={() => {
              // open("success", dict.notifications.verification.successTitle, { message: dict.notifications.verification.successMessage });
              setCurrentStep(currentStep + 1);
            }}
            onBack={async () => {
              await dispatch(deleteCurrentUser());
              setCurrentStep(currentStep - 1);
            }}
          />
        );
      case 2:
        return <StepUserType formik={formik} />
      case 3:
        return <StepIdentity formik={formik} />
      case 4:
        return (
          <StepAdditionalInfo
            formik={formik}
            profilePicPreview={profilePicPreview}
            setProfilePicPreview={setProfilePicPreview}
            coverPicPreview={coverPicPreview}
            setCoverPicPreview={setCoverPicPreview}
            accreditationsPreview={accreditationsPreview}
            setAccreditationsPreview={setAccreditationsPreview}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className={cn("py-10", className)} {...props}>
      {(isGoogleSignIn || isLoading) && <CustomLoader />}
      <form onSubmit={formik.handleSubmit} className="w-full" >
        <div className="flex flex-col items-center mb-5 text-center">
          <h1 className="text-2xl font-bold">{dict.register.title}</h1>
          <p className="text-muted-foreground text-sm text-balance">{dict.register.description}</p>
        </div>
        <div className="flex flex-col min-h-100 items-center justify-start gap-8">
          {renderStep()}
          <div className={cn("flex items-center justify-between gap-4", currentStep === 1 && "hidden")}>
            {currentStep > 0 && currentStep !== 1 && (
              <Button className="w-35" type="button" variant="outline" onClick={handlePrevious}>
                {dict.register.previous}
              </Button>
            )}
            <Button className="w-35" type="submit" disabled={currentStep === 1 || isLoading}>
              {(currentStep < validationSchemas.length - 1 ? dict.register.next : dict.register.registerButton)}
            </Button>
          </div>
          <div className="text-center text-sm">
            {dict.register.alreadyHaveAccount}{" "}
            <Link href="/login" className="underline underline-offset-4">
              {dict.login.loginButton}
            </Link>
          </div>
          <div id="recaptcha-container"></div>
        </div>
      </form>
    </div>
  )
}
