import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhoneInput from "@/components/PhoneInput";
import Image from "next/image";
import { StepProps } from "../types";
import { useDictionary } from "@/hooks/use-dictionary";
import { User } from "firebase/auth";

interface StepCredentialsProps extends StepProps {
    googleUser: User | null;
    handleGoogleSignIn: () => void;
}

export const StepCredentials: React.FC<StepCredentialsProps> = ({ formik, googleUser, handleGoogleSignIn }) => {
    const dict = useDictionary();

    return (
        <div className="flex flex-col gap-6 min-w-full xs:min-w-full sm:min-w-3/5 md:min-w-2/5">
            <div className="grid gap-1">
                <Label htmlFor="email">{dict.register.emailLabel}</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    onChange={(event) => {
                        formik.handleChange(event);
                        // If we had logic to reset googleUser, it should be passed down or handled in effect
                        // But typically purely visual here
                    }}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                />
                {formik.touched.email && formik.errors.email && (
                    <p className="text-destructive text-xs">{formik.errors.email}</p>
                )}
            </div>
            <div className="grid gap-1">
                <PhoneInput
                    label={dict.register.phoneNmmberLabel}
                    value={formik.values.phoneNumber}
                    onChange={(val) => formik.setFieldValue("phoneNumber", val)}
                    onBlur={() => formik.setFieldTouched("phoneNumber", true)}
                    error={formik.errors.phoneNumber as string}
                    touched={formik.touched.phoneNumber}
                />
            </div>
            {googleUser ? (
                <div className="rounded-md border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4">
                    <div className="flex items-center gap-3">
                        <Image src="/google-color.svg" alt="Google" width={24} height={24} className="h-6 w-6" />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-primary">{dict.register.googleAccountLinked}</span>
                            <span className="text-xs text-primary/80">{dict.register.noPasswordNeeded}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="grid gap-1">
                        <Label htmlFor="password">{dict.register.passwordLabel}</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="password"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.password}
                        />
                        {formik.touched.password && formik.errors.password && (
                            <p className="text-destructive text-xs">{formik.errors.password}</p>
                        )}
                    </div>
                    <div className="grid gap-1">
                        <Label htmlFor="confirmPassword">{dict.register.confirmPasswordLabel}</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="confirm password"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.confirmPassword}
                        />
                        {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                            <p className="text-destructive text-xs">{formik.errors.confirmPassword}</p>
                        )}
                    </div>
                </>
            )}
            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-background relative z-10 px-3">
                    <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        className="rounded-full shadow-gray-200 border border-gray-200"
                    >
                        <Image src="/google-color.svg" alt="Google" width={16} height={16} className="h-4 w-4" />
                        <span className="sr-only">{dict.login.googleButton}</span>
                    </Button>
                </span>
            </div>
        </div>
    );
};
