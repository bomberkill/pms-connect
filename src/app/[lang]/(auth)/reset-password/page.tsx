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
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-muted-foreground text-sm">{dict.resetPassword.invalidToken}</p>
        <Button onClick={() => router.push('/login')}>{dict.button.backToLogin}</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-sm flex-col justify-center gap-8 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-bold tracking-tight">{dict.resetPassword.newPasswordTitle}</h1>
        <p className="text-muted-foreground text-sm">{dict.resetPassword.newPasswordDescription}</p>
      </div>
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-1.5">
          <Label htmlFor="newPassword">{dict.resetPassword.newPasswordLabel}</Label>
          <Input id="newPassword" type="password" {...formik.getFieldProps("newPassword")} />
          <PasswordStrengthMeter password={formik.values.newPassword} />
          {formik.touched.newPassword && formik.errors.newPassword && (
            <p className="text-destructive text-xs">{formik.errors.newPassword}</p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="confirmNewPassword">{dict.resetPassword.confirmNewPasswordLabel}</Label>
          <Input id="confirmNewPassword" type="password" {...formik.getFieldProps("confirmNewPassword")} />
          {formik.touched.confirmNewPassword && formik.errors.confirmNewPassword && (
            <p className="text-destructive text-xs">{formik.errors.confirmNewPassword}</p>
          )}
        </div>
        <Button type="submit" size="xl" disabled={isLoading}>
          {dict.resetPassword.submitButton}
        </Button>
      </form>
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
