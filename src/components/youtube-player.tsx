import { useEffect, useId, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import type { YoutubeTrack } from "@/lib/profile";

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (id: string) => void;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: string | HTMLElement,
        opts: {
          videoId: string;
          width?: number;
          height?: number;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number; target: YTPlayer }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState?: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYoutubeApi(): Promise<NonNullable<Window["YT"]>> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector("script[src='https://www.youtube.com/iframe_api']")) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
}

export function YoutubePlayer({ tracks }: { tracks: YoutubeTrack[] }) {
  const hostId = useId().replace(/:/g, "");
  const playerRef = useRef<YTPlayer | null>(null);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);

  const list = tracks.filter((t) => t.videoId);
  const current = list[index];

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (!list.length) return;
    let cancelled = false;
    void loadYoutubeApi().then((YT) => {
      if (cancelled) return;
      const host = document.getElementById(`yt-${hostId}`);
      if (!host) return;
      playerRef.current?.destroy();
      playerRef.current = new YT.Player(`yt-${hostId}`, {
        videoId: list[0].videoId,
        width: 72,
        height: 40,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (!cancelled) setReady(true);
          },
          onStateChange: (event) => {
            if (event.data === 1) setPlaying(true);
            if (event.data === 2) setPlaying(false);
            if (event.data === 0) {
              const next = (indexRef.current + 1) % list.length;
              indexRef.current = next;
              setIndex(next);
              event.target.loadVideoById(list[next].videoId);
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // recreate only when the playlist identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.map((t) => t.videoId).join("|"), hostId]);

  useEffect(() => {
    if (!ready || !playerRef.current || !current) return;
    playerRef.current.loadVideoById(current.videoId);
    if (playing) playerRef.current.playVideo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, ready]);

  useEffect(() => {
    const start = () => {
      playerRef.current?.playVideo();
      setPlaying(true);
      window.removeEventListener("pointerdown", start);
    };
    window.addEventListener("pointerdown", start);
    return () => window.removeEventListener("pointerdown", start);
  }, []);

  if (!current) return null;

  function skip(dir: number) {
    if (!list.length) return;
    const next = (index + dir + list.length) % list.length;
    setIndex(next);
  }

  function toggle() {
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  }

  function toggleMute() {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }

  return (
    <div className="pointer-events-auto fixed bottom-16 left-1/2 z-30 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-glass-border bg-glass px-3 py-2.5 shadow-2xl backdrop-blur-xl sm:bottom-6">
      <div className="flex items-center gap-3">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-bg">
          <img
            src={`https://i.ytimg.com/vi/${current.videoId}/mqdefault.jpg`}
            alt=""
            className="size-full object-cover"
          />
          <div id={`yt-${hostId}`} className="pointer-events-none absolute inset-0 opacity-0" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium">{current.title || "YouTube"}</p>
          <p className="truncate text-xs text-muted">
            {list.length > 1 ? `${index + 1} / ${list.length}` : "YouTube"}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          {list.length > 1 ? (
            <button
              type="button"
              className="grid size-9 place-items-center text-muted hover:text-fg"
              onClick={() => skip(-1)}
              aria-label="Previous"
            >
              <SkipBack className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full bg-fg text-bg"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-4 fill-current" /> : <Play className="size-4 fill-current" />}
          </button>
          {list.length > 1 ? (
            <button
              type="button"
              className="grid size-9 place-items-center text-muted hover:text-fg"
              onClick={() => skip(1)}
              aria-label="Next"
            >
              <SkipForward className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            className="grid size-9 place-items-center text-muted hover:text-fg"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
