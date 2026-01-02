"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { databases, APPWRITE_CONFIG } from "@/lib/appwrite/client"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Share2, MoreHorizontal, Heart, MessageCircle, Repeat2, Trash2 } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

    const handleDelete = async () => {
        if (!confirm("Bu gönderiyi silmek istediğinizden emin misiniz?")) return;

        try {
            await databases.deleteDocument(
                APPWRITE_CONFIG.DATABASE_ID,
                APPWRITE_CONFIG.COLLECTIONS.POSTS,
                post.$id
            );

            alert("Gönderi silindi.");
            // Redirect to user's profile
            const target = user?.name ? `/${user.name}` : '/';
            router.push(target);
        } catch (error) {
            console.error("Delete error:", error);
            alert("Silinirken bir hata oluştu.");
        }
    }

    if (isLoading) return <div className="flex h-screen items-center justify-center">Yükleniyor...</div>
    if (!post) return <div className="flex h-screen items-center justify-center">Post bulunamadı</div>

    // Check ownership
    // user.$id matches post.user_id ? 
    // We need to be careful about fields. usually it is user_id or $permissions depending on setup.
    // Assuming 'user_id' field exists based on previous logic.
    const isOwner = user?.$id && (user.$id === post.user_id || user.$id === post.userId);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between px-4 h-14 border-b border-border">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <span className="font-medium text-sm">Gönderi</span>

                {isOwner ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-6 h-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleDelete} className="text-red-500 cursor-pointer">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Sil
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="w-10" />
                )}
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-md mx-auto py-4">
                    {/* User Info */}
                    <div className="flex items-center justify-between px-4 mb-3">
                        <Link href={`/${post.profiles?.username}`} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                                {post.profiles?.avatar_url && <img src={post.profiles.avatar_url} className="w-full h-full object-cover" />}
                            </div>
                            <span className="font-medium text-sm">{post.profiles?.username}</span>
                        </Link>
                    </div>

                    {/* Image - Native IMG for reliability */}
                    <div className="w-full bg-muted flex items-center justify-center min-h-[300px]">
                        <img
                            src={post.image_url}
                            alt={post.caption || "Post"}
                            className="w-full h-auto object-contain max-h-[70vh]"
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
