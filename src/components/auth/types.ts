import { CreateUserInput } from "@/types/User";
import { FormikProps } from "formik";

export interface RegisterFormValues extends CreateUserInput {
    password?: string;
    confirmPassword?: string;
    verificationCode: string;
    profilePicFile: File | null;
    coverPicFile: File | null;
    accreditationsFile: File[];
}

export interface StepProps {
    formik: FormikProps<RegisterFormValues>;
    isLoading?: boolean;
}

export interface AccreditationPreviewItem {
    url: string;
    name?: string;
    type?: string;
}
