import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    console.log("[v0] API templates/load called - userId:", userId)

    if (!userId) {
      console.log("[v0] Error: User ID is required")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { blobs } = await list({ prefix: `templates-${userId}` })

    console.log(
      "[v0] Found blobs:",
      blobs.length,
      blobs.map((b) => b.pathname),
    )

    if (blobs.length === 0) {
      console.log("[v0] No templates found, returning empty object")
      return NextResponse.json({ templates: {} })
    }

    const blob = blobs[0]
    console.log("[v0] Loading templates from blob:", blob.url)

    const response = await fetch(blob.url + "?t=" + Date.now())
    const data = await response.json()

    console.log("[v0] Raw data from blob:", JSON.stringify(data))

    // O blob pode conter diretamente os templates OU um objeto com chave "template" ou "templates"
    let templates = {}
    if (data && typeof data === "object") {
      if (data.template) {
        // Formato antigo: { template: { ... } }
        templates = data.template
      } else if (data.templates) {
        // Formato: { templates: { ... } }
        templates = data.templates
      } else if (Array.isArray(data[0]) || Array.isArray(data[1]) || Array.isArray(data[2])) {
        // Formato direto: { 0: [], 1: [], ... }
        templates = data
      } else {
        // Assume que o próprio data é o objeto de templates
        templates = data
      }
    }

    console.log("[v0] Parsed templates:", JSON.stringify(templates))

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("[v0] Error loading templates:", error)
    return NextResponse.json({ error: "Failed to load templates" }, { status: 500 })
  }
}
