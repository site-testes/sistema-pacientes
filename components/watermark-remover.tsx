"use client"

import { useEffect } from "react"

export function WatermarkRemover() {
  useEffect(() => {
    const removeWatermark = () => {
      // Remove elements that contain "Built with" and v0 logo
      const watermarkElements = document.querySelectorAll('[id*="v0-built-with-button"]')
      watermarkElements.forEach((element) => {
        element.remove()
      })

      // Also check for any elements with "Built with" text
      const allElements = document.querySelectorAll("*")
      allElements.forEach((element) => {
        if (
          element.textContent?.includes("Built with") &&
          element.querySelector("svg") &&
          element.style.position === "fixed"
        ) {
          element.remove()
        }
      })
    }

    removeWatermark()

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              // Check if the added element is a watermark
              if (
                element.id?.includes("v0-built-with-button") ||
                (element.textContent?.includes("Built with") &&
                  element.querySelector?.("svg") &&
                  (element as HTMLElement).style?.position === "fixed")
              ) {
                element.remove()
              }
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    const interval = setInterval(removeWatermark, 1000)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return null
}
