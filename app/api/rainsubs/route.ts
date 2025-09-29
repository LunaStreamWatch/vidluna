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
        console.log(`[v0] Fetching rainsubs from:`, subtitleUrl)
        const subResponse = await fetch(subtitleUrl, {
          cache: "no-store",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        })

        if (subResponse.ok) {
          const subtitleText = await subResponse.text()
          console.log(`[v0] Rainsubs response length:`, subtitleText.length)

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
        console.error("[v0] Rainsubs fetch failed:", subError)
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

    let scrapeUrl: string

    if (server === "veronica") {
      // Veronica server uses videasy
      scrapeUrl = `https://scrape.lordflix.club/api/scrape?url=${encodeURIComponent(
        `https://player.videasy.net/${targetPath}`,
      )}&clickSelector=${encodeURIComponent(".play-icon-main")}&waitFor=${encodeURIComponent(".m3u8")}`
    } else {
      // Vienna server uses vidlink
      scrapeUrl = `https://scrape.lordflix.club/api/scrape?url=https://vidlink.pro${targetPath.startsWith("/") ? targetPath : `/${targetPath}`}&waitFor=.m3u8`
    }

    console.log(`[v0] Scraping ${server} URL:`, scrapeUrl)

    const response = await fetch(scrapeUrl, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (!response.ok) {
      throw new Error(`${server} scrape failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[v0] ${server} scrape response:`, data)

    // Extract m3u8 URL from the requests
    const m3u8Url = (data?.requests as any[])
      ?.map((r) => r?.url)
      .find((url: string) => typeof url === "string" && url.endsWith(".m3u8"))

    if (!m3u8Url) {
      throw new Error(`No HLS stream found from ${server}`)
    }

    console.log(`[v0] Found m3u8 URL from ${server}:`, m3u8Url)

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
    console.error(`[v0] ${server} API error:`, error)
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
