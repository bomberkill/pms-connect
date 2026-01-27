"use client";

import { useFormik } from "formik";
import * as yup from "yup";
import { useDictionary, useNotification } from "@/lib/hooks";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { updateUnverifiedEmail } from "@/redux/services/userService";
import { FirebaseError } from "firebase/app";

interface ChangeEmailFormProps {
  currentEmail: string;
  onSuccess: (newEmail: string) => void;
  onCancel: () => void;
}

export function ChangeEmailForm({ currentEmail, onSuccess, onCancel }: ChangeEmailFormProps) {
  const dict = useDictionary();
  const dispatch = useAppDispatch();
  const { open } = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = yup.object({
    newEmail: yup
      .string()
      .email(dict.validation.email.invalid)
      .required(dict.validation.email.required)
      .notOneOf([currentEmail], dict.validation.email.mustBeDifferent),
    password: yup.string().required(dict.validation.password.required),
  });

  const formik = useFormik({
    initialValues: {
      newEmail: "",
      password: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        await dispatch(
          updateUnverifiedEmail({
            oldEmail: currentEmail,
            newEmail: values.newEmail,
            password: values.password,
          })
        ).unwrap();

        open("success", dict.notifications.emailUpdated.title, { message: dict.notifications.emailUpdated.message });
        onSuccess(values.newEmail);
      } catch (error: unknown) {
        let errorMessage = dict.notifications.updateFailed.defaultMessage;
        if (error instanceof FirebaseError) {
            switch (error.code) {
                case 'auth/invalid-credential':
                    errorMessage = dict.notifications.login.error.messages["auth/invalid-credential"];
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = dict.validation.email.alreadyInUse;
                    break;
                default:
                    errorMessage = error.message;
            }
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        open("error", dict.notifications.updateFailed.title, { message: errorMessage });
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="newEmail">{dict.changeEmail.newEmail}</Label>
        <Input id="newEmail" type="email" {...formik.getFieldProps("newEmail")} />
        {formik.touched.newEmail && formik.errors.newEmail && (
          <p className="text-red-500 text-xs">{formik.errors.newEmail}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{dict.login.passwordLabel}</Label>
        <Input id="password" type="password" {...formik.getFieldProps("password")} />
        {formik.touched.password && formik.errors.password && (
          <p className="text-red-500 text-xs">{formik.errors.password}</p>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {dict.button.cancel}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {dict.button.save}
        </Button>
      </div>
    </form>
  );
}