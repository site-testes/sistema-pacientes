import { list } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const filename = `patients-${userId}.json`

    try {
      const { blobs } = await list()
      const patientBlob = blobs.find((blob) => blob.pathname === filename)

      if (!patientBlob) {
        // If file doesn't exist, return empty array (new user)
        console.log(`[v0] No patients file found for user ${userId}, returning empty array`)
        return NextResponse.json({
          success: true,
          patients: [],
          isNewUser: true,
        })
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 segundos

      const response = await fetch(patientBlob.url, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data || typeof data !== "object") {
        console.error(`[v0] Invalid data format for user ${userId}`)
        return NextResponse.json({
          success: true,
          patients: [],
          isNewUser: true,
        })
      }

      const patients = Array.isArray(data.patients) ? data.patients : []
      console.log(`[v0] Loaded ${patients.length} patients for user ${userId}`)

      return NextResponse.json({
        success: true,
        patients: patients,
        lastUpdated: data.lastUpdated,
        isNewUser: false,
      })
    } catch (fetchError) {
      console.log(`[v0] Error fetching patients for user ${userId}:`, fetchError)
      // If there's an error fetching (like 404 or timeout), return empty array
      return NextResponse.json({
        success: true,
        patients: [],
        isNewUser: true,
      })
    }
  } catch (error) {
    console.error("Load patients error:", error)
    return NextResponse.json({ error: "Failed to load patients data" }, { status: 500 })
  }
}
