import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepProps } from "../types";
import { useDictionary } from "@/hooks/use-dictionary";
import { Building2, Check, LucideIcon, UserRound } from "lucide-react";
import { EntityTypeGQL, SpecialityGQL, UserTypeGQL } from "@/types/User";
import { cn } from "@/lib/utils";

interface AccountTypeCardProps {
    id: string;
    value: UserTypeGQL;
    selected: boolean;
    icon: LucideIcon;
    iconShape: "person" | "establishment";
    title: string;
    description: string;
    chips: string[];
}

function AccountTypeCard({
    id,
    value,
    selected,
    icon: Icon,
    iconShape,
    title,
    description,
    chips,
}: AccountTypeCardProps) {
    return (
        <label
            htmlFor={id}
            className={cn(
                "flex cursor-pointer flex-col gap-3 rounded-card border bg-card p-4 transition-colors",
                selected
                    ? "border-primary bg-primary-50/70 ring-1 ring-primary dark:bg-primary-950/70"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
            )}
        >
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "flex size-11 shrink-0 items-center justify-center",
                        iconShape === "person" ? "rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200" : "rounded-button bg-secondary-100 text-secondary-800 dark:bg-secondary-950 dark:text-secondary-200"
                    )}
                >
                    <Icon className="size-5" strokeWidth={1.9} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                    <span className="block text-base font-semibold leading-tight">{title}</span>
                    <span className="mt-1 block text-[13.5px] leading-snug text-muted-foreground">{description}</span>
                </div>
                <RadioGroupItem value={value} id={id} className="sr-only" />
                <span
                    className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card"
                    )}
                    aria-hidden="true"
                >
                    {selected && <Check className="size-3" strokeWidth={3} />}
                </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                    <span
                        key={chip}
                        className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            selected
                                ? "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-100"
                                : "bg-muted text-muted-foreground"
                        )}
                    >
                        {chip}
                    </span>
                ))}
            </div>
        </label>
    );
}

export const StepUserType: React.FC<StepProps> = ({ formik }) => {
    const dict = useDictionary();
    const selected = formik.values.userType as UserTypeGQL;

    return (
        <div className="flex w-full flex-col gap-3">
            <RadioGroup onValueChange={(value) => formik.setFieldValue('userType', value)} value={formik.values.userType}>
                <AccountTypeCard
                    id="option-one"
                    value={UserTypeGQL.INDIVIDUAL}
                    selected={selected === UserTypeGQL.INDIVIDUAL}
                    icon={UserRound}
                    iconShape="person"
                    title={dict.register.individual}
                    description={dict.register.individualDescription}
                    chips={[
                        dict.specialities[SpecialityGQL.MEDICAL_DOCTORS],
                        dict.specialities[SpecialityGQL.NURSES],
                        dict.specialities[SpecialityGQL.PHARMACISTS],
                    ]}
                />
                <AccountTypeCard
                    id="option-two"
                    value={UserTypeGQL.LEGAL_ENTITY}
                    selected={selected === UserTypeGQL.LEGAL_ENTITY}
                    icon={Building2}
                    iconShape="establishment"
                    title={dict.register.legalEntity}
                    description={dict.register.legalEntityDescription}
                    chips={[
                        dict.entityTypes[EntityTypeGQL.HOSPITAL],
                        dict.entityTypes[EntityTypeGQL.CLINIC],
                        dict.entityTypes[EntityTypeGQL.LABORATORY],
                    ]}
                />
            </RadioGroup>
        </div>
    );
};
