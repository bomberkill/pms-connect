import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepProps } from "../types";
import { useDictionary } from "@/hooks/use-dictionary";
import { UserTypeGQL } from "@/types/User";

export const StepUserType: React.FC<StepProps> = ({ formik }) => {
    const dict = useDictionary();

    return (
        <div className="flex flex-col gap-6 w-full sm:max-w-4/5 md:max-w-3/5 ">
            <RadioGroup onValueChange={(value) => formik.setFieldValue('userType', value)} value={formik.values.userType}>
                <label htmlFor="option-one" className="flex cursor-pointer items-center space-x-2 p-5 border border-border rounded-md hover:border-primary/50 transition-colors">
                    <RadioGroupItem value={UserTypeGQL.INDIVIDUAL} id="option-one" />
                    <div className="flex flex-col gap-0 md:gap-1">
                        <span className="text-sm font-medium">{dict.register.individual}</span>
                        <span className="text-xs text-muted-foreground font-medium">{dict.register.individualDescription}</span>
                    </div>
                </label>
                <label htmlFor="option-two" className="flex cursor-pointer items-center space-x-2 p-5 border border-border rounded-md hover:border-primary/50 transition-colors">
                    <RadioGroupItem value={UserTypeGQL.LEGAL_ENTITY} id="option-two" />
                    <div className="flex flex-col gap-0 md:gap-1">
                        <span className="text-sm font-medium">{dict.register.legalEntity}</span>
                        <span className="text-xs text-muted-foreground font-medium">{dict.register.legalEntityDescription}</span>
                    </div>
                </label>
            </RadioGroup>
        </div>
    );
};
