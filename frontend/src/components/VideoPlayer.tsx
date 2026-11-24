import { useEffect, useRef, useState, type RefObject } from 'react'

/** Lets the parent read the current playback time without re-rendering on every tick. */
export type TimeReader = RefObject<(() => number | null) | null>

interface PlayerProps {
  src: string
  startAt: number
  timeRef: TimeReader
}

/** Plays YouTube trailers via the IFrame API, HLS (.m3u8) via hls.js / native, anything else via <video>. */
export function VideoPlayer({ src, startAt, timeRef }: PlayerProps) {
  const videoId = youtubeId(src)
  return videoId ? (
    <YouTubePlayer videoId={videoId} startAt={startAt} timeRef={timeRef} />
  ) : (
    <StreamPlayer src={src} startAt={startAt} timeRef={timeRef} />
  )
}

function youtubeId(src: string): string | null {
  try {
    const url = new URL(src)
    if (url.hostname === 'youtu.be') return url.pathname.slice(1) || null
    if (url.hostname.endsWith('youtube.com')) return url.searchParams.get('v') ?? url.pathname.match(/\/embed\/([^/?]+)/)?.[1] ?? null
  } catch {
    // not a URL
  }
  return null
}

function StreamPlayer({ src, startAt, timeRef }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let cancelled = false
    let destroyHls: (() => void) | undefined

    timeRef.current = () => video.currentTime
    const resume = () => {
      if (startAt > 0) video.currentTime = startAt
    }
    video.addEventListener('loadedmetadata', resume, { once: true })

    const isHls = new URL(src, location.href).pathname.endsWith('.m3u8')
    // Safari/iOS play HLS natively; elsewhere load hls.js on demand (keeps it out of the main bundle).
    if (isHls && !video.canPlayType('application/vnd.apple.mpegurl')) {
      void import('hls.js').then(({ default: Hls }) => {
        if (cancelled) return
        if (!Hls.isSupported()) return setError(true)
        const hls = new Hls()
        hls.on(Hls.Events.ERROR, (_, data) => data.fatal && setError(true))
        hls.loadSource(src)
        hls.attachMedia(video)
        destroyHls = () => hls.destroy()
      })
    } else {
      video.src = src
    }

    return () => {
      cancelled = true
      video.removeEventListener('loadedmetadata', resume)
      destroyHls?.()
    }
  }, [src, startAt, timeRef])

  if (error) return <PlayerError />
  return <video ref={videoRef} controls autoPlay playsInline onError={() => setError(true)} className="size-full bg-black" />
}

// --- YouTube IFrame API (no npm package needed) ---

interface YTPlayer {
  getCurrentTime(): number
  destroy(): void
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: { videoId: string; width: string; height: string; playerVars: Record<string, number> },
  ) => YTPlayer
}
declare global {
  interface Window {
    YT?: YTNamespace
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApi: Promise<YTNamespace> | null = null
function loadYouTubeApi(): Promise<YTNamespace> {
  youtubeApi ??= new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT)
    window.onYouTubeIframeAPIReady = () => resolve(window.YT!)
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.onerror = () => {
      youtubeApi = null
      reject(new Error('YouTube API failed to load'))
    }
    document.head.append(script)
  })
  return youtubeApi
}

function YouTubePlayer({ videoId, startAt, timeRef }: { videoId: string; startAt: number; timeRef: TimeReader }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    let player: YTPlayer | undefined
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current) return
        // YT swaps the target element for an iframe, so give it a child React doesn't own.
        const target = document.createElement('div')
        hostRef.current.append(target)
        player = new YT.Player(target, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: { autoplay: 1, start: Math.floor(startAt), rel: 0, playsinline: 1 },
        })
        timeRef.current = () => {
          try {
            return player?.getCurrentTime() ?? null
          } catch {
            return null // not ready yet
          }
        }
      })
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
      player?.destroy()
    }
  }, [videoId, startAt, timeRef])

  if (error) return <PlayerError />
  return <div ref={hostRef} className="size-full [&>iframe]:size-full" />
}

function PlayerError() {
  return <p className="grid size-full place-items-center text-neutral-400">This video can't be played right now.</p>
}
