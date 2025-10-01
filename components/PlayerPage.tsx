"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Loader2, AlertCircle, Play } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import VideoPlayer from "./VideoPlayer"
import type { TMDBMovie, TMDBTVShow, TMDBTVEpisode } from "@/lib/tmdb"

type PlayerPageProps = {
  type: string
  id: string
  season?: string
  episode?: string
}

type SubItem = {
  id: string
  url: string
  flagUrl?: string
  language: string
  display: string
  format?: string
  source: "wyzie" | "rainsubs"
  isHearingImpaired?: boolean
}

type VttCue = {
  start: number
  end: number
  lines: string[]
}

type Server = "ven" | "veronica" | "vienna"

export default function PlayerPage(props: PlayerPageProps) {
  const { type, id, season, episode } = props
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlColor = searchParams.get("color")
  const urlAutoplay = searchParams.get("autoplay") === "true"
  const urlMuted = searchParams.get("muted") === "true"

  const initialColor = urlColor ? `#${urlColor}` : "#fbc9ff"

  const [accentColor, setAccentColor] = useState(initialColor)
  const [subtitleColor, setSubtitleColor] = useState("#ffffff")
  const [subtitleSettings, setSubtitleSettings] = useState({
    fontSize: 24,
    fontFamily: "Verdana", // Changed default font to Verdana
    backgroundColor: "#000000",
    backgroundOpacity: 0,
    timing: 0,
  })

  const [hlsUrl, setHlsUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [showPlayButton, setShowPlayButton] = useState(!urlAutoplay) // Hide play button if autoplay is enabled
  const [hasStartedPlaying, setHasStartedPlaying] = useState(urlAutoplay) // Start playing if autoplay is enabled
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [currentServer, setCurrentServer] = useState<Server>("ven")
  const [availableServers, setAvailableServers] = useState<Server[]>(["ven", "veronica", "vienna"])
  const [isServerSwitching, setIsServerSwitching] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [maxRetries] = useState(3)

  const [movieData, setMovieData] = useState<TMDBMovie | null>(null)
  const [tvShowData, setTvShowData] = useState<TMDBTVShow | null>(null)
  const [episodeData, setEpisodeData] = useState<TMDBTVEpisode | null>(null)
  const [backdropUrl, setBackdropUrl] = useState<string | null>(null)

  const [subs, setSubs] = useState<SubItem[]>([])
  const [selectedSub, setSelectedSub] = useState<SubItem | null>(null)
  const [vttCues, setVttCues] = useState<VttCue[]>([])
  const [activeSubtitle, setActiveSubtitle] = useState<string[] | null>(null)
  const [showSubtitles, setShowSubtitles] = useState(false)
  const [rainsubsLoaded, setRainsubsLoaded] = useState(false)

  const targetPath = useMemo(() => {
    if (type === "movie") return `movie/${id}`
    return `tv/${id}/${season ?? "1"}/${episode ?? "1"}`
  }, [type, id, season, episode])

  const hasNextEpisode = useMemo(() => {
    if (type !== "tv" || !tvShowData || !episodeData) return false

    const currentSeason = Number.parseInt(season ?? "1")
    const currentEpisode = Number.parseInt(episode ?? "1")

    // Find the current season data
    const seasonData = tvShowData.seasons?.find((s: any) => s.season_number === currentSeason)
    if (!seasonData) return false

    // Check if there's a next episode in the current season
    return currentEpisode < seasonData.episode_count
  }, [type, tvShowData, episodeData, season, episode])

  const handleNextEpisode = useCallback(() => {
    if (!hasNextEpisode) return

    const currentSeason = Number.parseInt(season ?? "1")
    const currentEpisode = Number.parseInt(episode ?? "1")
    const nextEpisode = currentEpisode + 1

    // Build URL with current parameters
    const params = new URLSearchParams()
    if (urlColor) params.set("color", urlColor)
    if (urlAutoplay) params.set("autoplay", "true")
    if (urlMuted) params.set("muted", "true")

    const queryString = params.toString()
    const newUrl = `/embed/tv/${id}/${currentSeason}/${nextEpisode}${queryString ? `?${queryString}` : ""}`

    router.push(newUrl)
  }, [hasNextEpisode, season, episode, id, urlColor, urlAutoplay, urlMuted, router])

  const fetchTMDBData = useCallback(async () => {
    try {
      console.log("Fetching TMDB data for:", { type, id, season, episode })

      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "tmdb" }),
      }).catch((err) => console.error("Failed to track TMDB request:", err))

      const params = new URLSearchParams({
        type,
        id,
      })

      if (season) params.append("season", season)
      if (episode) params.append("episode", episode)

      const response = await fetch(`/api/tmdb?${params}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || `API failed: ${response.status}`)
      }

      const data = result.data

      if (type === "movie") {
        setMovieData(data)
        setBackdropUrl(data.backdrop_url)
        console.log("Movie data loaded:", data.title)
      } else if (type === "tv") {
        setTvShowData(data.show)
        setEpisodeData(data.episode)
        setBackdropUrl(data.show.backdrop_url)
        console.log("TV show data loaded:", data.show.name, data.episode?.name)
      }
    } catch (error: any) {
      console.error("Failed to fetch TMDB data:", error)
      if (type === "movie") {
        setMovieData({
          id: Number.parseInt(id),
          title: "Movie",
          overview: "",
          poster_path: null,
          backdrop_path: null,
          poster_url: null,
          backdrop_url: null,
          release_date: "",
          runtime: null,
          genres: [],
          vote_average: 0,
          vote_count: 0,
        })
      }
    }
  }, [type, id, season, episode])

  const fetchStream = useCallback(
    async (server: Server = currentServer) => {
      setLoading(true)
      setError(null)
      try {
        console.log(`Fetching stream from ${server} for:`, targetPath)

        const url = `/api/rainsubs?tmdbId=${id}&server=${server}${season ? `&season=${season}` : ""}${episode ? `&episode=${episode}` : ""}`

        const res = await fetch(url, { cache: "no-store" })
        const data = await res.json()

        console.log(`${server} response:`, data)

        if (!res.ok || !data.success) {
          throw new Error(data.error || `API failed: ${res.status}`)
        }

        if (!data.streamUrl) {
          throw new Error("No HLS stream found")
        }

        setHlsUrl(data.streamUrl)
        setCurrentServer(server)
        setRetryCount(0) // Reset retry count on success
        console.log(`Stream URL set from ${server}:`, data.streamUrl)
      } catch (e: any) {
        console.error(`${server} fetch error:`, e)

        // Try all available servers as fallbacks
        const fallbackServers = availableServers.filter(s => s !== server)
        for (const fallbackServer of fallbackServers) {
          try {
            console.log(`Trying fallback server ${fallbackServer}...`)
            await fetchStream(fallbackServer)
            return
          } catch (fallbackError) {
            console.error(`${fallbackServer} fallback failed:`, fallbackError)
            continue
          }
        }
        console.error("All servers failed")

        if (retryCount < maxRetries) {
          console.log(`Retrying in 3 seconds... (${retryCount + 1}/${maxRetries})`)
          setRetryCount(prev => prev + 1)
          setTimeout(() => {
            fetchStream()
          }, 3000)
          return
        }

        setError(e?.message ?? `Failed to load stream from all servers after ${maxRetries} retries. Tried: ${availableServers.join(", ")}`)
      } finally {
        setLoading(false)
      }
    },
    [type, id, season, episode, targetPath, currentServer],
  )

  const fetchSubs = useCallback(async () => {
    try {
      const showName = type === "tv" ? tvShowData?.name || "TV Show" : movieData?.title || "Movie"
      console.log(
        `Requesting ${showName} subtitles for ${type === "movie" ? "movie" : `season ${season || 1} episode ${episode || 1}`} with tmdb id ${id}`,
      )

      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "wyzie" }),
      }).catch((err) => console.error("Failed to track Wyzie request:", err))

      const wyzieUrl =
        type === "movie"
          ? `https://sub.wyzie.ru/search?id=${id}`
          : `https://sub.wyzie.ru/search?id=${id}&season=${season ?? 1}&episode=${episode ?? 1}`

      const wyzieRes = await fetch(wyzieUrl).then((r) => r.json())

      const wyzieList: SubItem[] = (wyzieRes || []).map((s: any) => ({
        id: String(s.id ?? `${s.language}-${s.url}`),
        url: String(s.url),
        flagUrl: String(s.flagUrl || ""),
        language: String(s.language || "und"),
        display: String(s.display || s.language || "Unknown"),
        format: String(s.format || "srt"),
        source: "wyzie" as const,
        isHearingImpaired: Boolean(s.isHearingImpaired),
      }))

      const englishSubs = wyzieList.filter((sub) => sub.language === "en")
      const otherSubs = wyzieList.filter((sub) => sub.language !== "en")

      const rainsubsPlaceholder: SubItem = {
        id: "rainsubs",
        url: "", // Empty URL, will be loaded when selected
        language: "rainbow",
        display: "Rainbow Subs",
        format: "srt",
        source: "rainsubs" as const,
      }

      const allSubs = [...englishSubs, ...otherSubs, rainsubsPlaceholder]
      setSubs(allSubs)
      console.log("Loaded subtitles:", allSubs.length)
    } catch (error) {
      console.error("Failed to fetch subtitles:", error)
      setSubs([])
    }
  }, [id, type, season, episode, tvShowData?.name, movieData?.title])

  const fetchRainSubs = useCallback(async () => {
    if (rainsubsLoaded) return

    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "rainsubs" }),
      }).catch((err) => console.error("Failed to track RainSubs request:", err))

      const rainsubsUrl =
        type === "movie"
          ? `/api/rainsubs-proxy?tmdbId=${id}`
          : `/api/rainsubs-proxy?tmdbId=${id}&season=${season ?? 1}&episode=${episode ?? 1}`

      console.log("Fetching rainsubs from proxy:", rainsubsUrl)

      const response = await fetch(rainsubsUrl)
      const srtText = await response.text()

      if (srtText && srtText.length > 10) {
        console.log("Successfully loaded RainSubs subtitles")

        const utf8Bytes = new TextEncoder().encode(srtText)
        let binaryString = ""
        const chunkSize = 8192
        for (let i = 0; i < utf8Bytes.length; i += chunkSize) {
          const chunk = utf8Bytes.slice(i, i + chunkSize)
          binaryString += String.fromCharCode(...chunk)
        }
        const base64 = btoa(binaryString)

        setSubs((prevSubs) =>
          prevSubs.map((sub) => (sub.id === "rainsubs" ? { ...sub, url: `data:text/plain;base64,${base64}` } : sub)),
        )
        setRainsubsLoaded(true)
      } else {
        console.log("No RainSubs subtitles available")
        setSubs((prevSubs) => prevSubs.filter((sub) => sub.id !== "rainsubs"))
      }
    } catch (error) {
      console.error("Failed to fetch RainSubs:", error)
      setSubs((prevSubs) => prevSubs.filter((sub) => sub.id !== "rainsubs"))
    }
  }, [id, type, season, episode, rainsubsLoaded])

  const loadSubtitle = useCallback(
    async (sub: SubItem | null) => {
      if (!sub) {
        setVttCues([])
        setActiveSubtitle(null)
        return
      }

      if (sub.id === "rainsubs" && !sub.url) {
        await fetchRainSubs()
        return
      }

      try {
        let text: string

        if (sub.url.startsWith("data:")) {
          const base64Data = sub.url.split(",")[1]
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          text = new TextDecoder().decode(bytes)
        } else {
          const res = await fetch(sub.url)
          text = await res.text()
        }

        const vtt = await convertToVtt(text, sub.format || "srt", subtitleSettings.timing)
        const cues = parseVttToCues(vtt)
        setVttCues(cues)
      } catch (error) {
        console.error("Failed to load subtitle:", error)
        setVttCues([])
      }
    },
    [subtitleSettings.timing, fetchRainSubs],
  )

  const handlePlayClick = () => {
    setShowPlayButton(false)
    setHasStartedPlaying(true)
  }

  const switchServer = useCallback(
    async (server: Server) => {
      if (server === currentServer || isServerSwitching) return

      setIsServerSwitching(true)
      const previousServer = currentServer

      try {
        console.log(`Switching to ${server} server...`)

        const url = `/api/rainsubs?tmdbId=${id}&server=${server}${season ? `&season=${season}` : ""}${episode ? `&episode=${episode}` : ""}`

        const res = await fetch(url, { cache: "no-store" })
        const data = await res.json()

        if (!res.ok || !data.success || !data.streamUrl) {
          throw new Error(data.error || "Server not available")
        }

        setHlsUrl(data.streamUrl)
        setCurrentServer(server)
        setError(null)

        console.log(`Successfully switched to ${server}:`, data.streamUrl)
      } catch (e: any) {
        console.error(`Failed to switch to ${server}:`, e)

        setError(`${server} server unavailable. Reverting to ${previousServer}. Available servers: ${availableServers.join(", ")}`)
        setTimeout(() => setError(null), 3000)
      } finally {
        setIsServerSwitching(false)
      }
    },
    [currentServer, isServerSwitching, id, season, episode],
  )

  const handleSubtitleSelect = useCallback(
    (subId: string) => {
      if (!subId) {
        setSelectedSub(null)
        setShowSubtitles(false)
        return
      }

      const sub = subs.find((s) => s.id === subId)
      if (sub) {
        setSelectedSub(sub)
        setShowSubtitles(true)
      }
    },
    [subs],
  )

  const handleSubtitleToggle = useCallback(() => {
    setShowSubtitles((prev) => !prev)
  }, [])

  useEffect(() => {
    fetchTMDBData()
    fetchStream()
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "show-loaded" }),
    }).catch((err) => console.error("Failed to track show load:", err))
  }, [fetchTMDBData, fetchStream])

  useEffect(() => {
    if (movieData || tvShowData) {
      fetchSubs()
    }
  }, [fetchSubs, movieData, tvShowData])

  useEffect(() => {
    loadSubtitle(selectedSub)
  }, [selectedSub, loadSubtitle])

  useEffect(() => {
    if (vttCues.length > 0) {
      const activeCue = vttCues.find((cue) => currentTime >= cue.start && currentTime <= cue.end)
      setActiveSubtitle(activeCue ? activeCue.lines : null)
    } else {
      setActiveSubtitle(null)
    }
  }, [currentTime, vttCues])

  const getTitle = () => {
    if (type === "tv") {
      const showName = tvShowData?.name || "TV Show"
      const seasonEpisode = `S${season ?? 1}E${episode ?? 1}`
      return `${showName} - ${seasonEpisode}`
    }
    return movieData?.title || "Movie"
  }

  const getShowNameForPlayButton = () => {
    if (type === "tv") {
      const showName = tvShowData?.name || "TV Show"
      return `${showName} S${season ?? 1} E${episode ?? 1}`
    }
    return movieData?.title || "Movie"
  }

  const servers = [
    { id: "ven", name: "Ven", flag: "🇺🇸" },
    { id: "veronica", name: "Veronica", flag: "🇺🇸" },
    { id: "vienna", name: "Vienna", flag: "🇺🇸" },
  ].filter(server => availableServers.includes(server.id as Server))

  const subtitleOptions = subs.map((sub) => ({
    id: sub.id,
    language: sub.language,
    label: sub.display,
    flagUrl: sub.flagUrl,
    source: sub.source,
  }))

  if (loading) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden">
        {backdropUrl && (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backdropUrl})` }} />
        )}
        <div className="absolute inset-0 bg-black/60" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8">
          <div className="mb-8">
            <Loader2 className="w-16 h-16 text-white animate-spin mx-auto" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 text-balance">{getTitle()}</h1>
          <p className="text-xl text-gray-300 mb-6">Preparing your viewing experience...</p>
        </div>
      </div>
    )
  }

  if (error && !hlsUrl) {
    return (
      <div className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Playback Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            onClick={() => {
              setError(null)
              fetchStream()
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen bg-black">
      <VideoPlayer
        src={hlsUrl!}
        poster={backdropUrl || undefined}
        onTimeUpdate={setCurrentTime}
        className="w-full h-full"
        accentColor={accentColor}
        autoPlay={hasStartedPlaying}
        muted={urlMuted} // Pass muted prop from URL parameter
        onServerSwitch={switchServer}
        onSubtitleToggle={handleSubtitleToggle}
        servers={servers}
        currentServer={currentServer}
        showNextEpisode={hasNextEpisode} // Pass next episode availability
        onNextEpisode={handleNextEpisode} // Pass next episode handler
        subtitles={subtitleOptions}
        selectedSubtitle={selectedSub?.id}
        onSubtitleSelect={handleSubtitleSelect}
        showSubtitleOverlay={showSubtitles}
        subtitleColor={subtitleColor}
        onSubtitleColorChange={setSubtitleColor}
        subtitleSettings={subtitleSettings}
        onSubtitleSettingsChange={setSubtitleSettings}
        activeSubtitle={activeSubtitle}
      />

      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center z-30">
          <button
            onClick={handlePlayClick}
            className="flex items-center justify-center w-20 h-20 rounded-full bg-white/90 hover:bg-white transition-all duration-300 hover:scale-110 shadow-2xl backdrop-blur-sm border-4 border-white/20"
          >
            <Play className="w-8 h-8 text-black ml-1" fill="black" />
          </button>
        </div>
      )}

      {error && hlsUrl && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
}

async function convertToVtt(input: string, format: string, offsetSec: number): Promise<string> {
  const applyOffset = (t: number) => Math.max(0, t + offsetSec)

  if (format.toLowerCase() === "srt" || input.includes("-->")) {
    const lines = input.replace(/\r/g, "").split("\n")
    const out: string[] = ["WEBVTT", ""]
    let i = 0

    while (i < lines.length) {
      const line = lines[i].trim()
      if (/^\d+$/.test(line)) {
        i++
        continue
      }

      if (line.includes("-->")) {
        const [start, end] = line.split("-->").map((s) => s.trim())
        const startSec = srtTimeToSeconds(start)
        const endSec = srtTimeToSeconds(end)
        out.push(`${secondsToVtt(applyOffset(startSec))} --> ${secondsToVtt(applyOffset(endSec))}`)
        i++

        const textLines: string[] = []
        while (i < lines.length && lines[i].trim() !== "") {
          textLines.push(lines[i])
          i++
        }
        out.push(...textLines, "")
      } else {
        i++
      }
    }
    return out.join("\n")
  }

  return `WEBVTT\n\n00:00:00.000 --> 00:10:00.000\n${input.replace(/\n/g, " ")}`
}

function srtTimeToSeconds(t: string): number {
  const m = t.match(/(\d+):(\d+):(\d+)[,.](\d+)/)
  if (!m) return 0
  const h = Number.parseInt(m[1], 10)
  const min = Number.parseInt(m[2], 10)
  const s = Number.parseInt(m[3], 10)
  const ms = Number.parseInt(m[4].padEnd(3, "0").slice(0, 3), 10)
  return h * 3600 + min * 60 + s + ms / 1000
}

function secondsToVtt(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  const ms = Math.round((sec - Math.floor(sec)) * 1000)
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`
}

function parseVttToCues(vtt: string): VttCue[] {
  const lines = vtt.replace(/\r/g, "").split("\n")
  const cues: VttCue[] = []
  let i = 0

  if (lines[0]?.startsWith("WEBVTT")) i = 1

  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) {
      i++
      continue
    }

    if (line.includes("-->")) {
      const [start, end] = line.split("-->").map((s) => s.trim())
      const startSec = srtTimeToSeconds(start.replace(".", ","))
      const endSec = srtTimeToSeconds(end.replace(".", ","))
      i++

      const textLines: string[] = []
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i])
        i++
      }
      cues.push({ start: startSec, end: endSec, lines: textLines })
    } else {
      i++
    }
  }

  return cues
}
