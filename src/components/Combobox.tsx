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
import { useDictionary } from "@/lib/hooks"
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

}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false)
  const dict = useDictionary()
  // const [selectedItem, setSelectedItem] = React.useState<string | undefined>(undefined)
  // const selectedItem = data.find((item) => item.name === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          name={name}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between border-muted font-normal"
          onBlur={onBlur}
          disabled={disabled}
        >
          {value || placeholder}
          {/* {selectedItem ?? placeholder} */}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        {/* {touched && error && (
          <p className="text-red-500 text-xs">{error}</p>
        )} */}
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
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