import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, patients } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!patients || !Array.isArray(patients)) {
      return NextResponse.json({ error: "Invalid patients data" }, { status: 400 })
    }

    // Create a unique filename for this user's data
    const filename = `patients-${userId}.json`

    // Convert patients data to JSON string
    const patientsData = JSON.stringify({
      userId,
      patients,
      lastUpdated: new Date().toISOString(),
    })

    // Save to Vercel Blob
    const blob = await put(filename, patientsData, {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: filename,
      count: patients.length,
    })
  } catch (error: any) {
    if (error.message?.includes("No token found")) {
      console.warn("[v0] Vercel Blob not configured, skipping cloud save (using local storage)")
      return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 })
    }
    console.error("Save patients error:", error)
    return NextResponse.json({ error: "Failed to save patients data" }, { status: 500 })
  }
}
