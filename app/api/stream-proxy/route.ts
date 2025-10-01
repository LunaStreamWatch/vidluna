import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

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
    return NextResponse.json(
      { error: error.message || "Failed to proxy stream" },
      { status: 500 }
    )
  }
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