import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tmdbId = searchParams.get("tmdbId")
  const season = searchParams.get("season")
  const episode = searchParams.get("episode")

  if (!tmdbId) {
    return NextResponse.json({ error: "Missing tmdbId parameter" }, { status: 400 })
  }

  try {
    // Build the RainSubs API URL
    let rainsubsUrl = `https://rainsubs.vercel.app/api/subtitles?tmdbId=${tmdbId}`

    if (season && episode) {
      rainsubsUrl += `&season=${season}&episode=${episode}`
    }

    console.log("[v0] Proxying RainSubs request:", rainsubsUrl)

    // Fetch from RainSubs API server-side to bypass CORS
    const response = await fetch(rainsubsUrl, {
      headers: {
        "User-Agent": "Vidluna/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`RainSubs API returned ${response.status}`)
    }

    const srtContent = await response.text()

    // Return the SRT content
    return new NextResponse(srtContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error: any) {
    console.error("[v0] RainSubs proxy error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch subtitles" }, { status: 500 })
  }
}
