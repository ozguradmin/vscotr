import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === "undefined") return undefined
          const value = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)")
          return value ? value.pop() : undefined
        },
        set(name: string, value: string, options: any) {
          if (typeof document === "undefined") return
          document.cookie = `${name}=${value}; path=/; ${options.maxAge ? `max-age=${options.maxAge};` : ""}`
        },
        remove(name: string, options: any) {
          if (typeof document === "undefined") return
          document.cookie = `${name}=; path=/; max-age=0`
        },
      },
    },
  )

  return client
}
