import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  try {
    const origin = url.includes("spectraflux") || url.includes("vidfast")
      ? "https://vidfast.pro"
      : url.includes("vidlink")
        ? "https://vidlink.pro"
        : "https://player.videasy.net"

    const referer = url.includes("spectraflux") || url.includes("vidfast")
      ? "https://vidfast.pro/"
      : url.includes("vidlink")
        ? "https://vidlink.pro/"
        : "https://player.videasy.net/"

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        "Origin": origin,
        "Referer": referer,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch stream: ${response.status}`)
    }

    const contentType = response.headers.get("content-type") || "application/vnd.apple.mpegurl"

    if (contentType.includes("mpegurl") || contentType.includes("m3u")) {
      const text = await response.text()
      const baseUrl = new URL(url)
      const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf("/") + 1)

      const rewrittenContent = text
        .split("\n")
        .map((line) => {
          if (line.startsWith("#") || line.trim() === "") {
            return line
          }

          if (line.startsWith("http://") || line.startsWith("https://")) {
            const proxiedUrl = `/api/stream-proxy?url=${encodeURIComponent(line.trim())}`
            return proxiedUrl
          }

          const fullUrl = `${baseUrl.origin}${basePath}${line.trim()}`
          const proxiedUrl = `/api/stream-proxy?url=${encodeURIComponent(fullUrl)}`
          return proxiedUrl
        })
        .join("\n")

      return new NextResponse(rewrittenContent, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      })
    }

    const content = await response.arrayBuffer()

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("Stream proxy error:", error)
    return NextResponse.json({ error: error.message || "Failed to proxy stream" }, { status: 500 })
  }
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  })
}
