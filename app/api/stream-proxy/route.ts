import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const url = searchParams.get("url")
  const type = searchParams.get("type") // "movie" or "tv"
  const id = searchParams.get("id")
  const season = searchParams.get("season")
  const episode = searchParams.get("episode")
  const server = searchParams.get("server") || "ven"

  // If URL is provided, handle proxying (legacy support)
  if (url) {
    try {
      console.log("Proxying request to:", url)

      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type") || ""
      const isM3U8 = url.includes(".m3u8") || contentType.includes("application/vnd.apple.mpegurl") || contentType.includes("application/x-mpegURL")

      if (isM3U8) {
        // Handle m3u8 playlist files
        const text = await response.text()
        const lines = text.split("\n")
        const baseUrl = new URL(url)
        const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf("/") + 1)

        const modifiedLines = lines.map((line) => {
          const trimmedLine = line.trim()

          // Skip empty lines and comments
          if (!trimmedLine || trimmedLine.startsWith("#")) {
            return line
          }

          // Check if it's a relative URL (doesn't start with http)
          if (!trimmedLine.startsWith("http")) {
            // Construct the full URL
            const fullUrl = `${baseUrl.protocol}//${baseUrl.host}${basePath}${trimmedLine}`
            // Return it as a proxied URL
            return `/api/stream-proxy?url=${encodeURIComponent(fullUrl)}`
          }

          // If it's already a full URL, proxy it
          return `/api/stream-proxy?url=${encodeURIComponent(trimmedLine)}`
        })

        const modifiedContent = modifiedLines.join("\n")

        return new NextResponse(modifiedContent, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Range, Content-Range, Content-Type",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        })
      } else {
        // Handle video segments and other files
        const arrayBuffer = await response.arrayBuffer()

        return new NextResponse(arrayBuffer, {
          status: 200,
          headers: {
            "Content-Type": contentType || "application/octet-stream",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Range, Content-Range, Content-Type",
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600",
          },
        })
      }
    } catch (error: any) {
      console.error("Stream proxy error:", error)
      if (error.message.includes('404')) {
        return NextResponse.json({ error: "Stream not available" }, { status: 404 })
      } else {
        return NextResponse.json(
          { error: error.message || "Failed to proxy stream" },
          { status: 500 }
        )
      }
    }
  }

  // If type/id are provided, use new scraper
  if (type && id) {
    if (type !== "movie" && type !== "tv") {
      return NextResponse.json({ error: "type must be 'movie' or 'tv'" }, { status: 400 })
    }

    if (type === "tv" && (!season || !episode)) {
      return NextResponse.json({ error: "season and episode parameters are required for tv" }, { status: 400 })
    }

    try {
      // Map server to port and parameter style
      const serverConfig = {
        ven: { port: parseInt(process.env.SCRAPER_PORT_VEN || '3101'), tvParams: (s: string, e: string) => `se=${s}&ep=${e}` },
        vienna: { port: parseInt(process.env.SCRAPER_PORT_VIENNA || '3132'), tvParams: (s: string, e: string) => `season=${s}&episode=${e}` },
      }

      const config = serverConfig[server as keyof typeof serverConfig] || serverConfig.ven
      const baseUrl = `http://${process.env.SCRAPER_BASE_IP}:${config.port}`
      let scraperUrl: string

      if (type === "movie") {
        scraperUrl = `${baseUrl}/movie?id=${id}`
      } else {
        scraperUrl = `${baseUrl}/tv?id=${id}&${config.tvParams(season!, episode!)}`
      }

      console.log("Fetching from scraper:", scraperUrl)

      const response = await fetch(scraperUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Scraper HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("Scraper data:", data)

      // Return the m3u8 URL directly without proxying
      const isTv = type === "tv"
      return NextResponse.json({
        success: true,
        streamUrl: data.m3u8,
        server: server,
        metadata: {
          tmdbId: id,
          type: type,
          season: season || null,
          episode: episode || null,
        },
      }, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Range, Content-Range, Content-Type",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      })
    } catch (error: any) {
      console.error("Scraper error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to fetch from scraper" },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ error: "Either 'url' or 'type'+'id' parameters are required" }, { status: 400 })
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Range, Content-Type",
    },
  })
}