"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { VscoImage } from "@/components/vsco-image"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Share2, MoreHorizontal, Heart, MessageCircle, Repeat2 } from "lucide-react"
import Link from "next/link"

export default function PostPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const [post, setPost] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const id = params.id as string
                if (!id) return

                const doc = await databases.getDocument(
                    APPWRITE_CONFIG.DATABASE_ID,
                    APPWRITE_CONFIG.COLLECTIONS.POSTS,
                    id
                )
                setPost(doc)
            } catch (error) {
                console.error("Post fetch error:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchPost()
    }, [params.id])

    if (isLoading) return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>
    if (!post) return <div className="flex h-screen items-center justify-center">Post bulunamadı</div>

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-4 h-14 border-b border-border">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <span className="font-medium text-sm">Gönderi</span>
                <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-6 h-6" />
                </Button>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-md mx-auto py-4">
                    {/* User Info */}
                    <div className="flex items-center justify-between px-4 mb-3">
                        <Link href={`/${post.profiles?.username}`} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                                {post.profiles?.avatar_url && <img src={post.profiles.avatar_url} className="w-full h-full object-cover" />}
                            </div>
                            <span className="font-medium text-sm">{post.profiles?.username}</span>
                        </Link>
                    </div>

                    {/* Image */}
                    <div className="w-full bg-muted">
                        <VscoImage
                            src={post.image_url}
                            alt={post.caption || "Post"}
                            className="w-full h-auto object-contain max-h-[70vh]"
                            style={{ aspectRatio: post.aspect_ratio }}
                        />
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3">
                        <div className="flex items-center gap-4 mb-3">
                            <Button variant="ghost" size="icon" className="p-0 h-auto hover:text-red-500">
                                <Heart className="w-6 h-6" />
                            </Button>
                            <Button variant="ghost" size="icon" className="p-0 h-auto">
                                <MessageCircle className="w-6 h-6" />
                            </Button>
                            <Button variant="ghost" size="icon" className="p-0 h-auto">
                                <Repeat2 className="w-6 h-6" />
                            </Button>
                            <div className="flex-1" />
                            <Button variant="ghost" size="icon" className="p-0 h-auto">
                                <Share2 className="w-6 h-6" />
                            </Button>
                        </div>

                        <div className="space-y-1">
                            {post.caption && (
                                <div className="text-sm">
                                    <span className="font-medium mr-2">{post.profiles?.username}</span>
                                    {post.caption}
                                </div>
                            )}
                            <div className="text-xs text-muted-foreground uppercase">
                                {new Date(post.$createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
