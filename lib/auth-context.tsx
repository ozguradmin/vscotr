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
    const router = useRouter() // Initialized useRouter

    const checkUser = async () => {
        try {
            const session = await account.get()
            setUser(session)

            // Fetch profile

            try {
                const profile = await databases.getDocument(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.PROFILES,
                    session.$id
                )
                setCurrentProfile(profile)
            } catch {
                setCurrentProfile(null)
            }
        } catch (error) {
            setUser(null)
            setCurrentProfile(null)
        } finally {
            setLoading(false)
        }
    }

    // refreshUser is just an alias for checkUser to be exposed
    const refreshUser = async () => {
        await checkUser();
    }

    useEffect(() => {
        checkUser()
    }, [])

    const login = (user: Models.User<Models.Preferences>) => {
        setUser(user)
        checkUser()
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
