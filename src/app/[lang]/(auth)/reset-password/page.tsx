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
      newPassword: yup.string().min(6, dict.validation.password.min).required(dict.validation.password.required),
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
      <div className="container relative flex min-h-svh flex-col items-center justify-center px-4 text-center gap-4">
        <p className="text-muted-foreground">{dict.resetPassword.invalidToken}</p>
        <Button onClick={() => router.push('/login')}>{dict.button.backToLogin}</Button>
      </div>
    )
  }

  return (
    <div className="container relative flex min-h-svh flex-col items-center justify-center px-4">
      <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6 w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">{dict.resetPassword.newPasswordTitle}</h1>
          <p className="text-muted-foreground text-sm text-balance">{dict.resetPassword.newPasswordDescription}</p>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="newPassword">{dict.resetPassword.newPasswordLabel}</Label>
          <Input id="newPassword" type="password" {...formik.getFieldProps("newPassword")} />
          {formik.touched.newPassword && formik.errors.newPassword && (
            <p className="text-red-500 text-xs">{formik.errors.newPassword}</p>
          )}
        </div>
        <div className="grid gap-1">
          <Label htmlFor="confirmNewPassword">{dict.resetPassword.confirmNewPasswordLabel}</Label>
          <Input id="confirmNewPassword" type="password" {...formik.getFieldProps("confirmNewPassword")} />
          {formik.touched.confirmNewPassword && formik.errors.confirmNewPassword && (
            <p className="text-red-500 text-xs">{formik.errors.confirmNewPassword}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
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
