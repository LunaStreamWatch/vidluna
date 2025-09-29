// Simple in-memory store for tracking statistics
// In production, this would be replaced with a database

interface Stats {
  showsLoaded: number
  rainsubsRequests: number
  tmdbRequests: number
  wyzieRequests: number
  totalBandwidthGB: number
  embedders: Record<string, number> // domain -> count
}

const stats: Stats = {
  showsLoaded: 0,
  rainsubsRequests: 0,
  tmdbRequests: 0,
  wyzieRequests: 0,
  totalBandwidthGB: 0,
  embedders: {},
}

export function getStats(): Stats {
  return { ...stats, embedders: { ...stats.embedders } }
}

export function incrementShowsLoaded(referrer?: string) {
  stats.showsLoaded++
  if (referrer) {
    trackEmbedder(referrer)
  }
}

export function incrementRainsubsRequests(referrer?: string) {
  stats.rainsubsRequests++
  if (referrer) {
    trackEmbedder(referrer)
  }
}

export function incrementTmdbRequests(referrer?: string) {
  stats.tmdbRequests++
  if (referrer) {
    trackEmbedder(referrer)
  }
}

export function incrementWyzieRequests(referrer?: string) {
  stats.wyzieRequests++
  if (referrer) {
    trackEmbedder(referrer)
  }
}

export function addBandwidth(gb: number, referrer?: string) {
  stats.totalBandwidthGB += gb
  if (referrer) {
    trackEmbedder(referrer)
  }
}

function trackEmbedder(referrer: string) {
  try {
    const url = new URL(referrer)
    const domain = url.hostname
    if (domain && domain !== "vidluna.fun" && domain !== "localhost") {
      stats.embedders[domain] = (stats.embedders[domain] || 0) + 1
    }
  } catch {
    // Invalid URL, ignore
  }
}

export function getLeaderboard(): Array<{ domain: string; count: number }> {
  return Object.entries(stats.embedders)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) // Top 10
}
