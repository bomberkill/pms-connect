import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StepProps } from "../types";
import { useDictionary } from "@/hooks/use-dictionary";
import { UserTypeGQL, SpecialityGQL, EntityTypeGQL } from "@/types/User";

export const StepIdentity: React.FC<StepProps> = ({ formik }) => {
    const dict = useDictionary();

    if (formik.values.userType === UserTypeGQL.INDIVIDUAL) {
        return (
            <div className="w-full xs:max-w-4/5 sm:max-w-3/5 md:max-w-2/5">
                <div className="max-w-full flex flex-col gap-6">
                    <div className="flex items-start gap-3">
                        <div className="grid gap-1 w-full">
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
                        <div className="grid gap-1 w-full">
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
                    <div className="grid gap-1">
                        <Label htmlFor="speciality">{dict.register.specialityLabel}</Label>
                        <Select onValueChange={(value) => formik.setFieldValue('speciality', value)} value={formik.values.speciality}>
                            <SelectTrigger className="min-w-full" id="speciality">
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
                    <div className="grid gap-1">
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
                </div>
            </div>
        );
    }

    return (
        <div className="w-full xs:max-w-4/5 sm:max-w-3/5 md:max-w-2/5">
            <div className="max-w-full flex flex-col gap-6">
                <div className="grid gap-1">
                    <Label htmlFor="entityName">{dict.register.entityNameLabel}</Label>
                    <Input
                        id="entityName"
                        name="entityName"
                        type="text"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.entityName}
                    />
                    {formik.touched.entityName && formik.errors.entityName && (
                        <p className="text-destructive text-xs">{formik.errors.entityName}</p>
                    )}
                </div>
                <div className="grid gap-1">
                    <Label htmlFor="entityType">{dict.register.entityTypeLabel}</Label>
                    <Select onValueChange={(value) => formik.setFieldValue('entityType', value)} value={formik.values.entityType}>
                        <SelectTrigger className="w-full" id="entityType">
                            <SelectValue placeholder={dict.register.entityTypeLabel} />
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
            </div>
        </div>
    );
};
