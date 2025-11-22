import React, { useRef, useState, useEffect } from 'react';

interface AudioPlayerProps {
  src: string | null;
  title: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, title }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!src) {
        setIsPlaying(false);
        setProgress(0);
    }
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current || !src) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setProgress((current / total) * 100);
      if (current === total) setIsPlaying(false);
    }
  };

  return (
    <div className="w-full bg-black/40 backdrop-blur-md border-t border-homa-orange/20 p-4 fixed bottom-0 left-0 z-50 lg:pl-64">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Song Info */}
        <div className="w-1/3 truncate">
           <p className="text-homa-orange text-xs uppercase tracking-wider font-bold">Now Playing</p>
           <p className="text-white font-medium truncate">{title || "Select a song..."}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center w-1/3">
          <div className="flex items-center gap-4 mb-2">
            <button className="text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
            <button 
              onClick={togglePlay}
              disabled={!src}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${src ? 'bg-white text-black hover:scale-105' : 'bg-gray-700 text-gray-500'} transition-all`}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                 <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button className="text-gray-400 hover:text-white"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" transform="rotate(180 12 12)"/></svg></button>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden cursor-pointer">
            <div className="h-full bg-homa-orange transition-all duration-100" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* Visualizer (Fake) */}
        <div className="w-1/3 flex justify-end items-center gap-1 h-8">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className={`w-1 bg-homa-orange rounded-full transition-all duration-150 ${isPlaying ? 'animate-wave' : 'h-1'}`}
              style={{ 
                height: isPlaying ? `${Math.random() * 100}%` : '4px',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      </div>
      <audio ref={audioRef} src={src || ""} onTimeUpdate={handleTimeUpdate} className="hidden" />
    </div>
  );
};