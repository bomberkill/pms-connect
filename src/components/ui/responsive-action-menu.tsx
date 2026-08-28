"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDictionary } from "@/hooks/use-dictionary"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

export interface ResponsiveActionMenuItem {
  key: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
  destructive?: boolean
  separatorBefore?: boolean
  onSelect: () => void
}

interface ResponsiveActionMenuProps {
  title: string
  trigger: React.ReactNode
  items: ResponsiveActionMenuItem[]
  align?: "start" | "center" | "end"
}

export function ResponsiveActionMenu({
  title,
  trigger,
  items,
  align = "end",
}: ResponsiveActionMenuProps) {
  const dict = useDictionary()
  const isMobile = useIsMobile()
  const [open, setOpen] = React.useState(false)

  const runAction = (item: ResponsiveActionMenuItem) => {
    if (item.disabled) return
    setOpen(false)
    item.onSelect()
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <div className="overflow-hidden rounded-card border border-border bg-card">
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={item.disabled}
                    onClick={() => runAction(item)}
                    className={cn(
                      "flex min-h-12 w-full items-center gap-3 border-t border-border px-4 text-left text-[15px] font-semibold first:border-t-0 disabled:opacity-50",
                      item.separatorBefore && "border-t-8 border-t-muted",
                      item.destructive ? "text-destructive" : "text-foreground"
                    )}
                  >
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>
            <DrawerClose asChild>
              <Button type="button" variant="outline" className="mt-3 w-full">
                {dict.button.cancel}
              </Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-52">
        <DropdownMenuLabel>{title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => {
          const Icon = item.icon
          return (
            <React.Fragment key={item.key}>
              {item.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem
                className={cn("cursor-pointer", item.destructive && "text-destructive focus:text-destructive")}
                disabled={item.disabled}
                onClick={() => runAction(item)}
              >
                {Icon && <Icon className="mr-2 size-4" />}
                {item.label}
              </DropdownMenuItem>
            </React.Fragment>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
