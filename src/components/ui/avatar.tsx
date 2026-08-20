"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/* Shape carries meaning before the name loads: circle = person, rounded
   square = establishment/organization. Mirrors UserTypeGQL.INDIVIDUAL vs
   LEGAL_ENTITY — pass shape="establishment" wherever the avatar belongs to
   a LEGAL_ENTITY user. Never mix the two shapes for the same account. */
const avatarShapeClass = {
  person: "rounded-full",
  establishment: "rounded-field",
} as const

function Avatar({
  className,
  shape = "person",
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  shape?: keyof typeof avatarShapeClass
}) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden",
        avatarShapeClass[shape],
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
