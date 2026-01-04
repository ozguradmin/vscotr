"use client"

import { useEffect, useState } from "react"
import { notFound } from "next/navigation"
import { ProfileView } from "@/components/profile-view"
import { ProfileViewSkeleton } from "@/components/skeleton-loader"
import { db, COLLECTIONS } from "@/lib/firebase/client"
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore"

interface Profile {
    id: string
    username: string
    display_name: string | null
    bio: string | null
    avatar_url: string | null
    member_badge: string | null
    location?: string | null
    grid_sort?: string | null
    grid_filter?: string | null
}

interface ProfileViewClientProps {
    username: string
}

export function ProfileViewClient({ username }: ProfileViewClientProps) {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [links, setLinks] = useState<{ id: string; label: string; url: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [notFoundState, setNotFoundState] = useState(false)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Query profile by username
                const profilesRef = collection(db, COLLECTIONS.PROFILES)
                const q = query(profilesRef, where("username", "==", username.toLowerCase()))
                const querySnapshot = await getDocs(q)

                if (querySnapshot.empty) {
                    setNotFoundState(true)
                    setLoading(false)
                    return
                }

                const profileDoc = querySnapshot.docs[0]
                const profileData = profileDoc.data()

                setProfile({
                    id: profileDoc.id,
                    username: profileData.username,
                    display_name: profileData.display_name,
                    bio: profileData.bio,
                    avatar_url: profileData.avatar_url,
                    member_badge: profileData.member_badge,
                    location: profileData.location,
                    grid_sort: profileData.grid_sort,
                    grid_filter: profileData.grid_filter
                })

                // Fetch profile links
                try {
                    const linksRef = collection(db, COLLECTIONS.PROFILE_LINKS)
                    const linksQuery = query(linksRef, where("profile_id", "==", profileDoc.id))
                    const linksSnapshot = await getDocs(linksQuery)

                    const linksData = linksSnapshot.docs.map(doc => ({
                        id: doc.id,
                        label: doc.data().label || "",
                        url: doc.data().url
                    }))
                    setLinks(linksData)
                } catch (e) {
                    console.error("Links fetch error:", e)
                }

                setLoading(false)
            } catch (error) {
                console.error("Profile fetch error:", error)
                setNotFoundState(true)
                setLoading(false)
            }
        }

        fetchProfile()
    }, [username])

    if (loading) {
        return <ProfileViewSkeleton />
    }

    if (notFoundState || !profile) {
        notFound()
    }

    return (
        <ProfileView
            profile={profile}
            posts={[]}
            links={links}
            reposts={[]}
            isOwnProfile={false}
        />
    )
}
