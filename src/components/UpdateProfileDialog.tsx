"use client"

import { useDictionary } from "@/hooks/use-dictionary"
import { useNotification } from "@/hooks/use-notification"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Combobox } from "./Combobox"
import { City, Country, State } from "@/types/Location"
import data from "../../public/countries.json"
import { useFormik, getIn } from "formik"
import * as yup from "yup"
import { useEffect, useMemo, useState } from "react"
import { User, UserTypeGQL, UpdateUserInput, ProfessionalAccreditation } from "@/types/User"
import { FileIcon, Loader2, Trash2 } from "lucide-react"
import { updateUser } from "@/graphql/authActions"
import { uploadFileToR2 } from "@/utils/fileUpload"
import { useIsMobile } from "@/hooks/use-mobile"
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getUserDisplayName, getUserInitials } from "@/lib/user-utils"
import { Camera, Plus } from "lucide-react"
import ProfessionalExperienceDialog from "@/components/profile/ProfessionalExperienceDialog"
import { useProfessionalExperiences } from "@/hooks/useData"

interface UpdateProfileDialogProps {
  children: React.ReactNode // Le bouton qui déclenche l'ouverture
  user: User
}

function AccreditationSection({
  dict,
  accreditations,
  existingCount,
  uploading,
  onFileChange,
  onRemove,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any
  accreditations: ProfessionalAccreditation[]
  existingCount: number
  uploading: boolean
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="grid gap-2">
      <Label>{dict.updateProfile.accreditations.title}</Label>
      {accreditations.length > 0 && (
        <ul className="space-y-1.5">
          {accreditations.map((acc, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-field border border-border px-3 py-2 text-sm">
              <a href={acc.documentUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 min-w-0 hover:underline">
                <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate">{acc.issuingAuthority || acc.accreditationType || dict.updateProfile.accreditations.document}</span>
              </a>
              {i >= existingCount && (
                <button type="button" onClick={() => onRemove(i)} aria-label={dict.actions.delete} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <label className="inline-flex items-center gap-2 text-sm text-primary cursor-pointer w-fit">
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <FileIcon className="size-4" />}
        {dict.updateProfile.accreditations.addButton}
        <input
          type="file"
          className="hidden"
          accept="application/pdf, image/jpeg, image/png"
          disabled={uploading}
          onChange={onFileChange}
        />
      </label>
    </div>
  )
}

export default function UpdateProfileDialog({ children, user }: UpdateProfileDialogProps) {
  const dict = useDictionary()
  const { open: openNotification } = useNotification()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingAccreditation, setUploadingAccreditation] = useState(false)
  const [uploadingProfilePhoto, setUploadingProfilePhoto] = useState(false)
  const isMobile = useIsMobile()
  const { addProfessionalExperience, adding: addingExperience } = useProfessionalExperiences(user.id)

  // États pour les listes déroulantes de localisation
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [selectedState, setSelectedState] = useState<State | null>(null)

  const validationSchema = useMemo(() => {
    const commonSchema = {
      bio: yup.string().notRequired(),
      websiteUrl: yup.string().url(dict.validation.websiteUrl.invalidUrl).notRequired(),
      location: yup.object().shape({
        country: yup.string().notRequired(),
        stateOrProvince: yup.string().notRequired(),
        city: yup.string().notRequired(),
      }),
    }
    if (user.userType === UserTypeGQL.INDIVIDUAL) {
      return yup.object().shape({
        ...commonSchema,
        firstName: yup.string().required(dict.register.firstNameLabel),
        lastName: yup.string().required(dict.register.lastNameLabel),
        professionalTitle: yup.string().notRequired(),
      })
    } else {
      return yup.object().shape({
        ...commonSchema,
        entityName: yup.string().required(dict.register.entityNameLabel),
      })
    }
  }, [dict, user.userType]);

  const formik = useFormik<Partial<UpdateUserInput>>({
    initialValues: {
      firstName: "firstName" in user ? user.firstName : "",
      lastName: "lastName" in user ? user.lastName : "",
      professionalTitle: "professionalTitle" in user ? user.professionalTitle : "",
      entityName: "entityName" in user ? user.entityName : "",
      bio: user.bio || "",
      websiteUrl: user.websiteUrl || "",
      professionalAccreditation: user.professionalAccreditation || [],
      profilePicUrl: user.profilePicUrl || "",
      location: {
        country: user.location?.country || "",
        stateOrProvince: user.location?.stateOrProvince || "",
        city: user.location?.city || "",
      },
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setIsLoading(true)
      // Ne prépare que les champs qui ont été modifiés
      const changedValues: UpdateUserInput = {}
      for (const key in values) {
        if (JSON.stringify(values[key as keyof typeof values]) !== JSON.stringify(formik.initialValues[key as keyof typeof formik.initialValues])) {
          (changedValues as Record<string, unknown>)[key] = values[key as keyof typeof values];
        }
      }

      if (Object.keys(changedValues).length === 0) {
        openNotification("info", dict.notifications.noChanges.title, { message: dict.notifications.noChanges.message })
        setIsLoading(false)
        setOpen(false)
        return
      }

      try {
        await updateUser(changedValues)
        openNotification("success", dict.notifications.profileUpdated.title, { message: dict.notifications.profileUpdated.message })
        setOpen(false)
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : dict.notifications.updateFailed.defaultMessage;
        openNotification("error", dict.notifications.updateFailed.title, { message: errorMessage })
      } finally {
        setIsLoading(false)
      }
    },
  })

  const handleAccreditationFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadingAccreditation(true)
    try {
      const { publicUrl } = await uploadFileToR2(file, "ACCREDITATION_DOCUMENT")
      const current = formik.values.professionalAccreditation || []
      formik.setFieldValue("professionalAccreditation", [...current, { documentUrl: publicUrl }])
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : dict.notifications.updateFailed.defaultMessage
      openNotification("error", dict.notifications.updateFailed.title, { message: errorMessage })
    } finally {
      setUploadingAccreditation(false)
    }
  }

  const handleRemoveAccreditation = (index: number) => {
    const current = formik.values.professionalAccreditation || []
    formik.setFieldValue("professionalAccreditation", current.filter((_, i) => i !== index))
  }

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setUploadingProfilePhoto(true)
    try {
      const { publicUrl } = await uploadFileToR2(file, "AVATAR")
      formik.setFieldValue("profilePicUrl", publicUrl)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : dict.notifications.updateFailed.defaultMessage
      openNotification("error", dict.notifications.updateFailed.title, { message: errorMessage })
    } finally {
      setUploadingProfilePhoto(false)
    }
  }

  const handleAddExperience: React.ComponentProps<typeof ProfessionalExperienceDialog>["onSubmit"] = async (input) => {
    await addProfessionalExperience({ variables: { input } })
    openNotification("success", dict.profile.experience.createSuccessTitle, {
      message: dict.profile.experience.createSuccessMessage,
    })
  }

  // Initialise les menus déroulants de localisation avec les données de l'utilisateur
  useEffect(() => {
    if (user.location?.country) {
      const country = data.find((c) => c.name === user.location?.country) || null
      setSelectedCountry(country)
      if (country && user.location.stateOrProvince) {
        const state = country.states.find((s) => s.name === user.location?.stateOrProvince) || null
        setSelectedState(state)
        // if(state && user.location.city) {
        //   // const city = state.cities.find(c => c.name === user.location?.city) || null
        //   // setSelectedCity(city)
        // }
      }
    }
  }, [user.location])



  const countryError = getIn(formik.errors, "location.country");
  const countryTouched = getIn(formik.touched, "location.country");
  const stateError = getIn(formik.errors, "location.stateOrProvince");
  const stateTouched = getIn(formik.touched, "location.stateOrProvince");
  const cityError = getIn(formik.errors, "location.city");
  const cityTouched = getIn(formik.touched, "location.city");

  if (!isMobile) {
    return (
      <Dialog modal={false} open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={formik.handleSubmit}>
            <DialogHeader>
              <DialogTitle>{dict.button.edit}</DialogTitle>
              <DialogDescription>
                {dict.updateProfile.description}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
              {user.userType === UserTypeGQL.INDIVIDUAL ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">{dict.register.firstNameLabel}</Label>
                      <Input id="firstName" {...formik.getFieldProps("firstName")} />
                      {formik.touched.firstName && formik.errors.firstName && <p className="text-destructive text-xs">{formik.errors.firstName}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">{dict.register.lastNameLabel}</Label>
                      <Input id="lastName" {...formik.getFieldProps("lastName")} />
                      {formik.touched.lastName && formik.errors.lastName && <p className="text-destructive text-xs">{formik.errors.lastName}</p>}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="professionalTitle">{dict.register.professionalTitleLabel}</Label>
                    <Input id="professionalTitle" {...formik.getFieldProps("professionalTitle")} />
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="entityName">{dict.register.entityNameLabel}</Label>
                  <Input id="entityName" {...formik.getFieldProps("entityName")} />
                  {formik.touched.entityName && formik.errors.entityName && <p className="text-destructive text-xs">{formik.errors.entityName}</p>}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="bio">{dict.register.bioLabel}</Label>
                <Textarea id="bio" {...formik.getFieldProps("bio")} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="websiteUrl">{dict.register.websiteUrlLabel}</Label>
                <Input id="websiteUrl" type="url" {...formik.getFieldProps("websiteUrl")} />
                {formik.touched.websiteUrl && formik.errors.websiteUrl && <p className="text-destructive text-xs">{formik.errors.websiteUrl}</p>}
              </div>
              <AccreditationSection
                dict={dict}
                accreditations={formik.values.professionalAccreditation || []}
                existingCount={user.professionalAccreditation?.length || 0}
                uploading={uploadingAccreditation}
                onFileChange={handleAccreditationFileChange}
                onRemove={handleRemoveAccreditation}
              />
              <div className="grid gap-2">
                <Label htmlFor="country">{dict.register.countryLabel}</Label>
                <Combobox<Country> id="country" name="location.country" data={data} error={countryError} touched={countryTouched} onBlur={formik.handleBlur} value={formik.values.location?.country} onChange={(country) => { setSelectedCountry(country); formik.setFieldValue('location.country', country?.name || '') }} placeholder={dict.combobox.selectCountry} />
                {countryTouched && countryError && <p className="text-destructive text-xs">{countryError}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="stateOrProvince">{dict.register.stateOrProvinceLabel}</Label>

                  <Combobox<State> data={selectedCountry ? selectedCountry.states || [] : []} placeholder={dict.combobox.selectState} id="stateOrProvince" name="location.stateOrProvince" value={formik.values.location?.stateOrProvince} onBlur={formik.handleBlur} onChange={(state) => { setSelectedState(state); formik.setFieldValue("location.stateOrProvince", state?.name || '') }} />

                  {stateTouched && stateError && <p className="text-destructive text-xs">{stateError}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">{dict.register.cityLabel}</Label>
                  <Combobox<City> data={selectedState ? selectedState.cities || [] : []} onBlur={formik.handleBlur} id="city" name="location.city" value={formik.values.location?.city} onChange={(city) => { formik.setFieldValue('location.city', city.name) }} placeholder={dict.combobox.selectCity} />
                  {cityTouched && cityError && <p className="text-destructive text-xs">{cityError}</p>}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{dict.button.cancel}</Button>
              <Button type="submit" disabled={isLoading || !formik.dirty}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dict.button.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-h-[92vh]">
        <form onSubmit={formik.handleSubmit}>
          <DrawerHeader className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="text-[15px] font-medium text-muted-foreground" onClick={() => setOpen(false)}>
                {dict.button.cancel}
              </button>
              <DrawerTitle className="text-center text-[17px]">{dict.updateProfile.title}</DrawerTitle>
              <button
                type="button"
                className="text-[15px] font-semibold text-primary disabled:opacity-50"
                disabled={isLoading || !formik.dirty}
                onClick={() => formik.submitForm()}
              >
                {dict.button.save}
              </button>
            </div>
            <DrawerDescription className="sr-only">{dict.updateProfile.description}</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[72vh] overflow-y-auto px-4 py-4">
            <div className="mb-5 flex items-center gap-3.5">
              <label className="relative shrink-0 cursor-pointer">
                <Avatar shape={user.userType === UserTypeGQL.LEGAL_ENTITY ? "establishment" : "person"} className="size-[66px]">
                  <AvatarImage src={formik.values.profilePicUrl || user.profilePicUrl} alt={getUserDisplayName(user)} />
                  <AvatarFallback className="text-xl">{getUserInitials(user)}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-[2.5px] border-card bg-primary text-primary-foreground">
                  {uploadingProfilePhoto ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" strokeWidth={2.5} />}
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/png, image/jpeg"
                  disabled={uploadingProfilePhoto}
                  onChange={handleProfilePhotoChange}
                />
              </label>
              <div className="min-w-0">
                <p className="text-[14.5px] font-semibold">{dict.updateProfile.profilePhotoTitle}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{dict.updateProfile.profilePhotoDescription}</p>
              </div>
            </div>
            <div className="grid gap-4">
            {user.userType === UserTypeGQL.INDIVIDUAL ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">{dict.register.firstNameLabel}</Label>
                    <Input id="firstName" className="h-[46px] rounded-[10px]" {...formik.getFieldProps("firstName")} />
                    {formik.touched.firstName && formik.errors.firstName && <p className="text-destructive text-xs">{formik.errors.firstName}</p>}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">{dict.register.lastNameLabel}</Label>
                    <Input id="lastName" className="h-[46px] rounded-[10px]" {...formik.getFieldProps("lastName")} />
                    {formik.touched.lastName && formik.errors.lastName && <p className="text-destructive text-xs">{formik.errors.lastName}</p>}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="professionalTitle">{dict.register.professionalTitleLabel}</Label>
                  <Input id="professionalTitle" className="h-[46px] rounded-[10px]" {...formik.getFieldProps("professionalTitle")} />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="entityName">{dict.register.entityNameLabel}</Label>
                <Input id="entityName" className="h-[46px] rounded-[10px]" {...formik.getFieldProps("entityName")} />
                {formik.touched.entityName && formik.errors.entityName && <p className="text-destructive text-xs">{formik.errors.entityName}</p>}
              </div>
            )}
            <div className="grid gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor="bio">{dict.profile.tabs.about}</Label>
                <span className="font-mono text-[11.5px] text-muted-foreground">
                  {(formik.values.bio || "").length} / 600
                </span>
              </div>
              <Textarea id="bio" className="min-h-20 rounded-[10px]" maxLength={600} {...formik.getFieldProps("bio")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="websiteUrl">{dict.register.websiteUrlLabel}</Label>
              <Input id="websiteUrl" className="h-[46px] rounded-[10px]" type="url" {...formik.getFieldProps("websiteUrl")} />
              {formik.touched.websiteUrl && formik.errors.websiteUrl && <p className="text-destructive text-xs">{formik.errors.websiteUrl}</p>}
            </div>
            <AccreditationSection
              dict={dict}
              accreditations={formik.values.professionalAccreditation || []}
              existingCount={user.professionalAccreditation?.length || 0}
              uploading={uploadingAccreditation}
              onFileChange={handleAccreditationFileChange}
              onRemove={handleRemoveAccreditation}
            />
            <div className="grid gap-2">
              <Label htmlFor="country">{dict.register.countryLabel}</Label>
              <Combobox<Country> id="country" name="location.country" data={data} error={countryError} touched={countryTouched} onBlur={formik.handleBlur} value={formik.values.location?.country} onChange={(country) => { setSelectedCountry(country); formik.setFieldValue('location.country', country?.name || '') }} placeholder={dict.combobox.selectCountry} />
              {countryTouched && countryError && <p className="text-destructive text-xs">{countryError}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="stateOrProvince">{dict.register.stateOrProvinceLabel}</Label>

                <Combobox<State> data={selectedCountry ? selectedCountry.states || [] : []} placeholder={dict.combobox.selectState} id="stateOrProvince" name="location.stateOrProvince" value={formik.values.location?.stateOrProvince} onBlur={formik.handleBlur} onChange={(state) => { setSelectedState(state); formik.setFieldValue("location.stateOrProvince", state?.name || '') }} />

                {stateTouched && stateError && <p className="text-destructive text-xs">{stateError}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">{dict.register.cityLabel}</Label>
                <Combobox<City> data={selectedState ? selectedState.cities || [] : []} onBlur={formik.handleBlur} id="city" name="location.city" value={formik.values.location?.city} onChange={(city) => { formik.setFieldValue('location.city', city.name) }} placeholder={dict.combobox.selectCity} />
                {cityTouched && cityError && <p className="text-destructive text-xs">{cityError}</p>}
              </div>
            </div>
            {user.userType === UserTypeGQL.INDIVIDUAL && (
              <ProfessionalExperienceDialog loading={addingExperience} onSubmit={handleAddExperience}>
                <button type="button" className="mt-1 flex w-full items-center gap-3 border-t border-border pt-4 text-left">
                  <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-primary-50 text-primary dark:bg-primary-950">
                    <Plus className="size-4" strokeWidth={2.2} />
                  </span>
                  <span className="text-[14.5px] font-semibold text-primary">{dict.profile.experience.addButton}</span>
                </button>
              </ProfessionalExperienceDialog>
            )}
            </div>
          </div>
          <DrawerFooter className="px-0">
            <div className="hidden gap-2 w-full">
              <Button className="flex-1" type="button" variant="outline" onClick={() => setOpen(false)}>{dict.button.cancel}</Button>
              <Button className="flex-1" type="submit" disabled={isLoading || !formik.dirty}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dict.button.save}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
