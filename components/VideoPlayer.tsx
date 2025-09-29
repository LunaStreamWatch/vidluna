"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import type React from "react"

import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Maximize,
  SkipBack,
  SkipForward,
  X,
  Subtitles,
  Minimize,
  Plus,
  Minus,
  Cloud,
  ChevronRight,
} from "lucide-react"

type VideoPlayerProps = {
  src: string
  poster?: string
  onTimeUpdate?: (currentTime: number) => void
  onDurationChange?: (duration: number) => void
  onPlay?: () => void
  onPause?: () => void
  className?: string
  accentColor?: string
  autoPlay?: boolean
  muted?: boolean // Added muted prop
  onServerSwitch?: (server: string) => void
  onSubtitleToggle?: () => void
  servers?: Array<{ id: string; name: string; flag: string }>
  currentServer?: string
  showNextEpisode?: boolean
  onNextEpisode?: () => void
  subtitles?: Array<{ id: string; language: string; label: string; flagUrl?: string; source?: string }>
  selectedSubtitle?: string
  onSubtitleSelect?: (id: string) => void
  showSubtitleOverlay?: boolean
  subtitleColor?: string
  onSubtitleColorChange?: (color: string) => void
  subtitleSettings?: {
    fontSize: number
    fontFamily: string
    backgroundColor: string
    backgroundOpacity: number
    timing: number
  }
  onSubtitleSettingsChange?: (settings: any) => void
  activeSubtitle?: string[] | null
}

type PlaybackSpeed = 0.25 | 0.5 | 0.75 | 1 | 1.25 | 1.5 | 1.75 | 2

const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export default function VideoPlayer({
  src,
  poster,
  onTimeUpdate,
  onDurationChange,
  onPlay,
  onPause,
  className = "",
  accentColor = "#fbc9ff", // Changed default color to #fbc9ff
  autoPlay = false,
  muted: initialMuted = false, // Added muted prop with default
  onServerSwitch,
  onSubtitleToggle,
  servers = [],
  currentServer,
  showNextEpisode = false,
  onNextEpisode,
  subtitles = [],
  selectedSubtitle,
  onSubtitleSelect,
  showSubtitleOverlay = false,
  subtitleColor = "#ffffff",
  onSubtitleColorChange,
  subtitleSettings = {
    fontSize: 24,
    fontFamily: "Verdana", // Changed default font to Verdana
    backgroundColor: "#000000",
    backgroundOpacity: 0,
    timing: 0,
  },
  onSubtitleSettingsChange,
  activeSubtitle = null,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const playerRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(initialMuted) // Initialize with prop value
  const [showControls, setShowControls] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showServerMenu, setShowServerMenu] = useState(false)
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<PlaybackSpeed>(1)
  const [buffered, setBuffered] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"speed" | "display" | "subtitles">("speed")
  const [showCursor, setShowCursor] = useState(true) // Add cursor hiding state

  const handleVideoClick = useCallback(() => {
    togglePlay()
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      video.muted = initialMuted
    }
  }, [initialMuted])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element

      // Close menus if clicking outside them
      if (showSettings && !target.closest("[data-settings-panel]") && !target.closest("[data-settings-button]")) {
        setShowSettings(false)
      }
      if (showServerMenu && !target.closest("[data-server-menu]") && !target.closest("[data-server-button]")) {
        setShowServerMenu(false)
      }
      if (showSubtitleMenu && !target.closest("[data-subtitle-menu]") && !target.closest("[data-subtitle-button]")) {
        setShowSubtitleMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showSettings, showServerMenu, showSubtitleMenu])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src
      return
    }

    import("hls.js")
      .then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: false,
            lowLatencyMode: true,
            maxBufferLength: 30,
            maxMaxBufferLength: 600,
          })

          hls.loadSource(src)
          hls.attachMedia(video)

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log("[v0] HLS manifest loaded")
          })

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error("[v0] HLS error:", data)
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log("[v0] Fatal network error, trying to recover...")
                  hls.startLoad()
                  break
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log("[v0] Fatal media error, trying to recover...")
                  hls.recoverMediaError()
                  break
                default:
                  console.log("[v0] Fatal error, destroying HLS...")
                  hls.destroy()
                  break
              }
            }
          })

          return () => {
            hls.destroy()
          }
        }
      })
      .catch((error) => {
        console.error("[v0] Failed to load HLS.js:", error)
        video.src = src
      })
  }, [src])

  useEffect(() => {
    if (autoPlay && videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error("[v0] Auto-play error:", error)
      })
    }
  }, [autoPlay])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault()
          togglePlay()
          break
        case "arrowleft":
          e.preventDefault()
          skipTime(-10)
          break
        case "arrowright":
          e.preventDefault()
          skipTime(10)
          break
        case "f":
          e.preventDefault()
          toggleFullscreen()
          break
        case "m":
          e.preventDefault()
          toggleMute()
          break
        case "arrowup":
          e.preventDefault()
          adjustVolume(0.1)
          break
        case "arrowdown":
          e.preventDefault()
          adjustVolume(-0.1)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [playing])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement
      setIsFullscreen(isFullscreenNow)

      // Ensure controls are visible when entering fullscreen
      if (isFullscreenNow) {
        showControlsTemporarily()
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (!showControls && !showSettings && !showServerMenu && !showSubtitleMenu) {
      setShowCursor(false)
    } else {
      setShowCursor(true)
    }
  }, [showControls, showSettings, showServerMenu, showSubtitleMenu])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const time = video.currentTime
    setCurrentTime(time)
    onTimeUpdate?.(time)

    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1)
      setBuffered((bufferedEnd / video.duration) * 100)
    }
  }, [onTimeUpdate])

  const handleDurationChange = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    const dur = video.duration
    setDuration(dur)
    onDurationChange?.(dur)
  }, [onDurationChange])

  const handlePlay = useCallback(() => {
    setPlaying(true)
    onPlay?.()
  }, [onPlay])

  const handlePause = useCallback(() => {
    setPlaying(false)
    onPause?.()
  }, [onPause])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (playing) {
      video.pause()
    } else {
      video.play().catch((error) => {
        console.error("[v0] Play error:", error)
      })
    }
  }, [playing])

  const seekTo = useCallback(
    (time: number) => {
      const video = videoRef.current
      if (!video) return

      video.currentTime = Math.max(0, Math.min(time, duration))
    },
    [duration],
  )

  const skipTime = useCallback(
    (seconds: number) => {
      const video = videoRef.current
      if (!video) return

      const currentVideoTime = video.currentTime
      const newTime = Math.max(0, Math.min(currentVideoTime + seconds, duration))
      video.currentTime = newTime
      console.log(
        `[v0] Seeking ${seconds > 0 ? "forward" : "backward"} ${Math.abs(seconds)}s from ${currentVideoTime.toFixed(1)}s to ${newTime.toFixed(1)}s`,
      )
    },
    [duration],
  )

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = (clickX / rect.width) * duration
      seekTo(newTime)
    },
    [duration, seekTo],
  )

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setMuted(video.muted)
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = Number.parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)

    if (newVolume === 0) {
      video.muted = true
      setMuted(true)
    } else if (video.muted) {
      video.muted = false
      setMuted(false)
    }
  }, [])

  const adjustVolume = useCallback(
    (delta: number) => {
      const video = videoRef.current
      if (!video) return

      const newVolume = Math.max(0, Math.min(1, volume + delta))
      video.volume = newVolume
      setVolume(newVolume)

      if (newVolume === 0) {
        video.muted = true
        setMuted(true)
      } else if (video.muted) {
        video.muted = false
        setMuted(false)
      }
    },
    [volume],
  )

  const handlePlaybackRateChange = useCallback((rate: PlaybackSpeed) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setPlaybackRate(rate)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = playerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((error) => {
        console.error("[v0] Fullscreen error:", error)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }, [])

  const handleMouseMove = useCallback(() => {
    setShowCursor(true)
    showControlsTemporarily()
  }, [showControlsTemporarily])

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00"
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    return h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }

  const handleSubtitleSettingChange = (key: string, value: any) => {
    const newSettings = { ...subtitleSettings, [key]: value }
    onSubtitleSettingsChange?.(newSettings)
  }

  const adjustTiming = (delta: number) => {
    const newTiming = Math.round((subtitleSettings.timing + delta) * 10) / 10
    handleSubtitleSettingChange("timing", newTiming)
  }

  const parseSubtitleHTML = (text: string, isRainSubs: boolean) => {
    if (!isRainSubs) {
      // For non-RainSubs, strip all HTML tags
      return text.replace(/<[^>]*>/g, "")
    }
    // For RainSubs, keep the HTML tags for color formatting
    return text
  }

  const isRainSubsActive = subtitles.find((s) => s.id === selectedSubtitle)?.source === "rainsubs"

  return (
    <div
      ref={playerRef}
      className={`relative w-full h-full bg-black ${className}`}
      onMouseMove={handleMouseMove}
      style={{ cursor: showCursor ? "default" : "none" }}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover cursor-pointer"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onPlay={handlePlay}
        onPause={handlePause}
        onLoadedMetadata={handleDurationChange}
        onClick={handleVideoClick}
        crossOrigin="anonymous"
        preload="metadata"
        autoPlay={autoPlay}
        muted={initialMuted} // Set muted attribute from prop
      />

      {activeSubtitle && showSubtitleOverlay && selectedSubtitle && (
        <div
          className="absolute left-1/2 -translate-x-1/2 max-w-4xl pointer-events-none"
          style={{
            bottom: isFullscreen ? "10%" : "8rem",
            zIndex: isFullscreen ? 9999 : 50,
          }}
        >
          <div
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: `${subtitleSettings.backgroundColor}${Math.round(
                subtitleSettings.backgroundOpacity * 255,
              )
                .toString(16)
                .padStart(2, "0")}`,
            }}
          >
            {activeSubtitle.map((line, index) => (
              <div
                key={index}
                className="text-center leading-relaxed"
                style={{
                  color: isRainSubsActive ? undefined : subtitleColor,
                  fontSize: `${subtitleSettings.fontSize}px`,
                  fontFamily: subtitleSettings.fontFamily,
                  fontWeight: subtitleSettings.fontFamily.includes("Bold") ? "bold" : "normal",
                  WebkitFontSmoothing:
                    subtitleSettings.fontFamily === "Verdana" || subtitleSettings.fontFamily === "Netflix Sans"
                      ? "antialiased"
                      : "auto",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8)",
                }}
                dangerouslySetInnerHTML={{ __html: parseSubtitleHTML(line, isRainSubsActive) }}
              />
            ))}
          </div>
        </div>
      )}

      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
      >
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="relative h-2 bg-white/20 rounded-full cursor-pointer group" onClick={handleSeek}>
              <div
                className="absolute top-0 left-0 h-full bg-white/40 rounded-full"
                style={{ width: `${buffered}%` }}
              />
              <div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%`, backgroundColor: accentColor }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                style={{
                  left: `${(currentTime / duration) * 100}%`,
                  marginLeft: "-10px",
                  backgroundColor: accentColor,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                className="text-white transition-all hover:scale-110 hover:opacity-80"
                onClick={() => skipTime(-10)}
                style={{ color: accentColor }}
              >
                <SkipBack size={36} />
              </button>

              <button
                className="text-white transition-all hover:scale-110 hover:opacity-80"
                onClick={togglePlay}
                style={{ color: accentColor }}
              >
                {playing ? <Pause size={40} /> : <Play size={40} />}
              </button>

              <button
                className="text-white transition-all hover:scale-110 hover:opacity-80"
                onClick={() => skipTime(10)}
                style={{ color: accentColor }}
              >
                <SkipForward size={36} />
              </button>

              <div
                className="flex items-center gap-3 relative"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  className="text-white transition-all hover:scale-110 hover:opacity-80"
                  onClick={toggleMute}
                  style={{ color: accentColor }}
                >
                  {muted ? <VolumeX size={32} /> : <Volume2 size={32} />}
                </button>
                <div
                  className={`transition-all duration-300 overflow-hidden ${showVolumeSlider ? "w-24 opacity-100" : "w-0 opacity-0"}`}
                >
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={muted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`,
                    }}
                  />
                </div>
              </div>

              <div className="text-white text-lg font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {showNextEpisode && (
                <button
                  className="text-white transition-all hover:scale-110 hover:opacity-80 p-2 rounded-lg bg-white/10"
                  onClick={onNextEpisode}
                  style={{ color: accentColor }}
                  title="Next Episode"
                >
                  <ChevronRight size={36} />
                </button>
              )}

              {servers.length > 0 && (
                <div className="relative">
                  <button
                    data-server-button
                    className="text-white transition-all hover:scale-110 hover:opacity-80 p-2 rounded-lg bg-white/10"
                    onClick={() => setShowServerMenu(!showServerMenu)}
                    style={{ color: accentColor }}
                  >
                    <Cloud size={36} />
                  </button>

                  {showServerMenu && (
                    <div
                      data-server-menu
                      className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg p-6 min-w-80 shadow-2xl border border-white/10"
                    >
                      <div className="text-white text-2xl font-medium mb-6">Servers</div>
                      {servers.map((server) => (
                        <button
                          key={server.id}
                          onClick={() => {
                            onServerSwitch?.(server.id)
                            setShowServerMenu(false)
                          }}
                          className={`flex items-center gap-4 w-full px-6 py-4 text-xl rounded-lg transition-colors mb-3 ${
                            currentServer === server.id ? "text-white font-medium" : "text-gray-300 hover:bg-white/10"
                          }`}
                          style={currentServer === server.id ? { backgroundColor: accentColor } : {}}
                        >
                          <img
                            src="https://flagsapi.com/US/flat/64.png"
                            alt="US Flag"
                            className="w-12 h-9 object-cover rounded-sm"
                          />
                          {server.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {subtitles.length > 0 && (
                <div className="relative">
                  <button
                    data-subtitle-button
                    className="text-white transition-all hover:scale-110 hover:opacity-80 p-2 rounded-lg bg-white/10"
                    onClick={() => setShowSubtitleMenu(!showSubtitleMenu)}
                    style={{ color: accentColor }}
                  >
                    <Subtitles size={32} />
                  </button>

                  {showSubtitleMenu && (
                    <div
                      data-subtitle-menu
                      className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-sm rounded-lg p-6 min-w-96 max-h-[500px] overflow-y-auto shadow-2xl border border-white/10"
                    >
                      <div className="text-white text-2xl font-medium mb-6">Subtitles</div>
                      <button
                        onClick={() => {
                          onSubtitleSelect?.("")
                          setShowSubtitleMenu(false)
                        }}
                        className={`block w-full text-left px-6 py-4 text-xl rounded-lg transition-colors mb-3 ${
                          !selectedSubtitle ? "text-white font-medium" : "text-gray-300 hover:bg-white/10"
                        }`}
                        style={!selectedSubtitle ? { backgroundColor: accentColor } : {}}
                      >
                        Off
                      </button>
                      {subtitles.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            onSubtitleSelect?.(sub.id)
                            setShowSubtitleMenu(false)
                          }}
                          className={`flex items-center gap-4 w-full text-left px-6 py-4 text-xl rounded-lg transition-colors mb-3 ${
                            selectedSubtitle === sub.id ? "text-white font-medium" : "text-gray-300 hover:bg-white/10"
                          }`}
                          style={selectedSubtitle === sub.id ? { backgroundColor: accentColor } : {}}
                        >
                          {sub.source === "rainsubs" ? (
                            <div className="w-10 h-8 bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 rounded-sm flex-shrink-0"></div>
                          ) : sub.flagUrl ? (
                            <img
                              src={sub.flagUrl || "/placeholder.svg"}
                              alt=""
                              className="w-10 h-8 object-cover rounded-sm flex-shrink-0"
                            />
                          ) : null}
                          <span>{sub.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button
                data-settings-button
                className="text-white transition-all hover:scale-110 hover:opacity-80 p-2 rounded-lg bg-white/10"
                onClick={() => setShowSettings(!showSettings)}
                style={{ color: accentColor }}
              >
                <Settings size={32} />
              </button>

              <button
                className="text-white transition-all hover:scale-110 hover:opacity-80 p-2 rounded-lg bg-white/10"
                onClick={toggleFullscreen}
                style={{ color: accentColor }}
              >
                {isFullscreen ? <Minimize size={32} /> : <Maximize size={32} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <div
          data-settings-panel
          className="absolute bottom-20 right-6 bg-black/95 backdrop-blur-sm rounded-xl p-5 min-w-96 max-h-[500px] overflow-hidden shadow-2xl border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-xl">Settings</h3>
            <button
              className="text-white transition-colors hover:opacity-80"
              onClick={() => setShowSettings(false)}
              style={{ color: accentColor }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Settings Tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { id: "speed", label: "Speed", icon: SkipForward },
              { id: "display", label: "Display", icon: Settings },
              { id: "subtitles", label: "Subtitles", icon: Subtitles },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSettingsTab(id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  settingsTab === id ? "text-white font-medium" : "text-gray-300 hover:bg-white/10"
                }`}
                style={settingsTab === id ? { backgroundColor: accentColor } : {}}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="overflow-y-auto max-h-80">
            {settingsTab === "speed" && (
              <div>
                <h4 className="text-white text-sm font-medium mb-3">Playback Speed</h4>
                <div className="space-y-1">
                  {PLAYBACK_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        playbackRate === speed ? "text-white font-medium" : "text-gray-300 hover:bg-white/10"
                      }`}
                      style={playbackRate === speed ? { backgroundColor: accentColor } : {}}
                      onClick={() => handlePlaybackRateChange(speed)}
                    >
                      {speed === 1 ? "Normal" : `${speed}x`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {settingsTab === "display" && (
              <div>
                <h4 className="text-white text-sm font-medium mb-3">Display Options</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Auto-hide controls</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Show preview thumbnails</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </label>
                </div>
              </div>
            )}

            {settingsTab === "subtitles" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Font Size</label>
                  <input
                    type="range"
                    min="16"
                    max="48"
                    value={subtitleSettings.fontSize}
                    onChange={(e) => handleSubtitleSettingChange("fontSize", Number.parseInt(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-400 mt-1">{subtitleSettings.fontSize}px</div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Font Family</label>
                  <select
                    value={subtitleSettings.fontFamily}
                    onChange={(e) => handleSubtitleSettingChange("fontFamily", e.target.value)}
                    className="w-full bg-black/60 text-white rounded-lg px-3 py-2 text-sm border border-white/20 [&>option]:bg-black [&>option]:text-white [&>option]:py-1"
                  >
                    <option value="Verdana" className="bg-black text-white py-1">
                      Verdana (Default)
                    </option>
                    <option value="Consolas" className="bg-black text-white py-1">
                      Consolas
                    </option>
                    <option value="Netflix Sans" className="bg-black text-white py-1">
                      Netflix Sans
                    </option>
                    <option value="Helvetica" className="bg-black text-white py-1">
                      Helvetica
                    </option>
                    <option value="Tahoma" className="bg-black text-white py-1">
                      Tahoma
                    </option>
                    <option value="Comic Sans MS" className="bg-black text-white py-1">
                      Comic Sans MS
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Text Color</label>
                  <div className="grid grid-cols-10 gap-2">
                    {[
                      "#ffffff", // White
                      "#ffff00", // Yellow
                      "#00ff00", // Green
                      "#ff0000", // Red
                      "#0000ff", // Blue
                      "#ff69b4", // Magenta
                      "#00ffff", // Cyan
                      "#ffa500", // Orange
                      "#ff6347", // Tomato
                      "#40e0d0", // Turquoise
                      "#da70d6", // Orchid
                      "#98fb98", // Pale Green
                      "#87ceeb", // Sky Blue
                      "#dda0dd", // Plum
                      "#f0e68c", // Khaki
                      "#ffc0cb", // Light Pink
                      "#add8e6", // Light Blue
                      "#ff1493", // Deep Pink
                      "#00ced1", // Dark Turquoise
                      "#ff8c00", // Dark Orange
                      "#9370db", // Medium Purple
                      "#32cd32", // Lime Green
                      "#ff4500", // Orange Red
                      "#1e90ff", // Dodger Blue
                      "#ff69b4", // Hot Pink
                      "#00fa9a", // Medium Spring Green
                      "#ffd700", // Gold
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => onSubtitleColorChange?.(color)}
                        className={`w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform ${subtitleColor === color ? "border-white shadow-lg" : "border-gray-600"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Background Color</label>
                  <div className="flex gap-2">
                    {["#000000", "#333333", "#666666", "#ffffff"].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleSubtitleSettingChange("backgroundColor", color)}
                        className={`w-8 h-8 rounded-lg border-2 hover:scale-110 transition-transform ${subtitleSettings.backgroundColor === color ? "border-white shadow-lg" : "border-gray-600"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Background Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={subtitleSettings.backgroundOpacity}
                    onChange={(e) =>
                      handleSubtitleSettingChange("backgroundOpacity", Number.parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {Math.round(subtitleSettings.backgroundOpacity * 100)}%
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Timing Adjustment</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => adjustTiming(-0.1)}
                      className="p-1 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Minus size={14} className="text-white" />
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      value={subtitleSettings.timing}
                      onChange={(e) => handleSubtitleSettingChange("timing", Number.parseFloat(e.target.value) || 0)}
                      className="flex-1 bg-white/10 text-white rounded-lg px-2 py-1 text-sm text-center border border-white/20"
                    />
                    <button
                      onClick={() => adjustTiming(0.1)}
                      className="p-1 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Plus size={14} className="text-white" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {subtitleSettings.timing > 0
                      ? `${subtitleSettings.timing}s late`
                      : subtitleSettings.timing < 0
                        ? `${Math.abs(subtitleSettings.timing)}s early`
                        : "Perfect sync"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
