import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const users = await request.json()

    if (!users || !Array.isArray(users)) {
      return NextResponse.json({ error: "Invalid users data" }, { status: 400 })
    }

    const usersObject = users.reduce((acc: any, user: any) => {
      acc[user.email] = user
      return acc
    }, {})

    const usersBlob = new Blob([JSON.stringify(usersObject)], { type: "application/json" })
    const blob = await put("users.json", usersBlob, {
      access: "public",
      allowOverwrite: true,
    })

    console.log("[v0] Users saved to Blob:", blob.url, "Count:", users.length)
    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error("[v0] Error saving users:", error)
    return NextResponse.json({ error: "Failed to save users" }, { status: 500 })
  }
}
