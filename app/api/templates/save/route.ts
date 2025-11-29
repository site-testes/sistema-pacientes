import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, templates } = await request.json()

    console.log("[v0] API templates/save called - userId:", userId)
    console.log("[v0] Templates to save:", JSON.stringify(templates))

    if (!userId) {
      console.log("[v0] Error: User ID is required")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const blob = await put(`templates-${userId}.json`, JSON.stringify(templates), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    console.log("[v0] Templates saved to blob:", blob.url)

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error: any) {
    if (error.message?.includes("No token found")) {
      console.warn("[v0] Vercel Blob not configured, skipping cloud save (using local storage)")
      return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 })
    }
    console.error("[v0] Error saving templates:", error)
    return NextResponse.json({ error: "Failed to save templates" }, { status: 500 })
  }
}
