import type { NextRequest } from "next/server"

export const dynamic = "force-dynamic"

const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

function getApiKey(): string {
  const apiKey = process.env.TMDB_API_KEY
  if (!apiKey) {
    throw new Error("TMDB_API_KEY environment variable is required")
  }
  return apiKey
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") // "movie" or "tv"
  const id = searchParams.get("id")
  const season = searchParams.get("season")
  const episode = searchParams.get("episode")

  if (!type || !id) {
    return new Response(JSON.stringify({ error: "Type and ID are required" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  }

  try {
    const apiKey = getApiKey()

    if (type === "movie") {
      const response = await fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${apiKey}&language=en-US`)

      if (!response.ok) {
        throw new Error(`Failed to fetch movie data: ${response.status}`)
      }

      const movieData = await response.json()

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...movieData,
            poster_url: movieData.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movieData.poster_path}` : null,
            backdrop_url: movieData.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${movieData.backdrop_path}` : null,
          },
        }),
        {
          headers: { "content-type": "application/json" },
        },
      )
    } else if (type === "tv") {
      const requests = [fetch(`${TMDB_BASE_URL}/tv/${id}?api_key=${apiKey}&language=en-US`)]

      if (season && episode) {
        requests.push(
          fetch(`${TMDB_BASE_URL}/tv/${id}/season/${season}/episode/${episode}?api_key=${apiKey}&language=en-US`),
        )
      }

      const responses = await Promise.all(requests)

      if (!responses[0].ok) {
        throw new Error(`Failed to fetch TV show data: ${responses[0].status}`)
      }

      const tvData = await responses[0].json()
      let episodeData = null

      if (responses[1] && responses[1].ok) {
        episodeData = await responses[1].json()
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            show: {
              ...tvData,
              poster_url: tvData.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${tvData.poster_path}` : null,
              backdrop_url: tvData.backdrop_path ? `${TMDB_IMAGE_BASE_URL}/w1280${tvData.backdrop_path}` : null,
            },
            episode: episodeData
              ? {
                  ...episodeData,
                  still_url: episodeData.still_path ? `${TMDB_IMAGE_BASE_URL}/w780${episodeData.still_path}` : null,
                }
              : null,
          },
        }),
        {
          headers: { "content-type": "application/json" },
        },
      )
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    })
  } catch (error: any) {
    console.error("[v0] TMDB API error:", error)
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch TMDB data",
        success: false,
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    )
  }
}
