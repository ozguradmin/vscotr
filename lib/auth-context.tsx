"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { account } from "@/lib/appwrite/client"
import { Models } from "appwrite"

interface AuthContextType {
    user: Models.User<Models.Preferences> | null
    loading: boolean
    login: (user: Models.User<Models.Preferences>) => void
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
    const [loading, setLoading] = useState(true)

    const refreshUser = async () => {
        try {
            const userData = await account.get()
            setUser(userData)
        } catch (error) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshUser()
    }, [])

    const login = (user: Models.User<Models.Preferences>) => {
        setUser(user)
    }

    const logout = async () => {
        await account.deleteSession('current')
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
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
