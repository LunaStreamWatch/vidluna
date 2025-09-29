import { NextResponse } from "next/server"
import { getStats, getLeaderboard } from "@/lib/stats-store"

export async function GET() {
  const stats = getStats()
  const leaderboard = getLeaderboard()

  return NextResponse.json({
    stats: {
      showsLoaded: stats.showsLoaded,
      rainsubsRequests: stats.rainsubsRequests,
      tmdbRequests: stats.tmdbRequests,
      wyzieRequests: stats.wyzieRequests,
      totalBandwidthGB: stats.totalBandwidthGB.toFixed(2),
    },
    leaderboard,
  })
}
