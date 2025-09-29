import { type NextRequest, NextResponse } from "next/server"
import {
  incrementShowsLoaded,
  incrementRainsubsRequests,
  incrementTmdbRequests,
  incrementWyzieRequests,
  addBandwidth,
} from "@/lib/stats-store"

export async function POST(request: NextRequest) {
  try {
    const { type, bandwidth } = await request.json()
    const referrer = request.headers.get("referer") || undefined

    switch (type) {
      case "show-loaded":
        incrementShowsLoaded(referrer)
        break
      case "rainsubs":
        incrementRainsubsRequests(referrer)
        break
      case "tmdb":
        incrementTmdbRequests(referrer)
        break
      case "wyzie":
        incrementWyzieRequests(referrer)
        break
      case "bandwidth":
        if (typeof bandwidth === "number") {
          addBandwidth(bandwidth, referrer)
        }
        break
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
