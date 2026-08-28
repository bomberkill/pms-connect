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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { City, Country, State } from "@/types/Location"
import { useDictionary } from "@/hooks/use-dictionary"
// import { ICountry, IState, ICity } from 'country-state-city'

type ComboboxProps<T> = {
  data: T[]
  placeholder?: string
  id?: string
  name?: string
  value?: string,
  error?: string,
  touched?: boolean,
  onChange?: (item: T) => void
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
  disabled?: boolean
  searchable?: boolean
}

export function Combobox<T extends Country | State | City>({
  data,
  placeholder = "Select...",
  id,
  name,
  value,
  onChange,
  onBlur,
  disabled = false,
  searchable = true,

}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)
  const dict = useDictionary()
  const displayPlaceholder = placeholder === "Select..." ? dict.common.select : placeholder


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          name={name}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between border-input bg-card text-[15px] font-normal text-foreground md:text-sm"
          onBlur={onBlur}
          disabled={disabled}
        >
          {value || displayPlaceholder}
          {/* {selectedItem ?? displayPlaceholder} */}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        {/* {touched && error && (
          <p className="text-destructive text-xs">{error}</p>
        )} */}
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-60 rounded-card border-border p-0 shadow-[0_14px_34px_-20px_rgba(11,15,20,.35)]"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command>
          {searchable && <CommandInput placeholder={displayPlaceholder} />}
          <CommandList>
            <CommandEmpty>{dict.combobox.noResults}</CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem
                  key={item.name}
                  value={item.name}
                  onSelect={() => {
                    onChange?.(item)
                    // setSelectedItem(item.name)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex gap-3">
                    {"emoji" in item &&
                      // <img
                      //   src={item.flag}
                      //   alt={item.name}
                      //   className="inline-block mr-2 h-4 w-4"
                      // />
                      <span>
                        {item.emoji}
                      </span>
                    }
                    {item.name}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
