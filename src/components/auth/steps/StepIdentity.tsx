import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StepProps } from "../types";
import { useDictionary } from "@/hooks/use-dictionary";
import { UserTypeGQL, SpecialityGQL, EntityTypeGQL } from "@/types/User";
import { Building2, Clock3, Stethoscope } from "lucide-react";

export const StepIdentity: React.FC<StepProps> = ({ formik }) => {
    const dict = useDictionary();

    if (formik.values.userType === UserTypeGQL.INDIVIDUAL) {
        return (
            <div className="flex w-full flex-col gap-5">
                <div className="flex items-start gap-3 rounded-card border border-border bg-card p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-button bg-secondary-100 text-secondary-700 dark:bg-secondary-950 dark:text-secondary-300">
                        <Stethoscope className="size-5" strokeWidth={1.8} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold">{dict.register.stepDetailsTitle}</p>
                        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{dict.register.stepDetailsDescription}</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="firstName">{dict.register.firstNameLabel}</Label>
                        <Input
                            id="firstName"
                            name="firstName"
                            type="text"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.firstName}
                        />
                        {formik.touched.firstName && formik.errors.firstName && (
                            <p className="text-destructive text-xs">{formik.errors.firstName}</p>
                        )}
                    </div>
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="lastName">{dict.register.lastNameLabel}</Label>
                        <Input
                            id="lastName"
                            name="lastName"
                            type="text"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.lastName}
                        />
                        {formik.touched.lastName && formik.errors.lastName && (
                            <p className="text-destructive text-xs">{formik.errors.lastName}</p>
                        )}
                    </div>
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="speciality">{dict.register.specialityLabel}</Label>
                    <Select onValueChange={(value) => formik.setFieldValue('speciality', value)} value={formik.values.speciality}>
                        <SelectTrigger className="w-full" id="speciality">
                            <SelectValue placeholder={dict.register.specialityLabel} />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(SpecialityGQL).map(([key, value]) => (
                                <SelectItem key={key} value={value}>
                                    {dict.specialities[key as keyof typeof dict.specialities]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {formik.touched.speciality && formik.errors.speciality && (
                        <p className="text-destructive text-xs">{formik.errors.speciality}</p>
                    )}
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="professionalTitle">{dict.register.professionalTitleLabel}</Label>
                    <Input
                        id="professionalTitle"
                        name="professionalTitle"
                        type="text"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.professionalTitle}
                    />
                </div>
                <div className="flex items-start gap-3 rounded-card border border-tertiary-200 bg-tertiary-50 p-4 text-tertiary-900 dark:border-tertiary-900 dark:bg-tertiary-950 dark:text-tertiary-200">
                    <Clock3 className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
                    <p className="text-xs leading-5">
                        {dict.pendingApproval.timelineReviewDescription}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-5">
            <div className="flex items-start gap-3 rounded-[18px] border border-border bg-card p-4 shadow-xs">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-secondary-100 text-secondary-700 dark:bg-secondary-950 dark:text-secondary-300">
                    <Building2 className="size-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold">{dict.register.stepDetailsTitleEntity}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{dict.register.stepDetailsDescriptionEntity}</p>
                </div>
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="entityName">{dict.register.entityLegalNameLabel}</Label>
                <Input
                    id="entityName"
                    name="entityName"
                    type="text"
                    className="h-12 rounded-[15px]"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.entityName}
                />
                {formik.touched.entityName && formik.errors.entityName && (
                    <p className="text-destructive text-xs">{formik.errors.entityName}</p>
                )}
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="entityType">{dict.register.entityStructureTypeLabel}</Label>
                <Select onValueChange={(value) => formik.setFieldValue('entityType', value)} value={formik.values.entityType}>
                    <SelectTrigger className="h-12 w-full rounded-[15px]" id="entityType">
                        <SelectValue placeholder={dict.register.entityStructureTypeLabel} />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(EntityTypeGQL).map(([key, value]) =>
                            <SelectItem key={key} value={value}>{dict.entityTypes[key as keyof typeof dict.entityTypes]}</SelectItem>
                        )}
                    </SelectContent>
                </Select>
                {formik.touched.entityType && formik.errors.entityType && (
                    <p className="text-destructive text-xs">{formik.errors.entityType}</p>
                )}
            </div>
            <div className="flex items-start gap-3 rounded-[18px] border border-tertiary-200 bg-tertiary-50 p-4 text-tertiary-900 dark:border-tertiary-900 dark:bg-tertiary-950 dark:text-tertiary-200">
                <Clock3 className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
                <p className="text-xs leading-5">{dict.pendingApproval.timelineReviewDescription}</p>
            </div>
        </div>
    );
};
