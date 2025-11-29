export const saveUsersToCloud = async (users: any[]) => {
  try {
    const response = await fetch("/api/users/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(users),
    })

    if (!response.ok) {
      throw new Error("Failed to save users to cloud")
    }

    console.log("[v0] Users successfully saved to cloud")
    return true
  } catch (error) {
    console.error("[v0] Error saving users to cloud:", error)
    return false
  }
}

export const loadUsersFromCloud = async () => {
  try {
    const response = await fetch("/api/users/load")

    if (!response.ok) {
      throw new Error("Failed to load users from cloud")
    }

    const data = await response.json()
    console.log("[v0] Users loaded from cloud:", Object.keys(data.users).length)
    return data.users
  } catch (error) {
    console.error("[v0] Error loading users from cloud:", error)
    return {}
  }
}

export const syncUserData = async () => {
  try {
    // Load from cloud first
    const cloudUsers = await loadUsersFromCloud()

    if (Object.keys(cloudUsers).length > 0) {
      // Update local storage with cloud data
      localStorage.setItem("patient-system-users", JSON.stringify(Object.values(cloudUsers)))
      console.log("[v0] Local users updated from cloud")
      return Object.values(cloudUsers)
    } else {
      // If no cloud data, sync local to cloud
      const localData = localStorage.getItem("patient-system-users")
      if (localData) {
        const localUsers = JSON.parse(localData)
        await saveUsersToCloud(localUsers)
        console.log("[v0] Local users synced to cloud")
        return localUsers
      }
    }

    return []
  } catch (error) {
    console.error("[v0] Error syncing user data:", error)
    return []
  }
}
