"use client"

import { useMemo, useState } from "react"
import { useFormik } from "formik"
import * as yup from "yup"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useDictionary } from "@/hooks/use-dictionary"
import { useNotification } from "@/hooks/use-notification"
import { useIsMobile } from "@/hooks/use-mobile"
import { CreateProfessionalExperienceInput, ProfessionalExperience } from "@/types/User"
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

interface ProfessionalExperienceDialogProps {
  children: React.ReactNode
  experience?: ProfessionalExperience
  loading?: boolean
  onSubmit: (input: CreateProfessionalExperienceInput) => Promise<void>
}

interface ExperienceFormValues {
  title: string
  organizationName: string
  employmentType: string
  location: string
  startDate: string
  endDate: string
  isCurrent: boolean
  description: string
}

export default function ProfessionalExperienceDialog({
  children,
  experience,
  loading = false,
  onSubmit,
}: ProfessionalExperienceDialogProps) {
  const dict = useDictionary()
  const { open: openNotification } = useNotification()
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const labels = dict.profile.experience
  const isEditing = Boolean(experience)

  const validationSchema = useMemo(
    () =>
      yup.object({
        title: yup.string().trim().required(labels.titleRequired),
        organizationName: yup.string().trim().required(labels.organizationRequired),
        employmentType: yup.string().trim(),
        location: yup.string().trim(),
        startDate: yup.string().required(labels.startDateRequired),
        endDate: yup.string().when("isCurrent", {
          is: false,
          then: (schema) => schema.required(labels.endDateRequired),
          otherwise: (schema) => schema.notRequired(),
        }),
        isCurrent: yup.boolean().required(),
        description: yup.string().trim(),
      }),
    [labels.endDateRequired, labels.organizationRequired, labels.startDateRequired, labels.titleRequired],
  )

  const formik = useFormik<ExperienceFormValues>({
    initialValues: {
      title: experience?.title || "",
      organizationName: experience?.organizationName || "",
      employmentType: experience?.employmentType || "",
      location: experience?.location || "",
      startDate: toMonthInputValue(experience?.startDate),
      endDate: toMonthInputValue(experience?.endDate),
      isCurrent: experience?.isCurrent ?? false,
      description: experience?.description || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        await onSubmit({
          title: values.title.trim(),
          organizationName: values.organizationName.trim(),
          employmentType: optionalString(values.employmentType),
          location: optionalString(values.location),
          startDate: monthInputToIsoDate(values.startDate),
          endDate: values.isCurrent ? undefined : monthInputToIsoDate(values.endDate),
          isCurrent: values.isCurrent,
          description: optionalString(values.description),
        })
        setOpen(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : labels.saveFailed
        openNotification("error", labels.saveFailedTitle, { message })
      }
    },
  })

  const handleCurrentChange = (checked: boolean) => {
    formik.setFieldValue("isCurrent", checked)
    if (checked) {
      formik.setFieldValue("endDate", "")
    }
  }

  const formContent = (
    <form onSubmit={formik.handleSubmit} className="grid gap-4">
      {!isMobile && (
        <DialogHeader>
          <DialogTitle>{isEditing ? labels.editTitle : labels.addTitle}</DialogTitle>
          <DialogDescription>{labels.formDescription}</DialogDescription>
        </DialogHeader>
      )}

      <div className="grid gap-4">
        <FieldError name="title" formik={formik}>
          <Label htmlFor="experience-title">{labels.titleLabel}</Label>
          <Input id="experience-title" className="h-11 rounded-[12px]" {...formik.getFieldProps("title")} placeholder={labels.titlePlaceholder} />
        </FieldError>

        <FieldError name="organizationName" formik={formik}>
          <Label htmlFor="experience-organization">{labels.organizationLabel}</Label>
          <Input id="experience-organization" className="h-11 rounded-[12px]" {...formik.getFieldProps("organizationName")} placeholder={labels.organizationPlaceholder} />
        </FieldError>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldError name="employmentType" formik={formik}>
            <Label htmlFor="experience-employment-type">{labels.employmentTypeLabel}</Label>
            <Input id="experience-employment-type" className="h-11 rounded-[12px]" {...formik.getFieldProps("employmentType")} placeholder={labels.employmentTypePlaceholder} />
          </FieldError>

          <FieldError name="location" formik={formik}>
            <Label htmlFor="experience-location">{labels.locationLabel}</Label>
            <Input id="experience-location" className="h-11 rounded-[12px]" {...formik.getFieldProps("location")} placeholder={labels.locationPlaceholder} />
          </FieldError>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldError name="startDate" formik={formik}>
            <Label htmlFor="experience-start-date">{labels.startDateLabel}</Label>
            <Input id="experience-start-date" className="h-11 rounded-[12px]" type="month" {...formik.getFieldProps("startDate")} />
          </FieldError>

          <FieldError name="endDate" formik={formik}>
            <Label htmlFor="experience-end-date">{labels.endDateLabel}</Label>
            <Input
              id="experience-end-date"
              className="h-11 rounded-[12px]"
              type="month"
              disabled={formik.values.isCurrent}
              {...formik.getFieldProps("endDate")}
            />
          </FieldError>
        </div>

        <label className="flex items-start gap-3 rounded-[14px] border border-border bg-muted/40 p-3 text-sm">
          <Checkbox
            checked={formik.values.isCurrent}
            onCheckedChange={(checked) => handleCurrentChange(checked === true)}
          />
          <span className="grid gap-0.5">
            <span className="font-semibold text-foreground">{labels.currentLabel}</span>
            <span className="text-xs leading-relaxed text-muted-foreground">{labels.currentHelp}</span>
          </span>
        </label>

        <FieldError name="description" formik={formik}>
          <Label htmlFor="experience-description">{labels.descriptionLabel}</Label>
          <Textarea
            id="experience-description"
            className="min-h-24 rounded-[12px]"
            rows={4}
            {...formik.getFieldProps("description")}
            placeholder={labels.descriptionPlaceholder}
          />
        </FieldError>
      </div>

      {!isMobile && (
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {dict.button.cancel}
          </Button>
          <Button type="submit" disabled={loading || formik.isSubmitting}>
            {(loading || formik.isSubmitting) && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEditing ? labels.updateButton : labels.createButton}
          </Button>
        </DialogFooter>
      )}
    </form>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="max-h-[88vh]">
          <DrawerHeader className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <button type="button" className="text-[15px] font-medium text-muted-foreground" onClick={() => setOpen(false)}>
                {dict.button.cancel}
              </button>
              <DrawerTitle className="text-center text-[17px]">{isEditing ? labels.editTitle : labels.addTitle}</DrawerTitle>
              <button
                type="button"
                className="text-[15px] font-semibold text-primary disabled:opacity-50"
                disabled={loading || formik.isSubmitting}
                onClick={() => formik.submitForm()}
              >
                {isEditing ? labels.updateButton : labels.createButton}
              </button>
            </div>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-4">
            {formContent}
          </div>
          <DrawerFooter className="h-5 p-0" />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[88vh] overflow-y-auto">
        {formContent}
      </DialogContent>
    </Dialog>
  )
}

function FieldError({
  children,
  formik,
  name,
}: {
  children: React.ReactNode
  formik: ReturnType<typeof useFormik<ExperienceFormValues>>
  name: keyof ExperienceFormValues
}) {
  const hasError = formik.touched[name] && formik.errors[name]
  return (
    <div className="grid gap-2">
      {children}
      {hasError && <p className="text-xs font-medium text-destructive">{formik.errors[name]}</p>}
    </div>
  )
}

function optionalString(value: string) {
  const normalized = value.trim()
  return normalized ? normalized : undefined
}

function toMonthInputValue(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function monthInputToIsoDate(value: string) {
  return `${value}-01T00:00:00.000Z`
}
