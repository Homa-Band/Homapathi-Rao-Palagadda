import React from 'react';

export const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex flex-col items-center justify-center select-none ${className}`}>
    <div className="relative">
      <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tighter text-homa-orange leading-none">
        HOMA
      </h1>
      {/* Fire accent simulation using SVG */}
      <svg className="absolute -top-2 -right-4 w-8 h-8 text-homa-orange animate-pulse-slow" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2c0 0-3 4-3 7 0 4 4 6 4 9 0 4-6 2-6 2s2-5 0-8c-3 2-5 6-5 10 0 5 6 9 10 9s10-4 10-9c0-5-5-10-10-20z"/>
      </svg>
    </div>
    <div className="flex items-center gap-2 mt-1">
      <div className="h-[2px] w-4 bg-white"></div>
      <span className="font-display text-2xl text-white tracking-widest uppercase">Band</span>
      <div className="h-[2px] w-4 bg-white"></div>
    </div>
  </div>
);