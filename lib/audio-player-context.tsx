import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { createAudioPlayer, AudioPlayer as ExpoAudioPlayer } from "expo-audio";

export interface PlayableTrack {
  id: number;
  title: string;
  artist?: string;
  genre?: string | null;
  duration?: number | null;
  audioUrl: string;
  coverUrl?: string | null;
  price?: string | null;
  isFree?: boolean;
  masteringPreset?: string | null;
  masteringLevel?: string | null;
}

interface MasteringProfile {
  lowGain: number;
  midGain: number;
  highGain: number;
  threshold: number;
  ratio: number;
  volumeScale: number;
}

const MASTERING_EQ_PROFILES: Record<string, MasteringProfile> = {
  balanced: { lowGain: 0, midGain: 0, highGain: 0, threshold: -18, ratio: 3, volumeScale: 0.95 },
  warm: { lowGain: 4.5, midGain: 1.5, highGain: -1.5, threshold: -20, ratio: 4, volumeScale: 0.95 },
  warm_tube: { lowGain: 5, midGain: 2, highGain: -1, threshold: -22, ratio: 4.5, volumeScale: 0.96 },
  bright: { lowGain: -1, midGain: 1.5, highGain: 5, threshold: -18, ratio: 3.5, volumeScale: 0.96 },
  acoustic_air: { lowGain: 1, midGain: 1, highGain: 4.5, threshold: -16, ratio: 2.5, volumeScale: 0.94 },
  punchy: { lowGain: 4, midGain: -1, highGain: 3.5, threshold: -24, ratio: 6, volumeScale: 1.0 },
  bass_heavy: { lowGain: 7, midGain: -1.5, highGain: 2, threshold: -24, ratio: 6, volumeScale: 1.0 },
  radio: { lowGain: 3, midGain: 3, highGain: 4, threshold: -26, ratio: 8, volumeScale: 1.0 },
  club: { lowGain: 6.5, midGain: -1, highGain: 4.5, threshold: -25, ratio: 7, volumeScale: 1.0 },
  acoustic: { lowGain: 1.5, midGain: 1, highGain: 3, threshold: -15, ratio: 2, volumeScale: 0.92 },
  vintage: { lowGain: 3.5, midGain: 2.5, highGain: -2.5, threshold: -20, ratio: 4, volumeScale: 0.94 },
  modern: { lowGain: 3.5, midGain: 1, highGain: 4, threshold: -22, ratio: 5, volumeScale: 0.98 },
  hiphop: { lowGain: 6, midGain: 0.5, highGain: 3, threshold: -24, ratio: 6.5, volumeScale: 1.0 },
  rock: { lowGain: 3.5, midGain: 3, highGain: 3.5, threshold: -22, ratio: 5.5, volumeScale: 0.98 },
  electronic: { lowGain: 5.5, midGain: 0, highGain: 5, threshold: -26, ratio: 8, volumeScale: 1.0 },
  vocal_shine: { lowGain: -1.5, midGain: 4, highGain: 4.5, threshold: -20, ratio: 4.5, volumeScale: 0.97 },
};

function getLevelMultiplier(level?: string | null): number {
  if (level === "light") return 0.6;
  if (level === "heavy") return 1.4;
  return 1.0;
}

function isSameOriginOrLocalUrl(url: string): boolean {
  if (typeof window === "undefined") return false;
  if (url.startsWith("/") || url.startsWith("blob:") || url.startsWith("data:")) return true;
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin === window.location.origin || parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

interface AudioPlayerContextType {
  currentTrack: PlayableTrack | null;
  queue: PlayableTrack[];
  queueIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  isLoading: boolean;
  offlineTrackIds: number[];
  activeMasteringPreset: string;
  activeMasteringLevel: string;
  playTrack: (track: PlayableTrack, trackQueue?: PlayableTrack[]) => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  togglePlayPause: () => void;
  pause: () => void;
  resume: () => void;
  seekTo: (seconds: number) => void;
  stop: () => void;
  saveTrackOffline: (track: PlayableTrack) => Promise<boolean>;
  isOfflineSaved: (trackId: number) => boolean;
  applyMasteringPreset: (presetId: string, level?: string) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  position: 0,
  duration: 0,
  isLoading: false,
  offlineTrackIds: [],
  activeMasteringPreset: "balanced",
  activeMasteringLevel: "medium",
  playTrack: async () => {},
  playNext: async () => {},
  playPrevious: async () => {},
  togglePlayPause: () => {},
  pause: () => {},
  resume: () => {},
  seekTo: () => {},
  stop: () => {},
  saveTrackOffline: async () => false,
  isOfflineSaved: () => false,
  applyMasteringPreset: () => {},
});

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  const [queue, setQueue] = useState<PlayableTrack[]>([]);
  const [queueIndex, setQueueIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [offlineTrackIds, setOfflineTrackIds] = useState<number[]>([]);
  const [activeMasteringPreset, setActiveMasteringPreset] = useState<string>("balanced");
  const [activeMasteringLevel, setActiveMasteringLevel] = useState<string>("medium");

  // Mutable refs to avoid stale closures in audio event callbacks
  const queueRef = useRef<PlayableTrack[]>([]);
  const queueIndexRef = useRef<number>(-1);
  const positionRef = useRef<number>(0);
  const objectUrlRef = useRef<string | null>(null);

  // Web audio element refs
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  const webAudioDspBoundRef = useRef<boolean>(false);

  // Web Audio API DSP graph refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lowFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const highFilterRef = useRef<BiquadFilterNode | null>(null);
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  // Native audio player ref
  const nativePlayerRef = useRef<ExpoAudioPlayer | null>(null);

  // Load offline IDs on startup
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem("bilong_yumi_offline_tracks");
        if (stored) {
          const ids = JSON.parse(stored);
          if (Array.isArray(ids)) setOfflineTrackIds(ids);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const isOfflineSaved = useCallback(
    (trackId: number) => offlineTrackIds.includes(trackId),
    [offlineTrackIds]
  );

  const saveTrackOffline = useCallback(async (track: PlayableTrack): Promise<boolean> => {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        if ("caches" in window) {
          try {
            const cache = await caches.open("music-store-audio");
            await cache.add(track.audioUrl);
          } catch (cacheErr) {
            // Cross-origin opaque/CORS audio might refuse cache.add; keep offline metadata record
            console.warn("[Audio] Cache API add warning:", cacheErr);
          }
        }
        setOfflineTrackIds((prev) => {
          if (prev.includes(track.id)) return prev;
          const next = [...prev, track.id];
          if (window.localStorage) {
            window.localStorage.setItem("bilong_yumi_offline_tracks", JSON.stringify(next));
          }
          return next;
        });
        return true;
      }
      setOfflineTrackIds((prev) => (prev.includes(track.id) ? prev : [...prev, track.id]));
      return true;
    } catch (err) {
      console.warn("[Audio] Failed to cache audio offline:", err);
      return false;
    }
  }, []);

  const applyDspSettings = useCallback((presetId: string, level: string) => {
    const profile = MASTERING_EQ_PROFILES[presetId] || MASTERING_EQ_PROFILES.balanced;
    const mult = getLevelMultiplier(level);

    if (webAudioDspBoundRef.current && lowFilterRef.current && midFilterRef.current && highFilterRef.current && compressorRef.current) {
      try {
        lowFilterRef.current.gain.value = profile.lowGain * mult;
        midFilterRef.current.gain.value = profile.midGain * mult;
        highFilterRef.current.gain.value = profile.highGain * mult;
        compressorRef.current.threshold.value = profile.threshold;
        compressorRef.current.ratio.value = profile.ratio;
      } catch (err) {
        console.warn("[Audio DSP] Failed updating Web Audio nodes:", err);
      }
    }

    // Volume envelope adjustment safe for all CORS & non-CORS audio elements
    if (Platform.OS === "web" && webAudioRef.current) {
      webAudioRef.current.volume = Math.max(0.1, Math.min(1, profile.volumeScale));
    }
  }, []);

  const applyMasteringPreset = useCallback(
    (presetId: string, level = "medium") => {
      setActiveMasteringPreset(presetId);
      setActiveMasteringLevel(level);
      applyDspSettings(presetId, level);
    },
    [applyDspSettings]
  );

  // Attach Web Audio API EQ/Compressor chain safely only for same-origin/blob audio
  const ensureDspGraphForAudio = useCallback(
    (audio: HTMLAudioElement, presetId: string, level: string) => {
      if (Platform.OS !== "web" || typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioCtx();
        }
        const ctx = audioCtxRef.current;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }

        if (!webAudioDspBoundRef.current) {
          const source = ctx.createMediaElementSource(audio);
          const low = ctx.createBiquadFilter();
          low.type = "lowshelf";
          low.frequency.value = 120;

          const mid = ctx.createBiquadFilter();
          mid.type = "peaking";
          mid.frequency.value = 1000;
          mid.Q.value = 1.0;

          const high = ctx.createBiquadFilter();
          high.type = "highshelf";
          high.frequency.value = 8000;

          const comp = ctx.createDynamicsCompressor();
          comp.attack.value = 0.003;
          comp.release.value = 0.25;

          source.connect(low);
          low.connect(mid);
          mid.connect(high);
          high.connect(comp);
          comp.connect(ctx.destination);

          lowFilterRef.current = low;
          midFilterRef.current = mid;
          highFilterRef.current = high;
          compressorRef.current = comp;
          webAudioDspBoundRef.current = true;
        }
        applyDspSettings(presetId, level);
      } catch (err) {
        console.warn("[Audio DSP] Could not initialize Web Audio DSP graph:", err);
      }
    },
    [applyDspSettings]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current.src = "";
        webAudioRef.current = null;
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      if (nativePlayerRef.current) {
        try {
          nativePlayerRef.current.pause();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const playTrackInternalRef = useRef<(track: PlayableTrack, trackQueue?: PlayableTrack[]) => Promise<void>>(
    async () => {}
  );

  const playTrack = useCallback(
    async (track: PlayableTrack, trackQueue?: PlayableTrack[]) => {
      if (trackQueue && trackQueue.length > 0) {
        const idx = trackQueue.findIndex((t) => t.id === track.id);
        const resolvedQueue = idx >= 0 ? trackQueue : [track, ...trackQueue];
        const resolvedIdx = idx >= 0 ? idx : 0;
        queueRef.current = resolvedQueue;
        queueIndexRef.current = resolvedIdx;
        setQueue(resolvedQueue);
        setQueueIndex(resolvedIdx);
      } else {
        const existingIdx = queueRef.current.findIndex((t) => t.id === track.id);
        if (existingIdx >= 0) {
          queueIndexRef.current = existingIdx;
          setQueueIndex(existingIdx);
        } else {
          queueRef.current = [track];
          queueIndexRef.current = 0;
          setQueue([track]);
          setQueueIndex(0);
        }
      }

      const preset = track.masteringPreset || activeMasteringPreset || "balanced";
      const level = track.masteringLevel || activeMasteringLevel || "medium";
      if (track.masteringPreset) {
        setActiveMasteringPreset(track.masteringPreset);
      }
      if (track.masteringLevel) {
        setActiveMasteringLevel(track.masteringLevel);
      }

      setCurrentTrack(track);
      setIsLoading(true);
      positionRef.current = 0;
      setPosition(0);
      setDuration(track.duration || 0);

      if (Platform.OS === "web") {
        try {
          let resolvedSrc = track.audioUrl;

          // Check Web Cache API for offline copy
          if (typeof window !== "undefined" && "caches" in window) {
            try {
              const cache = await caches.open("music-store-audio");
              const match = await cache.match(track.audioUrl);
              if (match) {
                const blob = await match.blob();
                if (objectUrlRef.current) {
                  URL.revokeObjectURL(objectUrlRef.current);
                }
                const objUrl = URL.createObjectURL(blob);
                objectUrlRef.current = objUrl;
                resolvedSrc = objUrl;
              }
            } catch {
              // Fall back to direct URL
            }
          }

          const sameOrigin = isSameOriginOrLocalUrl(resolvedSrc);

          // If switching from DSP-bound audio element to a cross-origin non-CORS URL, recreate element so browser won't silence it
          if (!sameOrigin && webAudioDspBoundRef.current && webAudioRef.current) {
            webAudioRef.current.pause();
            webAudioRef.current.src = "";
            webAudioRef.current = new Audio();
            webAudioDspBoundRef.current = false;
            lowFilterRef.current = null;
            midFilterRef.current = null;
            highFilterRef.current = null;
            compressorRef.current = null;
          } else if (!webAudioRef.current) {
            webAudioRef.current = new Audio();
          }

          const audio = webAudioRef.current;
          audio.pause();
          audio.crossOrigin = sameOrigin ? "anonymous" : null;
          audio.src = resolvedSrc;
          audio.load();

          if (sameOrigin) {
            ensureDspGraphForAudio(audio, preset, level);
          } else {
            applyDspSettings(preset, level);
          }

          audio.onloadedmetadata = () => {
            if (audio.duration && !isNaN(audio.duration)) {
              setDuration(Math.round(audio.duration));
            }
            setIsLoading(false);
          };

          audio.ontimeupdate = () => {
            const sec = Math.round(audio.currentTime);
            positionRef.current = sec;
            setPosition(sec);
          };

          audio.onplay = () => setIsPlaying(true);
          audio.onpause = () => setIsPlaying(false);
          audio.onended = () => {
            const nextIdx = queueIndexRef.current + 1;
            if (queueRef.current.length > 1 && nextIdx < queueRef.current.length) {
              playTrackInternalRef.current(queueRef.current[nextIdx]);
            } else {
              setIsPlaying(false);
              positionRef.current = 0;
              setPosition(0);
            }
          };
          audio.onerror = () => {
            setIsLoading(false);
            setIsPlaying(false);
            console.warn("[Audio] Web audio error loading:", track.audioUrl);
          };

          await audio.play();
          setIsPlaying(true);
        } catch (err) {
          console.warn("[Audio] Web audio play error:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Native audio with expo-audio
        try {
          if (nativePlayerRef.current) {
            try {
              nativePlayerRef.current.pause();
            } catch {
              // ignore
            }
          }
          const player = createAudioPlayer(track.audioUrl);
          nativePlayerRef.current = player;
          player.play();
          setIsPlaying(true);
          setIsLoading(false);
        } catch (err) {
          console.warn("[Audio] Native audio error:", err);
          setIsLoading(false);
        }
      }
    },
    [activeMasteringPreset, activeMasteringLevel, applyDspSettings, ensureDspGraphForAudio]
  );

  useEffect(() => {
    playTrackInternalRef.current = playTrack;
  }, [playTrack]);

  const pause = useCallback(() => {
    if (Platform.OS === "web") {
      if (webAudioRef.current) {
        webAudioRef.current.pause();
      }
    } else {
      if (nativePlayerRef.current) {
        nativePlayerRef.current.pause();
      }
    }
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    if (Platform.OS === "web") {
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume().catch(() => {});
      }
      if (webAudioRef.current) {
        webAudioRef.current.play().catch(console.warn);
      }
    } else {
      if (nativePlayerRef.current) {
        nativePlayerRef.current.play();
      }
    }
    setIsPlaying(true);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [isPlaying, pause, resume]);

  const seekTo = useCallback((seconds: number) => {
    positionRef.current = seconds;
    setPosition(seconds);
    if (Platform.OS === "web") {
      if (webAudioRef.current) {
        webAudioRef.current.currentTime = seconds;
      }
    } else {
      if (nativePlayerRef.current) {
        try {
          nativePlayerRef.current.seekTo(seconds);
        } catch {
          // ignore
        }
      }
    }
  }, []);

  const playNext = useCallback(async () => {
    const q = queueRef.current;
    if (q.length === 0) return;
    const nextIdx = (queueIndexRef.current + 1) % q.length;
    await playTrack(q[nextIdx]);
  }, [playTrack]);

  const playPrevious = useCallback(async () => {
    if (positionRef.current > 3) {
      seekTo(0);
      return;
    }
    const q = queueRef.current;
    if (q.length === 0) return;
    const prevIdx = (queueIndexRef.current - 1 + q.length) % q.length;
    await playTrack(q[prevIdx]);
  }, [playTrack, seekTo]);

  const stop = useCallback(() => {
    pause();
    setCurrentTrack(null);
    positionRef.current = 0;
    setPosition(0);
    setDuration(0);
  }, [pause]);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        queue,
        queueIndex,
        isPlaying,
        position,
        duration,
        isLoading,
        offlineTrackIds,
        activeMasteringPreset,
        activeMasteringLevel,
        playTrack,
        playNext,
        playPrevious,
        togglePlayPause,
        pause,
        resume,
        seekTo,
        stop,
        saveTrackOffline,
        isOfflineSaved,
        applyMasteringPreset,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  return useContext(AudioPlayerContext);
}
