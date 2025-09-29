export interface TMDBMovie {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  poster_url: string | null
  backdrop_url: string | null
  release_date: string
  runtime: number | null
  genres: { id: number; name: string }[]
  vote_average: number
  vote_count: number
}

export interface TMDBTVShow {
  id: number
  name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  poster_url: string | null
  backdrop_url: string | null
  first_air_date: string
  genres: { id: number; name: string }[]
  vote_average: number
  vote_count: number
  number_of_seasons: number
  number_of_episodes: number
}

export interface TMDBTVEpisode {
  id: number
  name: string
  overview: string
  still_path: string | null
  still_url: string | null
  air_date: string
  episode_number: number
  season_number: number
  runtime: number | null
  vote_average: number
  vote_count: number
}

export async function fetchTMDBMovie(movieId: string): Promise<TMDBMovie> {
  const response = await fetch(`/api/tmdb?type=movie&id=${movieId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch movie data: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch movie data")
  }

  return result.data
}

export async function fetchTMDBTVShow(tvId: string): Promise<TMDBTVShow> {
  const response = await fetch(`/api/tmdb?type=tv&id=${tvId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch TV show data: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch TV show data")
  }

  return result.data.show
}

export async function fetchTMDBTVEpisode(
  tvId: string,
  seasonNumber: string,
  episodeNumber: string,
): Promise<TMDBTVEpisode> {
  const response = await fetch(`/api/tmdb?type=tv&id=${tvId}&season=${seasonNumber}&episode=${episodeNumber}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch episode data: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch episode data")
  }

  return result.data.episode
}

export async function fetchTMDBData(type: string, id: string, season?: string, episode?: string) {
  const params = new URLSearchParams({ type, id })
  if (season) params.append("season", season)
  if (episode) params.append("episode", episode)

  const response = await fetch(`/api/tmdb?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch TMDB data: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch TMDB data")
  }

  return result.data
}

// Legacy functions for backward compatibility - now deprecated
export function getTMDBImageUrl(
  path: string | null,
  size: "w300" | "w500" | "w780" | "w1280" | "original" = "w500",
): string | null {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}

export function getBackdropUrl(
  path: string | null,
  size: "w300" | "w780" | "w1280" | "original" = "w1280",
): string | null {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}
