"use client";
import React, { useState, useRef, useEffect } from "react";

import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

export default function Page() {
  const [file, setFile] = useState<File | null>(null);
  const [chords, setChords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentChord, setCurrentChord] = useState<string>("");
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Update current time and chord
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      
      // Find the current chord based on time (using start and end from API)
      const chord = chords.find((c) => {
        return audio.currentTime >= c.start && audio.currentTime < c.end;
      });
      
      setCurrentChord(chord?.chord || "");
    };

    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [chords]);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError("");
    setChords([]);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // const res = await fetch("/api/recognize", {
        const res = await fetch("/.netlify/functions/proxy-recognize", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.statusText}`);
      }

      const data = await res.json();
      setChords(data.chords || []);
      
      // Create audio URL from uploaded file
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }

  function skipBackward() {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  }

  function skipForward() {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        duration,
        audioRef.current.currentTime + 5
      );
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen bg-[url('/home-bg.jpg')] bg-cover bg-center p-4 sm:p-6">
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center text-white">
            Identify Song Chords
          </h1>

          <div className="space-y-4">
            <input
              type="file"
              accept=".mp3,.mp4,.wav,.m4a"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full p-2 sm:p-3 rounded-lg bg-white/20 text-white border border-white/30 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:bg-white/30 file:text-white hover:file:bg-white/40 text-sm sm:text-base"
            />

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-normal disabled:opacity-50 hover:from-green-600 hover:to-emerald-700 transition-all text-sm sm:text-base"
            >
              {loading ? "Analyzing..." : "Upload & Recognize"}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm sm:text-base">
              {error}
            </div>
          )}

          {audioUrl && chords.length > 0 && (
            <div className="mt-4 sm:mt-5 space-y-4 sm:space-y-6">
              {/* Current Chord Display */}
              <div className="bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-2xl p-4 sm:p-6 md:p-8 text-center border border-yellow-400/30">
                <div className="text-xs sm:text-sm text-gray-300 mb-2">Now Playing</div>
                <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2 sm:mb-3 min-h-[60px] sm:min-h-[70px] md:min-h-[80px] flex items-center justify-center">
                  {currentChord && currentChord !== "N" ? currentChord : "—"}
                </div>
                <div className="text-xs sm:text-sm text-gray-300">
                  {formatTime(currentTime)}
                </div>
              </div>

              {/* Audio Controls */}
              <div className="bg-white/10 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-center space-x-3 sm:space-x-4">
                  <button
                    onClick={skipBackward}
                    className="p-2 sm:p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all"
                  >
                    <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </button>
                  
                  <button
                    onClick={togglePlay}
                    className="p-3 sm:p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full hover:from-green-600 hover:to-emerald-700 transition-all"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    ) : (
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    )}
                  </button>
                  
                  <button
                    onClick={skipForward}
                    className="p-2 sm:p-3 bg-white/20 rounded-full hover:bg-white/30 transition-all"
                  >
                    <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 sm:h-2 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 sm:[&::-webkit-slider-thumb]:w-4 sm:[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                  <div className="flex justify-between text-xs sm:text-sm text-gray-300">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              <audio ref={audioRef} src={audioUrl} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
