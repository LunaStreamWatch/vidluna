import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tmdbId = searchParams.get("tmdbId")
  const season = searchParams.get("season")
  const episode = searchParams.get("episode")
  const server = searchParams.get("server") || "veronica"
  const subtitles = searchParams.get("subtitles") === "true"

  if (!tmdbId) {
    return new Response(JSON.stringify({ error: "TMDB ID is required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  }

  try {
    const isTv = Boolean(season && episode)

    if (subtitles) {
      const subtitleUrl = isTv
        ? `https://rainsubs.com/api/subtitles?tmdbId=${tmdbId}&season=${season}&episode=${episode}`
        : `https://rainsubs.com/api/subtitles?tmdbId=${tmdbId}`

      try {
        console.log(`Fetching rainsubs from:`, subtitleUrl)
        const subResponse = await fetch(subtitleUrl, {
          cache: "no-store",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        })

        if (subResponse.ok) {
          const subtitleText = await subResponse.text()
          console.log(`Rainsubs response length:`, subtitleText.length)

          return new Response(
            JSON.stringify({
              success: true,
              subtitles: subtitleText,
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
        } else {
          throw new Error(`Rainsubs API failed: ${subResponse.status}`)
        }
      } catch (subError: any) {
        console.error("Rainsubs fetch failed:", subError)
        return new Response(
          JSON.stringify({
            error: subError.message || "Failed to fetch rainsubs",
            success: false,
          }),
          {
            status: 500,
            headers: { "content-type": "application/json" },
          },
        )
      }
    }

    const targetPath = isTv ? `tv/${tmdbId}/${season}/${episode}` : `movie/${tmdbId}`

    // Try multiple scraping approaches for better reliability
    const scrapingAttempts = []

    if (server === "veronica") {
      // Veronica server - try multiple approaches
      scrapingAttempts.push(
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
        {
          name: "videasy-simple",
          url: `https://scrape.lordflix.club/api/scrape?url=${encodeURIComponent(
            `https://player.videasy.net/${targetPath}`,
          )}`,
        }
      )
    } else if (server === "vienna") {
      // Vienna server - try multiple approaches
      scrapingAttempts.push(
        {
          name: "vidlink-main",
          url: `https://scrape.lordflix.club/api/scrape?url=https://vidlink.pro${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}&waitFor=.m3u8`,
        },
        {
          name: "vidlink-alt",
          url: `https://scrape.lordflix.club/api/scrape?url=https://vidlink.pro${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}`,
        }
      )
    } else if (server === "backup1") {
      // Backup server 1 - try different sources
      scrapingAttempts.push(
        {
          name: "backup1-videasy",
          url: `https://scrape.lordflix.club/api/scrape?url=${encodeURIComponent(
            `https://player.videasy.net/${targetPath}`,
          )}&waitFor=${encodeURIComponent(".m3u8")}`,
        },
        {
          name: "backup1-vidlink",
          url: `https://scrape.lordflix.club/api/scrape?url=https://vidlink.pro${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}&waitFor=.m3u8`,
        }
      )
    } else if (server === "backup2") {
      // Backup server 2 - try alternative scraping methods
      scrapingAttempts.push(
        {
          name: "backup2-simple",
          url: `https://scrape.lordflix.club/api/scrape?url=${encodeURIComponent(
            `https://player.videasy.net/${targetPath}`,
          )}`,
        },
        {
          name: "backup2-vidlink-simple",
          url: `https://scrape.lordflix.club/api/scrape?url=https://vidlink.pro${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}`,
        }
      )
    }

    let m3u8Url: string | null = null
    let lastError: string | null = null

    for (const attempt of scrapingAttempts) {
      try {
        console.log(`Trying ${attempt.name} for ${server}:`, attempt.url)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch(attempt.url, {
          cache: "no-store",
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log(`${attempt.name} response:`, JSON.stringify(data, null, 2))

        // Try multiple ways to extract m3u8 URL
        const possibleUrls: string[] = []

        // Method 1: From requests array
        if (data?.requests && Array.isArray(data.requests)) {
          data.requests.forEach((r: any) => {
            if (r?.url && typeof r.url === "string") {
              possibleUrls.push(r.url)
            }
          })
        }

        // Method 2: From response data
        if (data?.data && typeof data.data === "string") {
          const m3u8Matches = data.data.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/g)
          if (m3u8Matches) {
            possibleUrls.push(...m3u8Matches)
          }
        }

        // Method 3: From HTML content
        if (data?.html && typeof data.html === "string") {
          const m3u8Matches = data.html.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/g)
          if (m3u8Matches) {
            possibleUrls.push(...m3u8Matches)
          }
        }

        // Method 4: From any nested objects
        const findM3u8InObject = (obj: any): string[] => {
          const urls: string[] = []
          if (typeof obj === "string" && obj.includes(".m3u8")) {
            const matches = obj.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/g)
            if (matches) urls.push(...matches)
          } else if (typeof obj === "object" && obj !== null) {
            Object.values(obj).forEach(value => {
              urls.push(...findM3u8InObject(value))
            })
          }
          return urls
        }

        possibleUrls.push(...findM3u8InObject(data))

        // Find the best m3u8 URL
        const validM3u8Url = possibleUrls.find((url: string) => {
          return typeof url === "string" && 
                 url.includes(".m3u8") && 
                 (url.startsWith("http://") || url.startsWith("https://")) &&
                 !url.includes("example") &&
                 !url.includes("placeholder")
        })

        if (validM3u8Url) {
          m3u8Url = validM3u8Url
          console.log(`Found m3u8 URL from ${attempt.name}:`, m3u8Url)
          break
        } else {
          console.log(`No valid m3u8 URL found in ${attempt.name}. Possible URLs:`, possibleUrls)
        }

      } catch (error: any) {
        lastError = error.message
        console.error(`${attempt.name} failed:`, error.message)
        continue
      }
    }

    if (!m3u8Url) {
      // Try direct streaming as last resort
      console.log("Trying direct streaming as fallback...")
      const directUrls = [
        `https://player.videasy.net/${targetPath}`,
        `https://vidlink.pro/${targetPath}`,
        `https://player.videasy.net/${targetPath}/playlist.m3u8`,
        `https://vidlink.pro/${targetPath}/playlist.m3u8`,
      ]

      for (const directUrl of directUrls) {
        try {
          console.log(`Testing direct URL: ${directUrl}`)
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

          const testResponse = await fetch(directUrl, {
            method: "HEAD",
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          })

          clearTimeout(timeoutId)

          if (testResponse.ok && testResponse.headers.get("content-type")?.includes("application/vnd.apple.mpegurl")) {
            m3u8Url = directUrl
            console.log(`Found direct m3u8 URL: ${m3u8Url}`)
            break
          }
        } catch (error) {
          console.log(`Direct URL failed: ${directUrl}`, error)
          continue
        }
      }

      if (!m3u8Url) {
        throw new Error(`No HLS stream found from ${server}. Last error: ${lastError || "All attempts failed"}`)
      }
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
