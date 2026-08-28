import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhoneInput from "@/components/PhoneInput";
import Image from "next/image";
import { StepProps } from "../types";
import { useDictionary } from "@/hooks/use-dictionary";
import { AuthUser } from "@/graphql/betterAuth";
import { PasswordStrengthMeter } from "../PasswordStrengthMeter";
import { CheckCircle2 } from "lucide-react";

interface StepCredentialsProps extends StepProps {
    googleUser: AuthUser | null;
    handleGoogleSignIn: () => void;
}

export const StepCredentials: React.FC<StepCredentialsProps> = ({ formik, googleUser, handleGoogleSignIn }) => {
    const dict = useDictionary();
    const emailIsValid = Boolean(formik.values.email && !formik.errors.email);

    return (
        <div className="flex w-full flex-col gap-5">
            <div className="grid gap-1.5">
                <Label htmlFor="email">{dict.register.emailLabel}</Label>
                <div className="relative">
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="email@example.com"
                        className={emailIsValid ? "pr-10" : undefined}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.email}
                        disabled={!!googleUser}
                        readOnly={!!googleUser}
                    />
                    {emailIsValid && (
                        <CheckCircle2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-secondary-600" strokeWidth={2.4} />
                    )}
                </div>
                {googleUser && (
                    <p className="text-muted-foreground text-xs">{dict.register.emailVerifiedByGoogle}</p>
                )}
                {formik.touched.email && formik.errors.email && (
                    <p className="text-destructive text-xs">{formik.errors.email}</p>
                )}
            </div>
            <div className="grid gap-1.5">
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
                <div className="rounded-card border border-primary/20 bg-primary-50 p-4 dark:bg-primary-950">
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
                    <div className="grid gap-1.5">
                        <Label htmlFor="password">{dict.register.passwordLabel}</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="password"
                            className={formik.values.password ? "border-primary focus-visible:ring-primary/20" : undefined}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.password}
                        />
                        <PasswordStrengthMeter password={formik.values.password ?? ""} />
                        {formik.touched.password && formik.errors.password && (
                            <p className="text-destructive text-xs">{formik.errors.password}</p>
                        )}
                    </div>
                    <div className="grid gap-1.5">
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
            {!googleUser && (
                <>
                    <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                        <span className="bg-background text-muted-foreground relative z-10 px-3">{dict.login.continueWith}</span>
                    </div>
                    <Button type="button" variant="outline" onClick={handleGoogleSignIn} className="w-full">
                        <Image src="/google-color.svg" alt="" width={16} height={16} className="h-4 w-4" />
                        {dict.login.googleButton}
                    </Button>
                </>
            )}
        </div>
    );
};
