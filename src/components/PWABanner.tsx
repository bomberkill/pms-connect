"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDictionary } from "@/hooks/use-dictionary"

export default function PWABanner() {
  const dict = useDictionary()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  // Détecter si déjà installé
  useEffect(() => {
    const checkInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true)
      }
    }
    checkInstalled()
    window.addEventListener("appinstalled", () => setIsInstalled(true))
    return () => window.removeEventListener("appinstalled", () => setIsInstalled(true))
  }, [])

  // Gérer le beforeinstallprompt (Android / Chrome)
  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert(dict.pwa.browserInstruction)
      return
    }
    deferredPrompt.prompt()
    const choiceResult = await deferredPrompt.userChoice
    if (choiceResult.outcome === "accepted") {
      setIsVisible(false)
      setDeferredPrompt(null)
    }
  }

  if (!isVisible || isInstalled) return null

  return (
    <div
      className={cn(
        "bg-primary/10 backdrop-blur-md border-b border-border flex items-center justify-between px-4 py-2",
        "animate-in fade-in slide-in-from-top-2 z-[60]"
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <Download className="h-4 w-4 text-primary" />
        <span>{dict.pwa.installBanner}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="text-xs"
          onClick={handleInstall}
        >
          {dict.common.install}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
