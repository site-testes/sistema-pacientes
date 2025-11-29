"use client"

import { useEffect, useState } from "react"
import { Users } from "@/components/icons"

interface LoadingScreenProps {
  onComplete: () => void
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    console.log("[v0] LoadingScreen iniciado")
    const duration = 1500 // 1.5 segundos
    const startTime = Date.now()

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 100)

      console.log("[v0] Progress:", Math.round(newProgress))
      setProgress(newProgress)

      if (newProgress >= 100) {
        console.log("[v0] LoadingScreen completado - 100%")
        setTimeout(onComplete, 100)
      } else {
        requestAnimationFrame(updateProgress)
      }
    }

    const fallbackTimer = setTimeout(() => {
      console.log("[v0] LoadingScreen fallback - forçando 100%")
      setProgress(100)
      setTimeout(onComplete, 100)
    }, duration + 100)

    requestAnimationFrame(updateProgress)

    return () => {
      clearTimeout(fallbackTimer)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center z-50">
      <div className="text-center space-y-6">
        {/* Logo animado */}
        <div className="relative">
          <div className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Users className="w-10 h-10 text-white" />
          </div>
          <div className="absolute inset-0 w-20 h-20 bg-blue-400 rounded-2xl mx-auto animate-ping opacity-20"></div>
        </div>

        {/* Título */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-blue-900 animate-fade-in">Sistema de Pacientes</h1>
          <p className="text-blue-600 animate-fade-in-delay">Carregando sua experiência...</p>
        </div>

        {/* Barra de progresso */}
        <div className="w-64 mx-auto">
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-100 ease-out"
              style={{ width: `${Math.round(progress)}%` }}
            />
          </div>
          <p className="text-sm text-blue-500 mt-2">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  )
}
