import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

type Server = "ven" | "veronica" | "vienna"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tmdbId = searchParams.get("tmdbId")
  const season = searchParams.get("season")
  const episode = searchParams.get("episode")
  const server = searchParams.get("server") || "ven"

  if (!tmdbId) {
    return new Response(JSON.stringify({ error: "TMDB ID is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  }

  try {
    const isTv = Boolean(season && episode)
    const targetPath = isTv ? `tv/${tmdbId}/${season}/${episode}` : `movie/${tmdbId}`

    let m3u8Url: string | null = null
    let lastError: string | null = null

    if (server === "ven") {
      const vidfastUrl = isTv
        ? `https://vidfast.pro/tv/${tmdbId}/${season}/${episode}?autoplay=true`
        : `https://vidfast.pro/movie/${tmdbId}?autoplay=true`

      const scrapingAttempts = [
        {
          name: "ven-vidfast",
          url: `https://scrape.lordflix.club/api/scrape?url=${encodeURIComponent(vidfastUrl)}&waitFor=${encodeURIComponent(".m3u8")}`,
        },
      ]

      for (const attempt of scrapingAttempts) {
        try {
          console.log(`Trying ${attempt.name}:`, attempt.url)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          const response = await fetch(attempt.url, {
            cache: "no-store",
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const data = await response.json()
          console.log(`${attempt.name} response:`, JSON.stringify(data, null, 2))

          const possibleUrls: string[] = []

          if (data?.requests && Array.isArray(data.requests)) {
            data.requests.forEach((r: any) => {
              if (r?.url && typeof r.url === "string") {
                possibleUrls.push(r.url)
              }
            })
          }

          if (data?.data && typeof data.data === "string") {
            const m3u8Matches = data.data.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/g)
            if (m3u8Matches) {
              possibleUrls.push(...m3u8Matches)
            }
          }

          if (data?.html && typeof data.html === "string") {
            const m3u8Matches = data.html.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/g)
            if (m3u8Matches) {
              possibleUrls.push(...m3u8Matches)
            }
          }

          const findM3u8InObject = (obj: any): string[] => {
            const urls: string[] = []
            if (typeof obj === "string" && obj.includes(".m3u8")) {
              const matches = obj.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/g)
              if (matches) urls.push(...matches)
            } else if (typeof obj === "object" && obj !== null) {
              Object.values(obj).forEach((value) => {
                urls.push(...findM3u8InObject(value))
              })
            }
            return urls
          }

          possibleUrls.push(...findM3u8InObject(data))

          const validM3u8Url = possibleUrls.find((url: string) => {
            return (
              typeof url === "string" &&
              url.includes(".m3u8") &&
              (url.startsWith("http://") || url.startsWith("https://")) &&
              !url.includes("example") &&
              !url.includes("placeholder")
            )
          })

          if (validM3u8Url) {
            m3u8Url = `/api/stream-proxy?url=${encodeURIComponent(validM3u8Url)}`
            console.log(`Found m3u8 URL from ${attempt.name}, proxying through:`, m3u8Url)
            break
          }
        } catch (error: any) {
          lastError = error.message
          console.error(`${attempt.name} failed:`, error.message)
          continue
        }
      }
    } else if (server === "veronica") {
      const scrapingAttempts = [
        {
          name: "videasy-main",
          url: `https://scrape.lordflix.club/api/scrape?url=${encodeURIComponent(
            `https://player.videasy.net/${targetPath}`,
          )}&clickSelector=${encodeURIComponent(".play-icon-main")}&waitFor=${encodeURIComponent(".m3u8")}`,
        },
        {
          name: "videasy-alt",
          url: `https://scrape.lordflix.club/api/scrape?url=${encodeURIComponent(
            `https://player.videasy.net/${targetPath}`,
          )}&waitFor=${encodeURIComponent(".m3u8")}`,
        },
      ]

      for (const attempt of scrapingAttempts) {
        try {
          console.log(`Trying ${attempt.name}:`, attempt.url)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          const response = await fetch(attempt.url, {
            cache: "no-store",
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const data = await response.json()
          const possibleUrls: string[] = []

          if (data?.requests && Array.isArray(data.requests)) {
            data.requests.forEach((r: any) => {
              if (r?.url && typeof r.url === "string") {
                possibleUrls.push(r.url)
              }
            })
          }

          if (data?.data && typeof data.data === "string") {
            const m3u8Matches = data.data.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/g)
            if (m3u8Matches) {
              possibleUrls.push(...m3u8Matches)
            }
          }

          const validM3u8Url = possibleUrls.find((url: string) => {
            return (
              typeof url === "string" &&
              url.includes(".m3u8") &&
              (url.startsWith("http://") || url.startsWith("https://"))
            )
          })

          if (validM3u8Url) {
            m3u8Url = `/api/stream-proxy?url=${encodeURIComponent(validM3u8Url)}`
            console.log(`Found m3u8 URL from ${attempt.name}, proxying through:`, m3u8Url)
            break
          }
        } catch (error: any) {
          lastError = error.message
          console.error(`${attempt.name} failed:`, error.message)
          continue
        }
      }
    } else if (server === "vienna") {
      const scrapingAttempts = [
        {
          name: "vidlink-main",
          url: `https://scrape.lordflix.club/api/scrape?url=https://vidlink.pro/${targetPath}&waitFor=.m3u8`,
        },
      ]

      for (const attempt of scrapingAttempts) {
        try {
          console.log(`Trying ${attempt.name}:`, attempt.url)

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          const response = await fetch(attempt.url, {
            cache: "no-store",
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }

          const data = await response.json()
          const possibleUrls: string[] = []

          if (data?.requests && Array.isArray(data.requests)) {
            data.requests.forEach((r: any) => {
              if (r?.url && typeof r.url === "string") {
                possibleUrls.push(r.url)
              }
            })
          }

          const validM3u8Url = possibleUrls.find((url: string) => {
            return (
              typeof url === "string" &&
              url.includes(".m3u8") &&
              (url.startsWith("http://") || url.startsWith("https://"))
            )
          })

          if (validM3u8Url) {
            m3u8Url = `/api/stream-proxy?url=${encodeURIComponent(validM3u8Url)}`
            console.log(`Found m3u8 URL from ${attempt.name}, proxying through:`, m3u8Url)
            break
          }
        } catch (error: any) {
          lastError = error.message
          console.error(`${attempt.name} failed:`, error.message)
          continue
        }
      }
    }

    if (!m3u8Url) {
      throw new Error(`No HLS stream found from ${server}. Last error: ${lastError || "All attempts failed"}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        streamUrl: m3u8Url,
        server: server,
        metadata: {
          tmdbId,
          type: isTv ? "tv" : "movie",
          season: season || null,
          episode: episode || null,
        },
      }),
      {
        headers: { "content-type": "application/json" },
      },
    )
  } catch (error: any) {
    console.error(`${server} API error:`, error)
    return new Response(
      JSON.stringify({
        error: error.message || `Failed to fetch stream from ${server}`,
        success: false,
        server: server,
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    )
  }
}