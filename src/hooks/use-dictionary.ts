import { useContext } from "react";
import { DictionaryContext } from "@/components/DictionaryProvider";

export function useDictionary() {
    const dictionary = useContext(DictionaryContext)
    if (!dictionary) {
        throw new Error("useDictionary must be used within a DictionaryProvider")
    }
    return dictionary
}
