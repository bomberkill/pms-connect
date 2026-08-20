import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepProps } from "../types";
import { useDictionary } from "@/hooks/use-dictionary";
import { UserTypeGQL } from "@/types/User";

export const StepUserType: React.FC<StepProps> = ({ formik }) => {
    const dict = useDictionary();

    return (
        <div className="flex w-full flex-col gap-3">
            <RadioGroup onValueChange={(value) => formik.setFieldValue('userType', value)} value={formik.values.userType}>
                <label htmlFor="option-one" className="flex cursor-pointer items-start gap-3 rounded-card border border-border p-4 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-50">
                    <RadioGroupItem value={UserTypeGQL.INDIVIDUAL} id="option-one" className="mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold">{dict.register.individual}</span>
                        <span className="text-xs text-muted-foreground">{dict.register.individualDescription}</span>
                    </div>
                </label>
                <label htmlFor="option-two" className="flex cursor-pointer items-start gap-3 rounded-card border border-border p-4 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-50">
                    <RadioGroupItem value={UserTypeGQL.LEGAL_ENTITY} id="option-two" className="mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold">{dict.register.legalEntity}</span>
                        <span className="text-xs text-muted-foreground">{dict.register.legalEntityDescription}</span>
                    </div>
                </label>
            </RadioGroup>
        </div>
    );
};
