"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { CountryCode as CountriesCode } from "@/types/CountryCode"; // ton interface
import countries from "../../public/Country.json"; // ton fichier local
import { AsYouType, CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";
import { useDictionary } from "@/hooks/use-dictionary";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  touched?: boolean;
  label?: string;
}
export default function PhoneInput({
  value,
  onChange,
  onBlur,
  error,
  touched,
  label,
}: PhoneInputProps) {
  const dict = useDictionary();
  const [selected, setSelected] = useState<CountriesCode | null>(
    {
      name: "Cameroon",
      code: "CM",
      emoji: "🇨🇲",
      unicode: "U+1F1E8 U+1F1F2",
      image: "CM.svg",
      dial_code: "+237"
    }
  );
  const [displayNumber, setDisplayNumber] = useState("");
  // const [validationError, setValidationError] = useState<string | null>(null);
  // const [localNumber, setLocalNumber] = useState(value);

  //   const handleSelect = (country: CountriesCode) => {
  //     setSelected(country);
  //     if (localNumber) {
  //       const formatted = formatNumber(localNumber, country.code as CountryCode);
  //       onChange(formatted);
  //     }
  //   };

  //   const handleChange = (value: string) => {
  //     setLocalNumber(value);
  //     if (selected) {
  //       const formatted = formatNumber(value, selected.code as CountryCode);
  //       onChange(formatted);
  //     } else {
  //       onChange(value);
  //     }
  //   };
  //   const formatNumber = (val: string, code: CountryCode) => {
  //     const phoneNumber = parsePhoneNumberFromString(val, code);
  //     return phoneNumber ? phoneNumber.formatInternational() : val;
  //   };
  // Met à jour le numéro affiché dès que la valeur change
  useEffect(() => {
    if (!selected) return;
    const withoutCode = value.replace(selected.dial_code, "");
    const formatted = new AsYouType(selected.code as CountryCode).input(withoutCode);
    setDisplayNumber(formatted);
  }, [value, selected]);

  const handleSelect = (country: CountriesCode) => {
    setSelected(country);

    // reformer la valeur avec l’indicatif
    const digits = value.replace(/\D/g, "");
    const full = country.dial_code + digits;
    onChange(full);
  };

  const handleChange = (localVal: string) => {
    if (!selected) return;
    const digits = localVal.replace(/\D/g, "");

    if (digits.length === 0) {
      onChange("");
      setDisplayNumber("");
      // setValidationError(null);
      return;
    }

    // Construction du numéro complet (avec indicatif) sans espace
    const fullNumber = `${selected.dial_code}${digits}`;
    onChange(fullNumber);

    // Format local pour affichage
    const formatted = new AsYouType(selected.code as CountryCode).input(digits);
    setDisplayNumber(formatted);

    // Validation du numéro (instantanée)
    const parsed = parsePhoneNumberFromString(fullNumber);
    if (parsed && parsed.isValid()) {
      //   setValidationError(null);
    } else {
      //   setValidationError("Numéro invalide pour ce pays");
    }
  };

  return (
    <div className="grid gap-1 w-full">
      {label && <label className="text-sm font-medium">{label}</label>}

      <div className="w-full flex justify-between items-center gap-2">
        {/* Select pays */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="flex items-center gap-2 min-w-[120px] justify-between"
            >
              {selected ? (
                <>
                  <span className="text-xl">{selected.emoji}</span>
                  <span className="text-sm">{selected.dial_code}</span>
                </>
              ) : (
                <span className="text-gray-400">{dict.common.choose}</span>
              )}
              <ChevronDown className="w-4 h-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[250px]">
            <Command>
              <CommandInput placeholder={dict.combobox.searchCountry} />
              <CommandList>
                <CommandEmpty>{dict.combobox.noCountryFound}</CommandEmpty>
                <CommandGroup>
                  {countries.map((c: CountriesCode) => (
                    <CommandItem key={c.code} onSelect={() => handleSelect(c)}>
                      <span className="mr-2 text-xl">{c.emoji}</span>
                      <span>{c.name}</span>
                      <span className="ml-auto text-sm text-muted-foreground">
                        {c.dial_code}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Input numéro */}
        <div className="flex-1">
          <Input
            placeholder={dict.common.phoneNumber}
            value={displayNumber}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={onBlur}
            type="tel"
          />
        </div>
      </div>

      {(touched && error) && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
