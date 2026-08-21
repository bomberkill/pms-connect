import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/Combobox";
import { Trash2, Plus, File as FileIcon } from "lucide-react";
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

    return (
        <div className="w-full flex flex-col gap-6 xs:max-w-4/5 sm:max-w-3/5 md:max-w-5/10">
            {/* Profile Picture */}
            <div className="grid gap-2">
                <Label>{dict.register.uploadProfilePic}</Label>
                <div className="flex justify-center items-center border-2 border-border border-dashed h-40 w-full rounded-md">
                    {profilePicPreview ? (
                        <div className="relative">
                            <Image src={profilePicPreview} alt="Profile preview" width={32} height={32} className="h-32 w-32 rounded-full object-cover relative" />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="cursor-pointer absolute top-2 right-2 h-6 w-6 bg-background/80 rounded-full"
                                onClick={() => {
                                    setProfilePicPreview(null);
                                    formik.setFieldValue("profilePicFile", null);
                                }}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center items-center gap-5">
                            <div className="flex flex-col justify-center items-center gap-1">
                                <Label className="text-sm font-medium">{dict.register.uploadProfilePic}</Label>
                                <Label className="text-xs text-muted-foreground font-medium">{dict.register.uploadProfilePic}</Label>
                            </div>
                            <label htmlFor="profilePicFile">
                                <div className="rounded-sm bg-secondary py-1 px-3 cursor-pointer hover:bg-secondary/80 transition-colors">
                                    <span className="text-xs font-medium">Upload</span>
                                </div>
                            </label>
                        </div>
                    )}
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
            </div>

            {/* Cover Picture */}
            <div className="grid gap-2">
                <Label htmlFor="coverPicFile">{dict.register.uploadCoverPic}</Label>
                <div className="flex justify-center items-center border-2 border-border border-dashed h-40 w-full rounded-md">
                    {coverPicPreview ? (
                        <div className="relative w-full h-40">
                            <Image src={coverPicPreview} alt="Cover preview" fill className="h-40 w-full rounded-md object-cover relative" />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="cursor-pointer absolute top-2 right-2 h-6 w-6 bg-background/80 rounded-full"
                                onClick={() => {
                                    setCoverPicPreview(null);
                                    formik.setFieldValue("coverPicFile", null);
                                }}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center items-center gap-5">
                            <div className="flex flex-col justify-center items-center gap-1">
                                <Label className="text-sm font-medium">{dict.register.uploadCoverPic}</Label>
                                <Label className="text-xs text-muted-foreground font-medium">{dict.register.uploadCoverPic}</Label>
                            </div>
                            <label htmlFor="coverPicFile">
                                <div className="rounded-sm bg-secondary py-1 px-3 cursor-pointer hover:bg-secondary/80 transition-colors">
                                    <span className="text-xs font-medium">Upload</span>
                                </div>
                            </label>
                        </div>
                    )}
                </div>
                <Input className="hidden" id="coverPicFile" name="coverPicFile" type="file" accept="image/png, image/jpeg" onChange={(event) => {
                    const file = event.currentTarget.files?.[0];
                    formik.setFieldValue("coverPicFile", file);
                    setCoverPicPreview(file ? URL.createObjectURL(file) : null);
                }} />
                {formik.touched.coverPicFile && formik.errors.coverPicFile && <p className="text-destructive text-xs">{formik.errors.coverPicFile}</p>}
            </div>

            {/* Accreditations */}
            <div className="grid gap-2">
                <Label >{dict.register.professionalAccreditations}</Label>
                <div className="flex justify-center items-center border-2 border-border border-dashed h-40 w-full rounded-md">
                    {accreditationsPreview.length > 0 ?
                        (
                            <div className="flex px-2 flex-col justify-center gap-5 items-center w-full h-full">
                                <div className="flex flex-col justify-center items-start gap-2">
                                    {accreditationsPreview.map((accreditation, index) => (
                                        <div key={index} className="flex justify-center items-center gap-2 relative">
                                            <FileIcon className="w-7 h-7  p-1 bg-secondary rounded-sm relative" />
                                            <span className="text-sm">{accreditation.name}</span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className=" cursor-pointer h-6 w-6 bg-background/80 rounded-full"
                                                onClick={() => {
                                                    formik.setFieldValue('accreditationsFile', formik.values.accreditationsFile.filter((_, i) => i !== index))
                                                    setAccreditationsPreview(prev => prev.filter((_, i) => i !== index))
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <div className={accreditationsPreview.length < 2 ? "block" : "hidden"}>
                                    <label htmlFor="accreditations-input">
                                        <div className="rounded-sm bg-secondary p-1 cursor-pointer hover:bg-secondary/80 transition-colors">
                                            <Plus />
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )
                        : (
                            <div className="flex flex-col justify-center items-center gap-5">
                                <div className="flex flex-col justify-center items-center gap-1">
                                    <Label className="text-sm font-medium">{dict.register.uploadAccreditations}</Label>
                                    <Label className="text-xs text-muted-foreground font-medium">{dict.register.uploadAccreditations}</Label>
                                </div>
                                <label htmlFor="accreditations-input">
                                    <div className="rounded-sm bg-secondary py-1 px-3 cursor-pointer hover:bg-secondary/80 transition-colors">
                                        <span className="text-xs font-medium">Upload</span>
                                    </div>
                                </label>
                            </div>
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
            </div>

            {/* Location — kept deliberately light (city + country only, no
                state/province or full address): this step is optional, and
                the mockup shows a single "Ville d'exercice" field. Country
                stays a searchable Combobox since the API requires it the
                moment a location is sent at all; city is free text rather
                than a cascading picker to avoid forcing state selection
                first for a field the mockup treats as one simple input. */}
            <div className="grid gap-1 w-full">
                <Label htmlFor="city">{dict.register.cityLabel}</Label>
                <Input
                    id="city"
                    name="location.city"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.location?.city}
                />
                {cityTouched && cityError && (
                    <p className="text-destructive text-xs">{cityError}</p>
                )}
            </div>
            <div className="grid gap-1 w-full">
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
        </div>
    );
};
