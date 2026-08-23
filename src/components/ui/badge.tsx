import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border border-transparent w-fit whitespace-nowrap shrink-0 [&_svg]:pointer-events-none [&_svg]:size-3",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-muted-foreground",
        primary: "bg-primary-100 text-primary-800",
        success: "bg-success-soft text-success-soft-foreground",
        warning: "bg-warning-soft text-warning-soft-foreground",
        error: "bg-error-100 text-error-800",
        info: "bg-info-soft text-info-soft-foreground",
        /* verified title / approved account / accreditation — the only
           place teal (secondary) is allowed to appear as a fill */
        verified: "bg-secondary-100 text-secondary-800",
        /* awaiting approval, unverified e-mail, expiring document — the
           only place amber (tertiary) is allowed to appear as a fill */
        pending: "bg-tertiary-100 text-tertiary-800",
      },
      size: {
        sm: "px-2 py-0.5 text-2xs font-semibold",
        md: "px-2.5 py-1 text-xs font-semibold",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "sm",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  dot = false,
  children,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
