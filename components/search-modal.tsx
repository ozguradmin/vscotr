"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Input } from "@/components/ui/input"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  member_badge: string | null
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  // Arama yap
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchUsers = async () => {
      setIsLoading(true)
      const { data } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, member_badge")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20)

      if (data) {
        setResults(data)
      }
      setIsLoading(false)
    }

    searchUsers()
  }, [query, supabase])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 h-14 px-4 border-b border-border">
        <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <Input
          type="text"
          placeholder="Kullanıcı ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border-0 focus-visible:ring-0 px-0"
          autoFocus
        />
        <button onClick={onClose} className="p-2 hover:bg-accent rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Results */}
      <div className="p-4 max-w-2xl mx-auto">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Aranıyor...</p>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            {results.map((user) => (
              <Link
                key={user.id}
                href={`/${user.username}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg transition-colors"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url || "/placeholder.svg"}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-muted-foreground">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.username}</p>
                  {user.display_name && user.display_name !== user.username && (
                    <p className="text-sm text-muted-foreground truncate">{user.display_name}</p>
                  )}
                </div>
                {user.member_badge && (
                  <span className="px-2 py-1 bg-foreground text-background text-xs font-medium uppercase">
                    {user.member_badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : query.trim() ? (
          <p className="text-center text-muted-foreground py-8">Kullanıcı bulunamadı</p>
        ) : (
          <p className="text-center text-muted-foreground py-8">Aramaya başlamak için yazmaya başla</p>
        )}
      </div>
    </div>
  )
}
