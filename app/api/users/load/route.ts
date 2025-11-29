import { list } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Loading users from Blob storage...")
    const { blobs } = await list()
    console.log("[v0] Found", blobs.length, "blobs in storage")

    const usersBlob = blobs.find((blob) => blob.pathname === "users.json")

    if (!usersBlob) {
      console.log("[v0] No users.json file found in Blob storage")
      return NextResponse.json({ users: {} })
    }

    console.log("[v0] Found users.json blob, fetching content...")
    const response = await fetch(`${usersBlob.url}?t=${Date.now()}`, {
      cache: "no-store",
    })
    const users = await response.json()

    console.log("[v0] Users loaded from Blob:", Object.keys(users).length, "users")
    console.log("[v0] User emails found:", Object.keys(users))
    return NextResponse.json({ users })
  } catch (error) {
    console.error("[v0] Error loading users:", error)
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 })
  }
}
