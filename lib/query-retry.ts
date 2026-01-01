/**
 * Supabase query'leri için retry mekanizması
 * Timeout hatalarında (57014) otomatik tekrar dener
 */
export async function queryWithRetry<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    maxRetries = 3,
    delayMs = 500
): Promise<{ data: T | null; error: any }> {
    let lastError: any = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const result = await queryFn()

        // Başarılı veya timeout dışı hata
        if (!result.error || result.error.code !== '57014') {
            return result
        }

        lastError = result.error
        console.log(`[Retry] Attempt ${attempt}/${maxRetries} failed with timeout, retrying in ${delayMs}ms...`)

        // Son deneme değilse bekle
        if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delayMs))
            delayMs *= 1.5 // Exponential backoff
        }
    }

    console.error(`[Retry] All ${maxRetries} attempts failed`)
    return { data: null, error: lastError }
}
