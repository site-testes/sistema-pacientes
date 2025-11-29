"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Download, Share } from "@/components/icons"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Detecta iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iOS)

    // Detecta se já está instalado (modo standalone)
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      window.location.search.includes("utm_source=web_app_manifest")
    setIsStandalone(standalone)

    if (!standalone) {
      // Para Android - escuta o evento beforeinstallprompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault()
        setDeferredPrompt(e as BeforeInstallPromptEvent)
        setShowPrompt(true)
      }

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 1000)

      return () => {
        clearTimeout(timer)
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      }
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android - usa o prompt nativo
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      setDeferredPrompt(null)
      setShowPrompt(false)
      localStorage.setItem("pwa-install-prompt-seen", "true")
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-install-prompt-seen", "true")
  }

  if (!showPrompt || isStandalone) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="shadow-lg border-2 border-primary/20 bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Instalar App</h3>
                <p className="text-xs text-muted-foreground">Sistema de Pacientes</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="h-6 w-6 p-0 hover:bg-muted">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mb-3">
            {isIOS
              ? "Instale o app na sua tela inicial para uma melhor experiência!"
              : "Instale o app para acesso rápido e melhor experiência!"}
          </p>

          <div className="flex gap-2">
            {isIOS ? (
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <Share className="w-3 h-3" />
                  <span>Toque em</span>
                  <span className="font-medium">Compartilhar</span>
                  <span>→</span>
                  <span className="font-medium">"Adicionar à Tela Inicial"</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleDismiss} className="w-full text-xs bg-transparent">
                  Entendi
                </Button>
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleDismiss} className="flex-1 text-xs bg-transparent">
                  Agora não
                </Button>
                <Button onClick={handleInstallClick} size="sm" className="flex-1 text-xs">
                  Instalar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
