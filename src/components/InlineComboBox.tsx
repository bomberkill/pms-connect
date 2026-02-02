"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { City, Country, State } from "@/types/Location"
import { useDictionary } from "@/hooks/use-dictionary"

type ComboboxProps<T> = {
  data: T[]
  placeholder?: string
  id?: string
  name?: string
  value?: string
  error?: string
  touched?: boolean
  onChange?: (item: T) => void
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
  disabled?: boolean
}

/**
 * Identique au Combobox de shadcn, mais sans Popover.
 * Utilise une logique d'ouverture/fermeture inline,
 * donc fonctionne parfaitement dans un Dialog ou Drawer.
 */
export function InlineCombobox<T extends Country | State | City>({
  data,
  placeholder = "Select...",
  id,
  name,
  value,
  onChange,
  onBlur,
  disabled = false,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)
  const dict = useDictionary()
  const displayPlaceholder = placeholder === "Select..." ? dict.common.select : placeholder
  const [search, setSearch] = React.useState("")
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredData = React.useMemo(() => {
    if (!search) return data
    return data.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, data])

  // Ferme la liste quand on clique à l'extérieur
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div ref={containerRef} className="relative w-full">
      <Button
        id={id}
        name={name}
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="justify-between border-muted font-normal w-full"
        onClick={() => setOpen((prev) => !prev)}
        onBlur={onBlur}
        disabled={disabled}
      >
        {value || displayPlaceholder}
        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <div
          className={cn(
            "absolute z-300 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
          )}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={displayPlaceholder}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filteredData.length === 0 ? (
                <CommandEmpty>{dict.combobox.noResults}</CommandEmpty>
              ) : (
                <CommandGroup>
                  {filteredData.map((item) => (
                    <CommandItem
                      key={item.name}
                      value={item.name}
                      onSelect={() => {
                        onChange?.(item)
                        setOpen(false)
                        setSearch("")
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex gap-3">
                        {"emoji" in item && (
                          <span>{item.emoji}</span>
                        )}
                        {item.name}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
