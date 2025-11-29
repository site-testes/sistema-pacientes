"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const syncUsersToCloud = async (users: any[]) => {
    try {
      // Save to localStorage first as backup/local dev
      localStorage.setItem("users_db", JSON.stringify(users))

      const response = await fetch("/api/users/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(users),
      })

      if (!response.ok) {
        console.warn("Failed to sync users to cloud, using local storage only")
      }
    } catch (error) {
      console.warn("Failed to sync users to cloud (using local storage):", error)
    }
  }

  const loadUsersFromCloud = async (retryCount = 0) => {
    try {
      const response = await fetch(`/api/users/load?t=${Date.now()}&retry=${retryCount}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to load from cloud")
      }

      const data = await response.json()
      return data.users || {}
    } catch (error) {
      console.warn(`Failed to load users from cloud, falling back to local storage:`, error)
      // Fallback to localStorage
      const localUsers = localStorage.getItem("users_db")
      if (localUsers) {
        try {
          // Convert array back to object keyed by email if needed, or just return as is if it matches structure
          // The sync function saves an array, but load expects an object keyed by email?
          // Let's check how sync saves. It saves "users" which seems to be an array in register but object in login?
          // Wait, register: usersArray.push(newUser). syncUsersToCloud(usersArray).
          // login: cloudUsers[email]. So cloudUsers is expected to be an object?
          // Let's look at register again.
          // const usersArray = Object.values(cloudUsers) -> converts object to array
          // syncUsersToCloud(usersArray) -> saves array
          // loadUsersFromCloud -> returns data.users.
          // If data.users is an array, then cloudUsers[email] in login will fail if it's not an object.
          // We need to normalize the data structure.

          const parsed = JSON.parse(localUsers)
          if (Array.isArray(parsed)) {
            return parsed.reduce((acc: any, user: any) => {
              acc[user.email] = user
              return acc
            }, {})
          }
          return parsed
        } catch (e) {
          return {}
        }
      }
      return {}
    }
  }

  const initializeDefaultUsers = async () => {
    try {
      const cloudUsers = await loadUsersFromCloud()

      // If no users exist, create default users
      if (Object.keys(cloudUsers).length === 0) {
        console.log("[v0] No users found, creating default users...")

        const defaultUsers = [
          {
            id: "1757953550135",
            name: "Daniella Silva",
            email: "daniellasilva.terapia@gmail.com",
            password: "27874455",
            createdAt: new Date().toISOString(),
          },
          {
            id: "1757953550136",
            name: "Admin User",
            email: "admin@sistema.com",
            password: "admin123",
            createdAt: new Date().toISOString(),
          },
        ]

        await syncUsersToCloud(defaultUsers)
        console.log("[v0] Default users created successfully")
      }
    } catch (error) {
      console.error("[v0] Failed to initialize default users:", error)
    }
  }

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Initialize default users if needed
        await initializeDefaultUsers()

        const savedUser = sessionStorage.getItem("currentUser") || localStorage.getItem("rememberedUser")
        if (savedUser) {
          const userData = JSON.parse(savedUser)
          setUser(userData)
        }
      } catch (error) {
        console.error("Failed to restore session:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string, rememberMe = false): Promise<boolean> => {
    try {
      console.log("[v0] Starting login process for:", email)

      let cloudUsers = await loadUsersFromCloud()

      // Normalize if array
      if (Array.isArray(cloudUsers)) {
        cloudUsers = cloudUsers.reduce((acc: any, user: any) => {
          acc[user.email] = user
          return acc
        }, {})
      }

      console.log("[v0] Users loaded:", Object.keys(cloudUsers).length)

      // If no users found, try to initialize defaults and reload
      if (Object.keys(cloudUsers).length === 0) {
        console.log("[v0] No users found, initializing defaults...")
        await initializeDefaultUsers()
        cloudUsers = await loadUsersFromCloud()
        // Normalize again
        if (Array.isArray(cloudUsers)) {
          cloudUsers = cloudUsers.reduce((acc: any, user: any) => {
            acc[user.email] = user
            return acc
          }, {})
        }
      }

      const user = cloudUsers[email]

      if (user && user.password === password) {
        console.log("[v0] Login successful")
        const userData = { id: user.id, email: user.email, name: user.name }
        setUser(userData)

        if (rememberMe) {
          localStorage.setItem("rememberedUser", JSON.stringify(userData))
          sessionStorage.removeItem("currentUser")
        } else {
          sessionStorage.setItem("currentUser", JSON.stringify(userData))
          localStorage.removeItem("rememberedUser")
        }

        return true
      }

      console.log("[v0] Login failed - invalid credentials")
      return false
    } catch (error) {
      console.error("[v0] Login error:", error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      let cloudUsers = await loadUsersFromCloud()

      // Normalize if array
      if (Array.isArray(cloudUsers)) {
        cloudUsers = cloudUsers.reduce((acc: any, user: any) => {
          acc[user.email] = user
          return acc
        }, {})
      }

      if (cloudUsers[email]) {
        return false
      }

      const usersArray = Object.values(cloudUsers)
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
      }

      usersArray.push(newUser)
      await syncUsersToCloud(usersArray)

      return true
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    sessionStorage.removeItem("currentUser")
    localStorage.removeItem("rememberedUser")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
