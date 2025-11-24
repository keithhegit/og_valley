
import React, { useEffect, useState } from 'react';
import { PlayerSprite, BusSprite } from './PixelArt';

interface IntroProps {
  onStart: () => void;
}

const Intro: React.FC<IntroProps> = ({ onStart }) => {
  // 0: Init, 1: Bus Arrives, 2: Player Disembarks, 3: Bus Leaves, 4: Title Show
  const [phase, setPhase] = useState(0);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    timeouts.push(setTimeout(() => setPhase(1), 100));
    timeouts.push(setTimeout(() => setPhase(2), 3000));
    timeouts.push(setTimeout(() => setPhase(3), 4500));
    timeouts.push(setTimeout(() => setPhase(4), 6500));
    return () => timeouts.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase === 4) {
      const interval = setInterval(() => setBlink(b => !b), 600);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className="absolute inset-0 bg-[#1a1a1a] flex flex-col items-center justify-center z-50 overflow-hidden scanlines">
      <div className={`relative w-full h-64 bg-[#2d2d2d] overflow-hidden transition-opacity duration-1000 ${phase === 4 ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
         <div className="absolute top-1/2 w-full h-16 bg-[#111] border-y-4 border-[#333]"></div>
         <div className="absolute top-1/2 mt-7 w-full h-2 bg-dashed border-t-2 border-dashed border-yellow-600 opacity-50"></div>

         <div 
           className="absolute top-1/2 -mt-12 left-0 transition-all duration-[3000ms] ease-out"
           style={{
             transform: phase === 0 ? 'translateX(-100%)' : (phase === 1 || phase === 2 ? 'translateX(calc(50vw - 60px))' : 'translateX(150vw)')
           }}
         >
           <BusSprite className="w-32 h-16" />
         </div>

         <div 
            className={`absolute top-1/2 mt-2 left-[calc(50vw-20px)] transition-all duration-500 ${phase >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
         >
           <PlayerSprite className="w-10 h-12" facing="DOWN" walking={false} />
         </div>
      </div>

      <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ${phase === 4 ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="text-yellow-400 text-6xl md:text-8xl drop-shadow-[4px_4px_0_rgba(168,85,247,0.8)] font-bold tracking-tighter transform -rotate-2 mb-8 animate-[bounce_3s_infinite]">
          Og Valley
        </div>
        <div className="text-white mb-12 text-sm uppercase tracking-widest opacity-80">
          Spring Farming Sim
        </div>
        <div 
          onClick={onStart}
          className={`text-white text-xl md:text-2xl cursor-pointer border-b-2 border-transparent hover:border-white transition-all ${blink ? 'opacity-100' : 'opacity-40'}`}
        >
          PRESS START
        </div>
        <div className="absolute bottom-4 text-slate-500 text-xs">
           v1.1.0 • React • Tailwind • Hybrid Engine
        </div>
      </div>
    </div>
  );
};

export default Intro;
