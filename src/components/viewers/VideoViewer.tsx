import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, FastForward } from 'lucide-react';

interface VideoViewerProps {
  videoUrl: string;
  title: string;
  thumbnail?: string;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ videoUrl, title, thumbnail }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
      setPlaybackSpeed(nextSpeed);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-[#E2E8F0] shadow-md group">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnail}
        playsInline
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full object-contain"
      />

      {/* Center Big Play Button Overlay when paused */}
      {!isPlaying && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white flex items-center justify-center shadow-lg transition-transform transform hover:scale-110 active:scale-95 cursor-pointer ring-4 ring-white/20 z-10"
          aria-label="Play Video"
        >
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1" />
        </button>
      )}

      {/* Floating Bottom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-3 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="hover:text-[#57DFFE] cursor-pointer" aria-label="Play/Pause">
            {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
          </button>
          <button onClick={toggleMute} className="hover:text-[#57DFFE] cursor-pointer" aria-label="Mute/Unmute">
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <span className="font-heading font-medium truncate max-w-xs hidden sm:inline">{title}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={changeSpeed}
            className="px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 font-mono text-[11px] font-bold cursor-pointer"
            title="Playback Speed"
          >
            {playbackSpeed}x
          </button>
          <button onClick={handleFullscreen} className="hover:text-[#57DFFE] cursor-pointer" aria-label="Fullscreen">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
