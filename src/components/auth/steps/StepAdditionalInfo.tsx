import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/Combobox";
import { Trash2, Plus, File as FileIcon, Image as ImageIcon, MapPin, UploadCloud } from "lucide-react";
import Image from "next/image";
import { StepProps, AccreditationPreviewItem } from "../types";
import { useDictionary } from "@/hooks/use-dictionary";
import { Country } from "@/types/Location";
import data from "../../../../public/countries.json";
import { getIn } from "formik";

interface StepAdditionalInfoProps extends StepProps {
    profilePicPreview: string | null;
    setProfilePicPreview: (url: string | null) => void;
    coverPicPreview: string | null;
    setCoverPicPreview: (url: string | null) => void;
    accreditationsPreview: AccreditationPreviewItem[];
    setAccreditationsPreview: React.Dispatch<React.SetStateAction<AccreditationPreviewItem[]>>;
}

export const StepAdditionalInfo: React.FC<StepAdditionalInfoProps> = ({
    formik,
    profilePicPreview,
    setProfilePicPreview,
    coverPicPreview,
    setCoverPicPreview,
    accreditationsPreview,
    setAccreditationsPreview
}) => {
    const dict = useDictionary();
    const countries = useMemo(() => data as Country[], []);

    const countryError = getIn(formik.errors, "location.country");
    const countryTouched = getIn(formik.touched, "location.country");
    const cityError = getIn(formik.errors, "location.city");
    const cityTouched = getIn(formik.touched, "location.city");
    const initials = useMemo(() => {
        const first = formik.values.firstName?.[0] ?? formik.values.entityName?.[0] ?? "P";
        const last = formik.values.lastName?.[0] ?? "";
        return `${first}${last}`.toUpperCase();
    }, [formik.values.entityName, formik.values.firstName, formik.values.lastName]);

    return (
        <div className="flex w-full flex-col gap-5">
            <section className="overflow-hidden rounded-card border border-border bg-card shadow-xs">
                <div className="relative">
                    <label
                        htmlFor="coverPicFile"
                        className="relative flex h-28 cursor-pointer items-center justify-center overflow-hidden border-b border-border bg-muted"
                    >
                        {coverPicPreview ? (
                            <Image src={coverPicPreview} alt="Cover preview" fill className="object-cover" />
                        ) : (
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <ImageIcon className="size-4" />
                                {dict.register.uploadCoverPic}
                            </div>
                        )}
                        <span className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
                        <span className="absolute right-3 top-3 rounded-button border border-white/50 bg-white/85 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-xs backdrop-blur-sm dark:border-white/10 dark:bg-neutral-950/70 dark:text-white">
                            {coverPicPreview ? dict.button.edit : "Upload"}
                        </span>
                    </label>
                    {coverPicPreview && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-3 bottom-3 size-8 cursor-pointer rounded-full bg-black/55 text-white hover:bg-black/70 hover:text-white"
                            onClick={() => {
                                setCoverPicPreview(null);
                                formik.setFieldValue("coverPicFile", null);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    <div className="absolute -bottom-9 left-4">
                        <label htmlFor="profilePicFile" className="relative block size-[72px] cursor-pointer">
                            {profilePicPreview ? (
                                <Image src={profilePicPreview} alt="Profile preview" fill className="rounded-full border-[3px] border-card object-cover shadow-xs" />
                            ) : (
                                <span className="flex size-[72px] items-center justify-center rounded-full border-[3px] border-card bg-gradient-to-br from-secondary-200 to-primary-200 font-heading text-2xl font-semibold text-primary-900 shadow-xs dark:from-secondary-900 dark:to-primary-950 dark:text-primary-100">
                                    {initials}
                                </span>
                            )}
                            <span className="absolute -right-1 bottom-0 flex size-7 items-center justify-center rounded-full border-[3px] border-card bg-primary text-primary-foreground">
                                <Plus className="size-3.5" />
                            </span>
                        </label>
                    </div>
                </div>
                <Input
                    id="profilePicFile"
                    name="profilePicFile"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg"
                    onChange={(event) => {
                        const file = event.currentTarget.files?.[0];
                        formik.setFieldValue("profilePicFile", file);
                        setProfilePicPreview(file ? URL.createObjectURL(file) : null);
                    }}
                />
                {formik.touched.profilePicFile && formik.errors.profilePicFile && <p className="text-destructive text-xs">{formik.errors.profilePicFile}</p>}
                <Input className="hidden" id="coverPicFile" name="coverPicFile" type="file" accept="image/png, image/jpeg" onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    formik.setFieldValue("coverPicFile", file);
                    setCoverPicPreview(file ? URL.createObjectURL(file) : null);
                }} />
                {formik.touched.coverPicFile && formik.errors.coverPicFile && <p className="text-destructive text-xs">{formik.errors.coverPicFile}</p>}
                <div className="px-4 pb-4 pt-12">
                    <p className="font-heading text-lg font-semibold tracking-tight">{dict.register.stepProfileTitle}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{dict.register.stepProfileDescription}</p>
                </div>
            </section>

            <section className="grid gap-3">
                <div className="grid gap-1.5">
                    <Label htmlFor="city">{dict.register.cityLabel}</Label>
                    <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="city"
                            name="location.city"
                            className="pl-9"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.location?.city}
                        />
                    </div>
                    {cityTouched && cityError && (
                        <p className="text-destructive text-xs">{cityError}</p>
                    )}
                </div>
                <div className="grid gap-1.5">
                    <Label htmlFor="country">{dict.register.countryLabel}</Label>
                    <Combobox<Country>
                        id="country"
                        name="location.country"
                        data={countries}
                        error={countryError}
                        touched={countryTouched}
                        onBlur={formik.handleBlur}
                        value={formik.values.location?.country}
                        onChange={(country) => {
                            formik.setFieldValue('location.country', country.name);
                        }}
                        placeholder={dict.combobox.selectCountry}
                        searchable={false}
                    />
                    {countryTouched && countryError && (
                        <p className="text-destructive text-xs">{countryError}</p>
                    )}
                </div>
            </section>

            <section className="grid gap-3">
                <div className="flex items-baseline justify-between gap-3">
                    <Label>{dict.register.professionalAccreditations}</Label>
                    <span className="text-right text-xs text-muted-foreground">PDF/JPG/PNG</span>
                </div>
                <div className="grid gap-2">
                    {accreditationsPreview.map((accreditation, index) => (
                        <div key={`${accreditation.name}-${index}`} className="flex items-center gap-3 rounded-card border border-border bg-card px-3 py-2.5">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-field bg-secondary-100 text-secondary-700 dark:bg-secondary-950 dark:text-secondary-300">
                                <FileIcon className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">{accreditation.name}</p>
                                <p className="text-xs text-muted-foreground">{accreditation.type || dict.common.document}</p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-full text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                    formik.setFieldValue('accreditationsFile', formik.values.accreditationsFile.filter((_, i) => i !== index))
                                    setAccreditationsPreview(prev => prev.filter((_, i) => i !== index))
                                }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {accreditationsPreview.length < 2 && (
                        <label
                            htmlFor="accreditations-input"
                            className="flex cursor-pointer items-center gap-3 rounded-card border border-dashed border-border bg-card px-3 py-3 transition-colors hover:border-primary/50 hover:bg-primary-50/50 dark:hover:bg-primary-950/40"
                        >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-field bg-muted text-muted-foreground">
                                <UploadCloud className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold">{dict.register.uploadAccreditations}</span>
                                <span className="block text-xs text-muted-foreground">PDF, JPG, PNG</span>
                            </span>
                        </label>
                    )}
                    <Input
                        id="accreditations-input"
                        name="accreditationsFile"
                        multiple
                        type="file"
                        className="hidden"
                        accept="application/pdf, image/jpeg, image/png"
                        onChange={(event) => {
                            const files = Array.from(event.currentTarget.files || []);
                            if (files.length > 0) {
                                formik.setFieldValue('accreditationsFile', [...formik.values.accreditationsFile, ...files]);
                                const newPreviews = files.map(file => ({ url: URL.createObjectURL(file), name: file.name, type: file.type }));
                                setAccreditationsPreview(prev => [...prev, ...newPreviews]);
                            }
                        }}
                        disabled={accreditationsPreview.length >= 2}
                    />
                </div>
                {formik.touched.accreditationsFile && formik.errors.accreditationsFile && <p className="text-destructive text-xs">{formik.errors.accreditationsFile.toString()}</p>}
            </section>
        </div>
    );
};
