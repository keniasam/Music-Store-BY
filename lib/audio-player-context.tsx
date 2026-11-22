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
}

interface AudioPlayerContextType {
  currentTrack: PlayableTrack | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  isLoading: boolean;
  playTrack: (track: PlayableTrack) => Promise<void>;
  togglePlayPause: () => void;
  pause: () => void;
  resume: () => void;
  seekTo: (seconds: number) => void;
  stop: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType>({
  currentTrack: null,
  isPlaying: false,
  position: 0,
  duration: 0,
  isLoading: false,
  playTrack: async () => {},
  togglePlayPause: () => {},
  pause: () => {},
  resume: () => {},
  seekTo: () => {},
  stop: () => {},
});

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<PlayableTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Web audio ref
  const webAudioRef = useRef<HTMLAudioElement | null>(null);
  // Native audio player ref
  const nativePlayerRef = useRef<ExpoAudioPlayer | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webAudioRef.current) {
        webAudioRef.current.pause();
        webAudioRef.current.src = "";
        webAudioRef.current = null;
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

  const playTrack = useCallback(async (track: PlayableTrack) => {
    setCurrentTrack(track);
    setIsLoading(true);
    setPosition(0);
    setDuration(track.duration || 0);

    if (Platform.OS === "web") {
      try {
        if (!webAudioRef.current) {
          webAudioRef.current = new Audio();
        }
        const audio = webAudioRef.current;
        audio.pause();
        audio.src = track.audioUrl;
        audio.load();

        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            setDuration(Math.round(audio.duration));
          }
          setIsLoading(false);
        };

        audio.ontimeupdate = () => {
          setPosition(Math.round(audio.currentTime));
        };

        audio.onplay = () => setIsPlaying(true);
        audio.onpause = () => setIsPlaying(false);
        audio.onended = () => {
          setIsPlaying(false);
          setPosition(0);
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
  }, []);

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

  const stop = useCallback(() => {
    pause();
    setCurrentTrack(null);
    setPosition(0);
    setDuration(0);
  }, [pause]);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        position,
        duration,
        isLoading,
        playTrack,
        togglePlayPause,
        pause,
        resume,
        seekTo,
        stop,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  return useContext(AudioPlayerContext);
}
