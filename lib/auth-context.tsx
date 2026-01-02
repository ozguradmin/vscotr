"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { account } from "@/lib/appwrite/client"
import { Models } from "appwrite"

interface AuthContextType {
    user: Models.User<Models.Preferences> | null
    currentProfile: any | null // Add profile data
    loading: boolean
    login: (user: Models.User<Models.Preferences>) => void
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

import { databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { Query } from "appwrite"

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
    const [currentProfile, setCurrentProfile] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshUser = async () => {
        try {
            const userData = await account.get()
            setUser(userData)

            // Allow fetch to fail if profile not created yet
            try {
                const profileRes = await databases.listDocuments(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.PROFILES,
                    [Query.equal("$id", userData.$id)] // Assuming profile ID same as User ID
                )
                if (profileRes.documents.length > 0) {
                    setCurrentProfile(profileRes.documents[0])
                }
            } catch (pErr) {
                console.log("Profile fetch in auth ignored", pErr)
            }

        } catch (error) {
            setUser(null)
            setCurrentProfile(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshUser()
    }, [])

    const login = (user: Models.User<Models.Preferences>) => {
        setUser(user)
        checkUser() // Fetch profile after manual login set
    }

    const logout = async () => {
        try {
            await account.deleteSession("current")
            setUser(null)
            setCurrentProfile(null)
            router.push("/giris")
        } catch (error) {
            console.error("Logout failed", error)
        }
    }

    // New refreshUser function that calls checkUser
    const refreshUser = async () => {
        await checkUser()
    }

    return (
        <AuthContext.Provider value={{ user, currentProfile, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
```
