"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { auth, db, COLLECTIONS } from "@/lib/firebase/client"
import { onAuthStateChanged, signOut, User } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { useRouter } from "next/navigation"

interface Profile {
    id: string
    username: string
    display_name: string | null
    bio: string | null
    avatar_url: string | null
    member_badge: string | null
    location: string | null
    grid_sort: string | null
    grid_filter: string | null
}

interface AuthContextType {
    user: User | null
    currentProfile: Profile | null
    loading: boolean
    login: (user: User) => void
    logout: () => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchProfile = async (uid: string) => {
        try {
            const profileDoc = await getDoc(doc(db, COLLECTIONS.PROFILES, uid))
            if (profileDoc.exists()) {
                setCurrentProfile({
                    id: profileDoc.id,
                    ...profileDoc.data()
                } as Profile)
            } else {
                setCurrentProfile(null)
            }
        } catch (error) {
            console.error("Error fetching profile:", error)
            setCurrentProfile(null)
        }
    }

    const refreshUser = async () => {
        if (auth.currentUser) {
            await fetchProfile(auth.currentUser.uid)
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser)
            if (firebaseUser) {
                await fetchProfile(firebaseUser.uid)
            } else {
                setCurrentProfile(null)
            }
            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const login = (user: User) => {
        setUser(user)
        fetchProfile(user.uid)
    }

    const logout = async () => {
        try {
            await signOut(auth)
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
