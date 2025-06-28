// Helper function to get cache key
export function getCacheKey(packageName: string, period: string): string {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
  return `pypi-downloads:${packageName}:${period}:${today}`;
}

// Helper function to get cache until end of day
export function getCacheUntilEndOfDay(): number {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return Math.floor((endOfDay.getTime() - now.getTime()) / 1000); // seconds until end of day
}

// Helper function to get cached response
export async function getCachedResponse(cacheKey: string): Promise<any | null> {
  try {
    const cache = await caches.open("pypi-downloads");
    const cachedResponse = await cache.match(
      new Request(`https://cache/${cacheKey}`)
    );
    
    if (cachedResponse) {
      return await cachedResponse.json();
    }
    return null;
  } catch (error) {
    console.error("Error getting cached response:", error);
    return null;
  }
}

// Helper function to cache response
export async function cacheResponse(
  cacheKey: string,
  responseData: any,
  cacheSeconds: number
): Promise<void> {
  try {
    const cache = await caches.open("pypi-downloads");
    const cacheResponse = new Response(
      JSON.stringify({
        ...responseData,
        cached: false, // Will be true when served from cache
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": `max-age=${cacheSeconds}`,
        },
      }
    );

    await cache.put(
      new Request(`https://cache/${cacheKey}`),
      cacheResponse
    );
    console.log(`Cached response for ${cacheKey}`);
  } catch (error) {
    console.error("Failed to cache response:", error);
  }
} 