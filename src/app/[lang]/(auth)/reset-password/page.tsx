"use client"

import { useFormik } from "formik"
import * as yup from "yup"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useDictionary } from "@/hooks/use-dictionary"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter"
import { PASSWORD_MIN_LENGTH, PASSWORD_DIGIT_RE } from "@/utils/passwordStrength"
import { AlertTriangle, CheckCircle2, EyeOff, LockKeyhole } from "lucide-react"

function ResetPasswordPageContent() {
  const dict = useDictionary()
  const { open } = useNotification()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const error = searchParams.get('error')
  const [isLoading, setIsLoading] = useState(false)

  const formik = useFormik({
    initialValues: { newPassword: "", confirmNewPassword: "" },
    validationSchema: yup.object({
      newPassword: yup.string()
        .min(PASSWORD_MIN_LENGTH, dict.validation.password.min)
        .matches(PASSWORD_DIGIT_RE, dict.validation.password.min)
        .required(dict.validation.password.required),
      confirmNewPassword: yup.string()
        .oneOf([yup.ref('newPassword')], dict.register.passwordsDoNotMatch)
        .required(dict.validation.password.required),
    }),
    onSubmit: async (values) => {
      if (!token) return
      setIsLoading(true)
      try {
        const { error: apiError } = await authClient.resetPassword({
          newPassword: values.newPassword,
          token,
        })
        if (apiError) {
          throw new Error(apiError.message || dict.notifications.passwordReset.error.message)
        }
        open("success", dict.notifications.passwordReset.success.title, { message: dict.notifications.passwordReset.success.message })
        router.push('/login')
      } catch (err: unknown) {
        open("error", dict.notifications.passwordReset.error.title, {
          message: err instanceof Error ? err.message : dict.notifications.passwordReset.error.message,
        })
      } finally {
        setIsLoading(false)
      }
    },
  })

  if (!token || error) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col items-center justify-center gap-5 px-6 py-10 text-center">
        <div className="flex size-16 items-center justify-center rounded-card border border-tertiary-200 bg-tertiary-100 text-tertiary-700 dark:border-tertiary-900 dark:bg-tertiary-950 dark:text-tertiary-300">
          <AlertTriangle className="size-7" strokeWidth={1.8} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">{dict.resetPassword.title}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{dict.resetPassword.invalidToken}</p>
        </div>
        <Button onClick={() => router.push('/login')}>{dict.button.backToLogin}</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col px-6 py-10">
      <div className="flex flex-col gap-5 pt-8">
        <div className="flex size-[52px] items-center justify-center rounded-[15px] border border-primary-100 bg-primary-50 text-primary shadow-xs dark:border-primary-900 dark:bg-primary-950 dark:text-primary-300">
          <LockKeyhole className="size-6" strokeWidth={1.8} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight">{dict.resetPassword.newPasswordTitle}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{dict.resetPassword.newPasswordDescription}</p>
        </div>
      </div>
      <form onSubmit={formik.handleSubmit} className="mt-8 flex flex-col gap-6">
        <div className="grid gap-1.5">
          <Label htmlFor="newPassword">{dict.resetPassword.newPasswordLabel}</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type="password"
              className="h-12 rounded-[15px] pr-11 focus-visible:ring-primary/25"
              {...formik.getFieldProps("newPassword")}
            />
            <EyeOff className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          <PasswordStrengthMeter password={formik.values.newPassword} />
          {formik.touched.newPassword && formik.errors.newPassword && (
            <p className="text-destructive text-xs">{formik.errors.newPassword}</p>
          )}
        </div>
        <div className="rounded-[18px] border border-border bg-muted/45 p-3.5 text-[13px] text-muted-foreground dark:bg-muted/20">
          <PasswordRequirement>{dict.resetPassword.requirements.minimumChars}</PasswordRequirement>
          <PasswordRequirement>{dict.resetPassword.requirements.numberAndSpecial}</PasswordRequirement>
          <PasswordRequirement>{dict.resetPassword.requirements.differentFromPrevious}</PasswordRequirement>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirmNewPassword">{dict.resetPassword.confirmNewPasswordLabel}</Label>
          <div className="relative">
            <Input
              id="confirmNewPassword"
              type="password"
              className="h-12 rounded-[15px] pr-11"
              {...formik.getFieldProps("confirmNewPassword")}
            />
            {formik.values.confirmNewPassword && formik.values.confirmNewPassword === formik.values.newPassword ? (
              <CheckCircle2 className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-secondary-600" fill="currentColor" />
            ) : (
              <EyeOff className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            )}
          </div>
          {formik.touched.confirmNewPassword && formik.errors.confirmNewPassword && (
            <p className="text-destructive text-xs">{formik.errors.confirmNewPassword}</p>
          )}
        </div>
        <Button type="submit" size="xl" className="mt-1 rounded-[16px]" disabled={isLoading}>
          {dict.resetPassword.saveAndLoginButton}
        </Button>
      </form>
    </div>
  )
}

function PasswordRequirement({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <CheckCircle2 className="size-3.5 shrink-0 text-secondary-600" />
      <span>{children}</span>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordPageContent />
    </Suspense>
  )
}
