"use client"

import { useRef, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react"

interface VideoBannerProps {
  // The default prop uses the absolute path from the root, which Next.js maps to the public folder
  videoSrc?: string
}

export default function VideoBanner({ videoSrc = "/nammacab-banner.mp4" }: VideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    const playVideo = async () => {
      if (videoRef.current) {
        try {
          videoRef.current.muted = true;
          await videoRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.log("Autoplay blocked or video missing:", err);
          setIsPlaying(false);
        }
      }
    };
    playVideo();
  }, []);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  }

  return (
    <motion.div
      className="relative w-full max-w-[560px] h-[420px] mx-auto select-none group"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="relative w-full h-full rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl">
        
        {/* Error State */}
        {videoError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-400 text-sm p-6 text-center">
            <p className="text-red-400 font-bold mb-2">Unable to load video.</p>
            <p>Check your browser console (F12) for the exact error code.</p>
            <p className="text-xs mt-2 text-slate-500">Attempted Path: {videoSrc}</p>
          </div>
        ) : (
          <video
            ref={videoRef}
            src={videoSrc}
            muted={isMuted}
            loop
            autoPlay
            playsInline
            className="w-full h-full object-cover cursor-pointer"
            onLoadedData={() => setIsLoaded(true)}
            onError={(e) => {
              // This will log exactly WHY the browser rejected the video
              console.error("Video failed to load. Browser error event:", e);
              const target = e.target as HTMLVideoElement;
              console.error("Video Error Code:", target.error?.code, target.error?.message);
              setVideoError(true);
            }}
            onClick={() => togglePlay()}
          />
        )}

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/40 via-transparent to-slate-900/20" />

      

        {!isLoaded && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="w-10 h-10 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
          </div>
        )}

        <AnimatePresence>
          {showControls && isLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-30"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={togglePlay} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                  </button>
                  <button onClick={toggleMute} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                  </button>
                </div>
                <button onClick={handleFullscreen} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                  <Maximize2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isPlaying && isLoaded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] cursor-pointer"
              onClick={() => togglePlay()}
            >
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-xl shadow-green-500/20">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}