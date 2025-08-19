"use client"
import { getDictionary } from "@/app/getDictionary"
import { createContext, ReactNode } from "react"

type Dictionary = Awaited<ReturnType<typeof getDictionary>>

export const DictionaryContext = createContext<Dictionary | null>(null)

export default function DictionaryProvider ({children, dictionary}: {
    children: ReactNode,
    dictionary: Dictionary
}) {
    return <DictionaryContext.Provider value={dictionary}>{children}</DictionaryContext.Provider>
}

