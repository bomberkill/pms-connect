"use client"
import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import CustomLoader from "./Loader"
import { useRegisterForm } from "./auth/hooks/useRegisterForm"
import { StepHeader } from "./auth/StepHeader"
import { StepCredentials } from "./auth/steps/StepCredentials"
import { StepUserType } from "./auth/steps/StepUserType"
import { StepIdentity } from "./auth/steps/StepIdentity"
import { StepAdditionalInfo } from "./auth/steps/StepAdditionalInfo"
import { UserTypeGQL } from "@/types/User"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const {
    formik,
    currentStep,
    isLoading,
    isGoogleSignIn,
    isRestored,
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
  } = useRegisterForm();

  const isLastStep = currentStep === validationSchemas.length - 1;
  const isEntity = formik.values.userType === UserTypeGQL.LEGAL_ENTITY;

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await formik.submitForm();
    } catch (error) {
      console.error("[RegisterForm] submit:error", error);
      throw error;
    }
  };

  const stepHeaderProps = (() => {
    switch (currentStep) {
      case 0:
        return { badge: dict.register.stepCredentialsBadge, title: dict.register.stepCredentialsTitle, description: dict.register.stepCredentialsDescription };
      case 1:
        return { badge: dict.register.stepAccountTypeBadge, title: dict.register.stepAccountTypeTitle, description: dict.register.stepAccountTypeDescription };
      case 2:
        return isEntity
          ? { badge: dict.register.stepDetailsBadgeEntity, title: dict.register.stepDetailsTitleEntity, description: dict.register.stepDetailsDescriptionEntity }
          : { badge: dict.register.stepDetailsBadge, title: dict.register.stepDetailsTitle, description: dict.register.stepDetailsDescription };
      default:
        return { badge: dict.register.stepProfileBadge, title: dict.register.stepProfileTitle, description: dict.register.stepProfileDescription };
    }
  })();

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
        return <StepUserType formik={formik} />
      case 2:
        return <StepIdentity formik={formik} />
      case 3:
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
    <div className={cn("mx-auto w-full max-w-sm", className)} {...props}>
      {(isGoogleSignIn || isLoading || !isRestored) && <CustomLoader />}
      <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-8">
        <StepHeader
          step={currentStep + 1}
          totalSteps={validationSchemas.length}
          onBack={currentStep > 0 ? handlePrevious : undefined}
          {...stepHeaderProps}
        />
        <div className="flex flex-col gap-8">
          {renderStep()}
          <div className="flex flex-col gap-3">
            <Button type="submit" size="xl" disabled={isLoading || !isRestored}>
              {isLastStep ? dict.register.registerButton : dict.register.next}
            </Button>
            {currentStep === 0 && (
              <div className="text-center text-sm text-muted-foreground">
                {dict.register.alreadyHaveAccount}{" "}
                <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                  {dict.login.loginButton}
                </Link>
              </div>
            )}
          </div>
          <div id="recaptcha-container"></div>
        </div>
      </form>
    </div>
  )
}
