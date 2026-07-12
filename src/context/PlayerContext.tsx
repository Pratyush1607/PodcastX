"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { loadYouTubeIframeApi, type YTPlayer } from "@/lib/youtubeIframeApi";

export const GLOBAL_PLAYER_ELEMENT_ID = "global-yt-player";

export interface NowPlayingTrack {
  id: string;
  youtubeVideoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string | null;
}

interface PlayerContextValue {
  current: NowPlayingTrack | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  hasQueue: boolean;
  play: (track: NowPlayingTrack, queue?: NowPlayingTrack[]) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seekToFraction: (fraction: number) => void;
  close: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<NowPlayingTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<NowPlayingTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const playerRef = useRef<YTPlayer | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTrack = useCallback((track: NowPlayingTrack) => {
    setCurrent(track);
    setCurrentTime(0);

    loadYouTubeIframeApi().then(() => {
      if (!window.YT) return;

      if (!playerRef.current) {
        const player = new window.YT.Player(GLOBAL_PLAYER_ELEMENT_ID, {
          videoId: track.youtubeVideoId,
          width: "64",
          height: "64",
          playerVars: { controls: 0, modestbranding: 1, rel: 0 },
          events: {
            onReady: (e: { target: YTPlayer }) => {
              e.target.playVideo();
              setDuration(e.target.getDuration());
            },
            onStateChange: (e: { data: number }) => {
              if (!window.YT) return;
              setPlaying(e.data === window.YT.PlayerState.PLAYING);
            },
          },
        });
        playerRef.current = player;
      } else {
        playerRef.current.loadVideoById(track.youtubeVideoId);
        playerRef.current.playVideo();
      }
    });
  }, []);

  const play = useCallback(
    (track: NowPlayingTrack, trackQueue?: NowPlayingTrack[]) => {
      const list = trackQueue && trackQueue.length > 0 ? trackQueue : [track];
      const idx = Math.max(
        0,
        list.findIndex((t) => t.id === track.id)
      );
      setQueue(list);
      setQueueIndex(idx);
      loadTrack(track);
    },
    [loadTrack]
  );

  const next = useCallback(() => {
    if (queue.length < 2) return;
    const newIndex = (queueIndex + 1) % queue.length;
    setQueueIndex(newIndex);
    loadTrack(queue[newIndex]!);
  }, [queue, queueIndex, loadTrack]);

  const previous = useCallback(() => {
    if (queue.length < 2) return;
    const newIndex = (queueIndex - 1 + queue.length) % queue.length;
    setQueueIndex(newIndex);
    loadTrack(queue[newIndex]!);
  }, [queue, queueIndex, loadTrack]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (playing) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }, [playing]);

  const seekToFraction = useCallback(
    (fraction: number) => {
      const player = playerRef.current;
      if (!player || duration <= 0) return;
      const target = fraction * duration;
      player.seekTo(target, true);
      setCurrentTime(target);
    },
    [duration]
  );

  const close = useCallback(() => {
    playerRef.current?.pauseVideo();
    setCurrent(null);
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        const player = playerRef.current;
        if (!player) return;
        setCurrentTime(player.getCurrentTime());
        setDuration(player.getDuration());
      }, 250);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  return (
    <PlayerContext.Provider
      value={{
        current,
        playing,
        currentTime,
        duration,
        hasQueue: queue.length > 1,
        play,
        togglePlay,
        next,
        previous,
        seekToFraction,
        close,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}
