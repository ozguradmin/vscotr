/**
 * vscotr-cdn Worker
 * Proxies and caches Appwrite Storage images via Cloudflare
 * This drastically reduces Appwrite bandwidth usage
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Only handle GET requests
        if (request.method !== 'GET') {
            return new Response('Method not allowed', { status: 405, headers: corsHeaders });
        }

        // Route: /image/{fileId}
        // Optional query params: width, height, quality
        const imageMatch = pathname.match(/^\/image\/([a-zA-Z0-9]+)$/);

        if (!imageMatch) {
            return new Response('Not found. Use /image/{fileId}', { status: 404, headers: corsHeaders });
        }

        const fileId = imageMatch[1];
        const width = url.searchParams.get('width');
        const height = url.searchParams.get('height');
        const quality = url.searchParams.get('quality') || '80';

        // Construct Appwrite URL - using /view endpoint (works on free tier)
        const bucketId = 'photos';
        const appwriteUrl = `${env.APPWRITE_ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${env.APPWRITE_PROJECT_ID}`;

        // Create cache key including size params for different cached versions
        const cacheKey = new Request(
            `${url.origin}/cached/${fileId}/${width || 'orig'}/${height || 'orig'}/${quality}`,
            request
        );

        // Check cache first
        const cache = caches.default;
        let response = await cache.match(cacheKey);

        if (response) {
            // Return cached response with cache hit header
            const headers = new Headers(response.headers);
            headers.set('X-Cache', 'HIT');
            headers.set('Access-Control-Allow-Origin', '*');
            return new Response(response.body, {
                status: response.status,
                headers: headers
            });
        }

        // Fetch from Appwrite
        try {
            const appwriteResponse = await fetch(appwriteUrl, {
                headers: {
                    'User-Agent': 'vscotr-cdn/1.0'
                }
            });

            if (!appwriteResponse.ok) {
                return new Response(`Appwrite error: ${appwriteResponse.status}`, {
                    status: appwriteResponse.status,
                    headers: corsHeaders
                });
            }

            // Get the image
            const imageData = await appwriteResponse.arrayBuffer();
            const contentType = appwriteResponse.headers.get('Content-Type') || 'image/jpeg';

            // Create response with long cache headers
            response = new Response(imageData, {
                status: 200,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
                    'X-Cache': 'MISS',
                    'Access-Control-Allow-Origin': '*',
                }
            });

            // Store in cache (don't await - fire and forget)
            ctx.waitUntil(cache.put(cacheKey, response.clone()));

            return response;

        } catch (error) {
            return new Response(`Error: ${error.message}`, {
                status: 500,
                headers: corsHeaders
            });
        }
    }
};
