
import React, { useState } from 'react';
import { ITEM_DB, ASSET_BASE_URL, TILE_SIZE, COLORS } from '../constants';

// Common props
interface PixelProps {
  className?: string;
  scale?: number;
}

const SVGWrapper: React.FC<PixelProps & { children: React.ReactNode, viewBox?: string }> = ({ className, children, viewBox = "0 0 16 16" }) => (
  <svg 
    viewBox={viewBox} 
    className={`${className} block`} 
    style={{ shapeRendering: 'crispEdges' }}
    xmlns="http://www.w3.org/2000/svg"
  >
    {children}
  </svg>
);

// --- HYBRID ENGINE ---

export const Sprite: React.FC<{ src: string; cropPos?: [number, number]; fallbackColor?: string; className?: string; scale?: number }> = ({ 
  src, cropPos, fallbackColor, className, scale = 3 
}) => {
  const [loaded, setLoaded] = useState(false);
  const imgUrl = ASSET_BASE_URL ? `${ASSET_BASE_URL}/${src}` : null;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width: '100%', height: '100%' }}>
      {imgUrl && (
        <img 
          src={imgUrl} 
          alt="" 
          onLoad={() => setLoaded(true)}
          style={{ 
            display: loaded ? 'block' : 'none', 
            position: 'absolute', 
            left: `-${(cropPos?.[0]||0)*scale}px`, 
            top: `-${(cropPos?.[1]||0)*scale}px`, 
            imageRendering: 'pixelated', 
            transformOrigin: 'top left', 
            transform: `scale(${scale})` 
          }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; setLoaded(false); }} 
        />
      )}
      {(!loaded || !imgUrl) && (
        <div className="w-full h-full" style={{ backgroundColor: fallbackColor }}></div>
      )}
    </div>
  );
};

// Routes ID -> SVG or R2 Image
export const ItemRenderer: React.FC<{ id: number; className?: string }> = ({ id, className }) => {
  const item = ITEM_DB[id];
  if (!item) return null;

  // Priority 1: R2 Asset
  if (ASSET_BASE_URL && item.sprite) {
    return <Sprite src={item.sprite} cropPos={item.pos} fallbackColor={item.color} className={className} />;
  }

  // Priority 2: Inline SVG Fallbacks
  switch (id) {
    case 101: return <ToolIcon type="HOE" className={className} />;
    case 102: return <ToolIcon type="WATERING_CAN" className={className} />;
    case 103: return <ToolIcon type="AXE" className={className} />;
    case 104: return <ToolIcon type="PICKAXE" className={className} />;
    case 105: return <ToolIcon type="SWORD" className={className} />;
    case 472: return <ToolIcon type="SEEDS_TURNIP" className={className} />; 
    case 474: return <ToolIcon type="SEEDS_POTATO" className={className} />; 
    case 2: return <RockSprite className={className} />;
    case 18: return <FlowerSprite className={className} />;
    case 998: return <MailboxSprite className={className} />;
    case 999: return <ShippingBinSprite className={className} />;
    case 130: return <ChestSprite className={className} />;
    case 903: case 904: return <LadderSprite className={className} />;
    
    // Crops usually handled by tile, but for inventory:
    case 24: return <CropSprite stage={4} className={className} />; 
    case 192: return <CropSprite stage={4} className={className} />; 

    default: 
      return <div className={`${className} rounded-full border-2 border-white/50`} style={{ backgroundColor: item.color || '#ccc' }} />;
  }
};

// --- TILES ---

export const GrassTile: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className}>
    <rect width="16" height="16" fill={COLORS.GRASS} />
    <rect x="2" y="3" width="1" height="1" fill="#409c40" opacity="0.6" />
    <rect x="8" y="10" width="1" height="1" fill="#409c40" opacity="0.6" />
    <rect x="12" y="5" width="2" height="1" fill="#88cc88" opacity="0.4" />
  </SVGWrapper>
);

export const DirtTile: React.FC<PixelProps & { wet?: boolean }> = ({ className, wet }) => (
  <SVGWrapper className={className}>
    <rect width="16" height="16" fill={wet ? COLORS.WATERED : COLORS.DIRT} />
    <rect x="1" y="1" width="14" height="14" fill="none" stroke={wet ? "#4a3b25" : "#755e3d"} strokeWidth="1" />
    <rect x="4" y="4" width="2" height="2" fill={wet ? "#3d301e" : "#6b5434"} />
  </SVGWrapper>
);

export const StoneFloorTile: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className}>
    <rect width="16" height="16" fill={COLORS.STONE_FLOOR} />
    <rect x="0" y="0" width="8" height="8" fill="none" stroke="#78909c" />
    <rect x="8" y="8" width="8" height="8" fill="none" stroke="#78909c" />
  </SVGWrapper>
);

export const DarkDirtTile: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className}>
    <rect width="16" height="16" fill={COLORS.DARK_DIRT} />
    <rect x="4" y="2" width="2" height="2" fill="#263238" />
    <rect x="10" y="12" width="2" height="2" fill="#263238" />
  </SVGWrapper>
);

export const WaterTile: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className}>
    <rect width="16" height="16" fill={COLORS.WATER} />
    <rect x="2" y="4" width="3" height="1" fill="#cceeff" opacity="0.7" />
    <rect x="8" y="10" width="4" height="1" fill="#cceeff" opacity="0.7" />
    <rect x="1" y="12" width="2" height="1" fill="#388a9e" opacity="0.5" />
  </SVGWrapper>
);

export const HouseSprite: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className} viewBox="0 0 48 48">
    <rect x="4" y="40" width="40" height="8" fill="rgba(0,0,0,0.3)" />
    <rect x="6" y="20" width="36" height="24" fill="#d4a373" />
    <path d="M 4 20 L 24 4 L 44 20 Z" fill="#b04e4e" />
    <path d="M 6 20 L 24 6 L 42 20" fill="none" stroke="#8a3a3a" strokeWidth="2" />
    <rect x="20" y="30" width="8" height="14" fill="#6b4c35" />
    <rect x="26" y="37" width="1" height="1" fill="#ffd700" />
    <rect x="10" y="26" width="6" height="6" fill="#87ceeb" stroke="#6b4c35" strokeWidth="1" />
  </SVGWrapper>
);

export const ShippingBinSprite: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className} viewBox="0 0 16 16">
    <rect x="1" y="6" width="14" height="10" fill="#8d6e63" stroke="#5d4037" strokeWidth="1" />
    <rect x="2" y="7" width="12" height="2" fill="#3e2723" opacity="0.5" />
    <path d="M1 6 L3 3 L13 3 L15 6 Z" fill="#a1887f" stroke="#5d4037" strokeWidth="1" />
    <rect x="6" y="10" width="4" height="4" fill="#5d4037" opacity="0.5" />
  </SVGWrapper>
);

export const MailboxSprite: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className} viewBox="0 0 16 16">
    <rect x="7" y="8" width="2" height="8" fill="#5d4037" />
    <rect x="4" y="2" width="8" height="7" rx="1" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
    <rect x="5" y="4" width="6" height="1" fill="#bfdbfe" opacity="0.5" />
    <rect x="10" y="4" width="2" height="1" fill="#ef4444" />
  </SVGWrapper>
);

export const ChestSprite: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className} viewBox="0 0 16 16">
    <rect x="2" y="5" width="12" height="9" fill="#8d6e63" stroke="#3e2723" strokeWidth="1" />
    <rect x="2" y="3" width="12" height="2" fill="#a1887f" stroke="#3e2723" strokeWidth="1" />
    <rect x="7" y="7" width="2" height="2" fill="#ffeb3b" stroke="#f57f17" strokeWidth="1" />
  </SVGWrapper>
);

export const LadderSprite: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className} viewBox="0 0 16 16">
    <rect x="4" y="0" width="2" height="16" fill="#5d4037" />
    <rect x="10" y="0" width="2" height="16" fill="#5d4037" />
    <rect x="6" y="2" width="4" height="2" fill="#8d6e63" />
    <rect x="6" y="6" width="4" height="2" fill="#8d6e63" />
    <rect x="6" y="10" width="4" height="2" fill="#8d6e63" />
    <rect x="6" y="14" width="4" height="2" fill="#8d6e63" />
  </SVGWrapper>
);

// --- OBJECTS ---

export const RockSprite: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className}>
    <rect x="2" y="11" width="12" height="3" rx="1.5" fill="rgba(0,0,0,0.2)" />
    <path d="M4 12 L2 8 L4 4 L10 3 L14 6 L13 12 Z" fill="#6b7280" />
    <path d="M4 5 L9 4 L12 6" fill="none" stroke="#9ca3af" strokeWidth="1" />
    <path d="M5 10 L7 8 M10 7 L11 9" fill="none" stroke="#374151" strokeWidth="1" />
  </SVGWrapper>
);

export const FlowerSprite: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className}>
     <circle cx="8" cy="6" r="2" fill="#ff69b4" />
     <circle cx="6" cy="8" r="2" fill="#ff69b4" />
     <circle cx="10" cy="8" r="2" fill="#ff69b4" />
     <circle cx="8" cy="10" r="2" fill="#ff69b4" />
     <circle cx="8" cy="8" r="1.5" fill="#ffd700" />
     <rect x="7" y="11" width="2" height="4" fill="#56ab56" />
  </SVGWrapper>
);

export const CropSprite: React.FC<PixelProps & { stage: number }> = ({ className, stage }) => (
  <SVGWrapper className={className}>
    {stage === 0 && ( 
       <>
         <rect x="4" y="10" width="2" height="2" fill="#e0c080" />
         <rect x="8" y="12" width="2" height="2" fill="#e0c080" />
         <rect x="11" y="9" width="2" height="2" fill="#e0c080" />
       </>
    )}
    {stage > 0 && stage < 4 && ( 
      <>
        <rect x="7" y="10" width="2" height="4" fill="#56ab56" />
        <rect x="5" y={10 - stage * 2} width="2" height="2" fill="#56ab56" />
        <rect x="9" y={10 - stage * 2} width="2" height="2" fill="#56ab56" />
      </>
    )}
    {stage >= 4 && ( 
       <>
        <path d="M4 6 L8 10 L12 6" stroke="#409c40" strokeWidth="2" fill="none" />
        <path d="M8 10 L8 4" stroke="#409c40" strokeWidth="2" />
        <circle cx="8" cy="12" r="3.5" fill="#f0f0f0" />
        <circle cx="8" cy="13" r="3.5" fill="#cc99cc" clipPath="inset(50% 0 0 0)" />
       </>
    )}
  </SVGWrapper>
);

// --- CHARACTERS & VEHICLES ---

export const PlayerSprite: React.FC<PixelProps & { facing: string; walking: boolean }> = ({ className, facing, walking }) => {
  const yOffset = walking ? -1 : 0;
  return (
    <SVGWrapper className={className} viewBox="0 0 16 20">
      <g transform={`translate(0, ${yOffset})`}>
        <ellipse cx="8" cy="19" rx="5" ry="2" fill="rgba(0,0,0,0.3)" />
        <rect x="5" y="10" width="6" height="6" fill="#3b82f6" /> 
        <rect x="4" y="3" width="8" height="7" fill="#fca5a5" /> 
        <rect x="3" y="2" width="10" height="3" fill="#ef4444" /> 
        <rect x="4" y="0" width="8" height="2" fill="#ef4444" />
        {(facing === 'DOWN' || facing === 'RIGHT' || facing === 'LEFT') && (
           <>
            <rect x="5" y="5" width="2" height="2" fill="#000" opacity="0.7" />
            <rect x="9" y="5" width="2" height="2" fill="#000" opacity="0.7" />
           </>
        )}
        <rect x="5" y="16" width="2" height="3" fill="#1f2937" />
        <rect x="9" y="16" width="2" height="3" fill="#1f2937" />
        {facing === 'DOWN' && (
          <>
            <rect x="3" y="10" width="2" height="5" fill="#fca5a5" />
            <rect x="11" y="10" width="2" height="5" fill="#fca5a5" />
          </>
        )}
      </g>
    </SVGWrapper>
  );
};

export const NPCSprite: React.FC<PixelProps & { variant: 'MAYOR' | 'GRANNY', facing: string }> = ({ className, variant, facing }) => {
  const isMayor = variant === 'MAYOR';
  const bodyColor = isMayor ? '#166534' : '#7e22ce';
  const hairColor = isMayor ? '#9ca3af' : '#d1d5db';
  return (
    <SVGWrapper className={className} viewBox="0 0 16 20">
       <g>
         <ellipse cx="8" cy="19" rx="5" ry="2" fill="rgba(0,0,0,0.3)" />
         <rect x="4" y="10" width="8" height="7" fill={bodyColor} />
         <rect x="4" y="3" width="8" height="7" fill="#fca5a5" />
         {isMayor ? (
            <>
              <rect x="3" y="0" width="10" height="4" fill="#111" />
              <rect x="2" y="3" width="12" height="1" fill="#111" />
            </>
         ) : (
            <>
              <rect x="3" y="1" width="10" height="4" fill={hairColor} />
              <rect x="6" y="0" width="4" height="2" fill={hairColor} />
            </>
         )}
         <rect x="5" y="5" width="2" height="2" fill="#000" opacity="0.6" />
         <rect x="9" y="5" width="2" height="2" fill="#000" opacity="0.6" />
         {isMayor && <rect x="7" y="11" width="2" height="4" fill="#ef4444" />}
         {!isMayor && <rect x="5" y="12" width="6" height="4" fill="#fff" opacity="0.3" />}
         <rect x="5" y="17" width="2" height="2" fill="#1f2937" />
         <rect x="9" y="17" width="2" height="2" fill="#1f2937" />
       </g>
    </SVGWrapper>
  );
};

export const SlimeSprite: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className} viewBox="0 0 16 16">
    <ellipse cx="8" cy="12" rx="6" ry="4" fill="rgba(0,0,0,0.3)" />
    <path d="M 8 2 Q 2 2 2 10 Q 2 14 8 14 Q 14 14 14 10 Q 14 2 8 2" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
    <circle cx="5" cy="8" r="1.5" fill="black" />
    <circle cx="11" cy="8" r="1.5" fill="black" />
    <circle cx="6" cy="7" r="0.5" fill="white" />
    <circle cx="12" cy="7" r="0.5" fill="white" />
  </SVGWrapper>
);

export const BusSprite: React.FC<PixelProps> = ({ className }) => (
  <SVGWrapper className={className} viewBox="0 0 64 32">
    <rect x="4" y="28" width="56" height="4" fill="rgba(0,0,0,0.3)" />
    <rect x="2" y="8" width="60" height="20" rx="2" fill="#fbbf24" />
    <rect x="2" y="14" width="60" height="2" fill="#d97706" />
    <rect x="6" y="10" width="10" height="8" fill="#93c5fd" />
    <rect x="18" y="10" width="10" height="8" fill="#93c5fd" />
    <rect x="30" y="10" width="10" height="8" fill="#93c5fd" />
    <rect x="42" y="10" width="10" height="8" fill="#93c5fd" />
    <circle cx="12" cy="28" r="4" fill="#1f2937" />
    <circle cx="12" cy="28" r="2" fill="#4b5563" />
    <circle cx="52" cy="28" r="4" fill="#1f2937" />
    <circle cx="52" cy="28" r="2" fill="#4b5563" />
    <rect x="60" y="20" width="2" height="4" fill="#fef08a" />
  </SVGWrapper>
);

export const ToolIcon: React.FC<PixelProps & { type: string }> = ({ className, type }) => (
  <SVGWrapper className={className} viewBox="0 0 16 16">
    {type === 'HOE' && <path d="M4 4 L10 4 L10 12 L12 12" fill="none" stroke="#a0a0a0" strokeWidth="2" />}
    {type === 'WATERING_CAN' && (
      <><rect x="4" y="6" width="8" height="6" fill="#ef4444" /><path d="M12 8 L14 6" stroke="#ef4444" strokeWidth="2" /></>
    )}
    {type === 'PICKAXE' && (
      <path d="M3 13 L6 10 M5 11 L6 12 M10 6 L13 3 L14 4 L11 7 M12 5 L11 4 M2 14 L4 12" stroke="#a0a0a0" strokeWidth="2" fill="none" />
    )}
    {type === 'AXE' && (
      <path d="M8 12 L8 4 M5 4 L11 4 L11 8 L5 8 Z" stroke="#a0a0a0" strokeWidth="2" fill="#d32f2f" />
    )}
    {type === 'SWORD' && (
      <path d="M3 13 L13 3 M4 12 L12 4" stroke="#e0e0e0" strokeWidth="2" />
    )}
    {type === 'SEEDS_TURNIP' && (
      <><rect x="3" y="3" width="10" height="10" rx="2" fill="#fde047" /><circle cx="8" cy="8" r="2" fill="#854d0e" /></>
    )}
    {type === 'SEEDS_POTATO' && (
      <><rect x="3" y="3" width="10" height="10" rx="2" fill="#d4a373" /><circle cx="8" cy="8" r="2" fill="#5d4037" /></>
    )}
  </SVGWrapper>
);

export const RainOverlay: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden opacity-60">
    <svg className="w-full h-full">
      <pattern id="rain" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 2 0 L 0 6" stroke="#a5f3fc" strokeWidth="1" strokeOpacity="0.8" />
      </pattern>
      <rect width="100%" height="100%" fill="url(#rain)" className="animate-[rain_0.5s_linear_infinite]" />
    </svg>
    <style>{`
      @keyframes rain {
        from { transform: translateY(0px) translateX(0px); }
        to { transform: translateY(20px) translateX(-6px); }
      }
    `}</style>
  </div>
);

export const CursorReticle: React.FC<PixelProps & { valid: boolean }> = ({ className, valid }) => (
  <div className={`${className} absolute pointer-events-none transition-colors duration-150`}>
    <div className={`w-full h-full border-2 ${valid ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/10'} animate-pulse`}>
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${valid ? 'border-green-300' : 'border-red-300'}`}></div>
      <div className={`absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 ${valid ? 'border-green-300' : 'border-red-300'}`}></div>
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 ${valid ? 'border-green-300' : 'border-red-300'}`}></div>
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${valid ? 'border-green-300' : 'border-red-300'}`}></div>
    </div>
  </div>
);
