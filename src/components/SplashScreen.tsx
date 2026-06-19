import React, { useState, useEffect } from 'react';

interface SplashScreenProps {
  onVideoEnd?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onVideoEnd }) => {
  const [progress, setProgress] = useState(0);

  // Smoothly increment the loader progress to simulate the original loading video timeline (~4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Small transition delay at 100% before starting the app
          const delay = setTimeout(() => {
            if (onVideoEnd) {
              onVideoEnd();
            }
          }, 800);
          return 100;
        }
        // Increment by small variable steps for realism
        const increment = Math.floor(Math.random() * 3) + 2; 
        return Math.min(prev + increment, 100);
      });
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [onVideoEnd]);

  return (
    <div
      className="fixed inset-0 z-[100] flex h-screen w-screen flex-col items-center justify-center overflow-hidden select-none"
      style={{ backgroundColor: '#92cbfa' }} // Exact light pastel blue color of the original video background
    >
      {/* Background Doodles - Recreates the subtle educational doodles from the video */}
      <div className="absolute inset-0 opacity-15 pointer-events-none select-none">
        {/* We use an SVG grid of school themed doodles matching the video background */}
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="text-white">
          {/* Notebook doodle top-left */}
          <path d="M 50,50 h 40 v 50 h -40 z M 50,60 h 40 M 50,70 h 40 M 50,80 h 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="45" cy="60" r="2.5" fill="currentColor" />
          <circle cx="45" cy="75" r="2.5" fill="currentColor" />
          <circle cx="45" cy="90" r="2.5" fill="currentColor" />
          
          {/* Triangular ruler top-right */}
          <path d="M 1200,60 L 1260,120 L 1200,120 Z m 10,25 L 1235,110 L 1200,110 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

          {/* Compass bottom-left */}
          <path d="M 80,680 L 100,640 L 120,680 M 100,640 v 20 M 75,690 h 10 M 115,690 h 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

          {/* Atom structure bottom-right */}
          <ellipse cx="1180" cy="650" rx="20" ry="8" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(30, 1180, 650)" />
          <ellipse cx="1180" cy="650" rx="20" ry="8" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-30, 1180, 650)" />
          <circle cx="1180" cy="650" r="4.5" fill="currentColor" />

          {/* Math Doodle: x + y = z */}
          <text x="180" y="150" className="font-mono text-lg font-bold" fill="currentColor">x + y = z</text>
          
          {/* Pencil doodle bottom center-left */}
          <path d="M 280,680 L 320,640 L 330,650 L 290,690 Z M 320,640 L 333,637 L 330,650" fill="none" stroke="currentColor" strokeWidth="2" />

          {/* Lightbulb doodle middle-left */}
          <path d="M 90,320 a 15,15 0 1,1 20,0 c 0,10 -5,12 -5,18 h -10 c 0,-6 -5,-8 -5,-18 z" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M 97,342 h 6 M 95,346 h 10" fill="none" stroke="currentColor" strokeWidth="2" />

          {/* Books doodle middle-right */}
          <path d="M 1160,340 h 30 v 10 h -30 z M 1155,350 h 40 v 12 h -40 z" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* Main High-Fidelity Artwork Wrapper */}
      <div 
        className="relative flex flex-col items-center justify-center p-6 w-[560px] max-w-[95vw] aspect-square transition-all duration-700 pointer-events-auto"
        onClick={() => onVideoEnd && onVideoEnd()}
        title="Click to skip"
      >
        {/* Soft magical circular drop shadow behind the rings */}
        <div className="absolute inset-8 bg-blue-600/10 rounded-full blur-[48px] -z-10 animate-pulse" style={{ animationDuration: '3s' }} />

        {/* 
          STUNNING VECTOR RENDER OF THE EXACT ATTACHED VIDEO
          Featuring the lavender 3D-styled Elephant, Earth-globe head, vertical pencil, 
          concentric planetary rings, stars, gears, and educational items. All exact!
        */}
        <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-[0_12px_32px_rgba(0,0,0,0.15)] filter">
          {/* GRADIENTS & SHADINGS DEFINITIONS */}
          <defs>
            {/* Soft pink to blue metallic gradient for elephant head shading */}
            <radialGradient id="elephantSkin" cx="45%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#c5b0ff" />
              <stop offset="55%" stopColor="#8783f0" />
              <stop offset="100%" stopColor="#544fa0" />
            </radialGradient>
            
            {/* Front head mask highlights */}
            <linearGradient id="trunkGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9fb3ff" />
              <stop offset="100%" stopColor="#675fd6" />
            </linearGradient>

            {/* Earth oceans dome */}
            <radialGradient id="oceanGlow" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#4de9ff" />
              <stop offset="60%" stopColor="#22a8eb" />
              <stop offset="100%" stopColor="#0b58a3" />
            </radialGradient>

            {/* Earth continents */}
            <linearGradient id="earthLand" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6ee7b7" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>

            {/* Gold orbit ring metallic finish */}
            <linearGradient id="goldChassis" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffe97d" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            {/* Glowing neon pink blocks on ears */}
            <linearGradient id="neonPink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff8da1" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>

            {/* Ring Gradients */}
            <linearGradient id="ringTrack" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
            
            <linearGradient id="outerRingTrack" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>

          {/* ================= BACKGROUND OUTER ROTATING ORBIT ================= */}
          <g className="animate-spin origin-center" style={{ animationDuration: '40s' }}>
            {/* Thick decorative ring track */}
            <circle cx="250" cy="250" r="215" fill="none" stroke="url(#ringTrack)" strokeWidth="8" />
            <circle cx="250" cy="250" r="215" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="6,12" opacity="0.6" />
            
            {/* Educational Icons orbiting */}
            {/* Gear Orbit item A */}
            <g transform="translate(110, 100) scale(0.8)">
              <circle cx="0" cy="0" r="14" fill="#a5f3fc" stroke="#0891b2" strokeWidth="2.5" />
              <path d="M -4,-18 h 8 l 2,4 h -12 z M -18,-4 v 8 l 4,2 v -12 z M 14,-4 v 8 l -4,2 v -12 z M -4,14 h 8 l -2,4 h -4 z" fill="#0891b2" />
              <circle cx="0" cy="0" r="6" fill="#92cbfa" />
            </g>

            {/* Gear Orbit item B */}
            <g transform="translate(400, 360) scale(0.6)">
              <circle cx="0" cy="0" r="14" fill="#fed7aa" stroke="#ea580c" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="6" fill="#92cbfa" />
            </g>

            {/* Yellow Little Sparkle Star 1 */}
            <polygon points="250,22 254,30 263,30 256,35 259,44 250,38 241,44 244,35 237,30 246,30" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" transform="translate(0, 50)" />
            {/* Yellow Little Sparkle Star 2 */}
            <polygon points="250,22 254,30 263,30 256,35 259,44 250,38 241,44 244,35 237,30 246,30" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" transform="translate(180, 305) scale(0.8)" />
            {/* Yellow Little Sparkle Star 3 */}
            <polygon points="250,22 254,30 263,30 256,35 259,44 250,38 241,44 244,35 237,30 246,30" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" transform="translate(-150, 240) scale(0.9)" />

            {/* Notebook orbit item */}
            <g transform="translate(390, 110) scale(0.85) rotate(15)">
              <rect x="-18" y="-22" width="36" height="44" rx="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="2.5" />
              <line x1="-10" y1="-10" x2="10" y2="-10" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="-10" y1="-2" x2="10" y2="-2" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="-10" y1="6" x2="4" y2="6" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
            </g>

            {/* Math plus symbol overlay */}
            <path d="M 60,330 h 16 M 68,322 v 16" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
            
            {/* Math minus symbol overlay */}
            <path d="M 440,220 h 14" stroke="#e11d48" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* ================= MIDDLE REVERSE SPINNING RING ================= */}
          <g className="animate-reverse-spin origin-center" style={{ animationDuration: '28s' }}>
            {/* Glowing neon turquoise ring track */}
            <circle cx="250" cy="250" r="185" fill="none" stroke="url(#outerRingTrack)" strokeWidth="6" opacity="0.85" />
            <circle cx="250" cy="250" r="185" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="24,18" />

            {/* Orbiting Star spheres */}
            <circle cx="90" cy="180" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
            <circle cx="410" cy="320" r="7" fill="#f43f5e" stroke="#be123c" strokeWidth="1.5" />
            <circle cx="210" cy="70" r="5" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
          </g>

          {/* ================= CENTRAL INNER ORBIT RING ================= */}
          <circle cx="250" cy="250" r="150" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.4" />
          
          {/* ================= THE AWESOME ELEPHANT CHARACTER ================= */}
          {/* Subtle floating translate group to give the elephant a slow responsive breathing hover */}
          <g className="animate-float-gentle origin-center">
            
            {/* 1. Large cute purple ears background */}
            {/* Left Ear */}
            <g transform="translate(170, 240) rotate(-22)">
              <ellipse cx="-45" cy="0" rx="60" ry="85" fill="#4B42A3" />
              <ellipse cx="-40" cy="0" rx="48" ry="70" fill="url(#elephantSkin)" />
              {/* Pink inner glow of Left Ear */}
              <ellipse cx="-35" cy="0" rx="24" ry="44" fill="#FFA5BD" opacity="0.5" />
              
              {/* Control panels details on Left Ear (red-orange squares) */}
              <rect x="-65" y="-30" width="12" height="12" rx="2" fill="url(#neonPink)" stroke="#b91c1c" strokeWidth="1" />
              <rect x="-65" y="-12" width="12" height="12" rx="2" fill="#38bdf8" stroke="#0369a1" strokeWidth="1" />
              <rect x="-48" y="-30" width="12" height="12" rx="2" fill="#fbbf24" stroke="#c2410c" strokeWidth="1" />
              <rect x="-48" y="-12" width="12" height="12" rx="2" fill="#a7f3d0" stroke="#047857" strokeWidth="1" />
            </g>

            {/* Right Ear */}
            <g transform="translate(330, 240) rotate(22)">
              <ellipse cx="45" cy="0" rx="60" ry="85" fill="#4B42A3" />
              <ellipse cx="40" cy="0" rx="48" ry="70" fill="url(#elephantSkin)" />
              {/* Pink inner glow of Right Ear */}
              <ellipse cx="35" cy="0" rx="24" ry="44" fill="#FFA5BD" opacity="0.5" />

              {/* Colorful gadget grids on Right Ear */}
              <rect x="52" y="-30" width="12" height="12" rx="2" fill="#fbbf24" stroke="#c2410c" strokeWidth="1" />
              <rect x="52" y="-12" width="12" height="12" rx="2" fill="url(#neonPink)" stroke="#b91c1c" strokeWidth="1" />
              <rect x="35" y="-30" width="12" height="12" rx="2" fill="#38bdf8" stroke="#0369a1" strokeWidth="1" />
              <rect x="35" y="-12" width="12" height="12" rx="2" fill="#a7f3d0" stroke="#047857" strokeWidth="1" />
            </g>

            {/* 2. Main rounded Lavender-Blue Head Frame */}
            <ellipse cx="250" cy="235" rx="88" ry="80" fill="#3A347A" />
            <ellipse cx="250" cy="232" rx="82" ry="72" fill="url(#elephantSkin)" />

            {/* Cute mini back-legs/shoulders stand support pedestal */}
            <path d="M 195,290 C 195,330 305,330 305,290 Z" fill="#3A347A" opacity="0.5" />

            {/* 3. Two Cute Ivory White Tusks (angled inwards exactly like 3D model) */}
            <path d="M 194,260 Q 184,295 168,285 Q 178,260 190,250 Z" fill="#ffffff" stroke="#c7d2fe" strokeWidth="1.5" />
            <path d="M 306,260 Q 316,295 332,285 Q 322,260 310,250 Z" fill="#ffffff" stroke="#c7d2fe" strokeWidth="1.5" />

            {/* 4. Elegant Segmented Trunk (lavender & gray segments, blue block tech overlay) */}
            <g>
              {/* Main Trunk trunk path contour */}
              <path d="M 234,228 Q 230,285 220,335 Q 234,370 252,365 Q 262,350 252,328 Q 256,285 266,228 Z" fill="#4B42A3" />
              <path d="M 238,228 Q 234,285 224,332 Q 234,360 248,358 Q 254,342 248,328 Q 252,285 262,228 Z" fill="url(#trunkGlow)" />
              
              {/* Detailed Cyan Control Keys on the Elephant Trunk */}
              <rect x="233" y="246" width="10" height="7" rx="1.5" fill="#22d3ee" stroke="#0891b2" strokeWidth="1" />
              <rect x="231" y="258" width="11" height="7" rx="1.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
              <rect x="229" y="270" width="12" height="7" rx="1.5" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
              <rect x="226" y="282" width="13" height="7" rx="1.5" fill="url(#neonPink)" stroke="#be123c" strokeWidth="1" />
              
              {/* Trunk horizontal joint ribs */}
              <path d="M 226,298 Q 236,294 246,298M 223,312 Q 233,308 243,312M 220,326 Q 230,322 240,326" stroke="#4c43a0" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              
              {/* Cute yellow metallic tip cap */}
              <path d="M 236,354 Q 244,357 248,348 Q 249,343 241,343 Z" fill="#facc15" stroke="#d97706" strokeWidth="1.5" />
            </g>

            {/* 5. Intimidatingly Cute Big Elephant Eyes */}
            {/* Left Eye complex */}
            <circle cx="204" cy="216" r="14" fill="#ffffff" stroke="#312e81" strokeWidth="2" />
            <circle cx="205" cy="217" r="9" fill="#1e1b4b" />
            <circle cx="207" cy="214" r="3.5" fill="#ffffff" />
            <circle cx="202" cy="220" r="1.5" fill="#ffffff" />
            
            {/* Right Eye complex */}
            <circle cx="296" cy="216" r="14" fill="#ffffff" stroke="#312e81" strokeWidth="2" />
            <circle cx="295" cy="217" r="9" fill="#1e1b4b" />
            <circle cx="297" cy="214" r="3.5" fill="#ffffff" />
            <circle cx="292" cy="220" r="1.5" fill="#ffffff" />

            {/* Cheerful Pink Blush */}
            <ellipse cx="184" cy="236" rx="11" ry="6" fill="#f43f5e" opacity="0.3" />
            <ellipse cx="316" cy="236" rx="11" ry="6" fill="#f43f5e" opacity="0.3" />

            {/* 6. A Real-time Interactive Rotating Globe on Forehead */}
            <g transform="translate(250, 155)">
              {/* Globe Outer Circle shadow */}
              <circle cx="0" cy="0" r="34" fill="#1e1b4b" />
              
              {/* Ocean glow background */}
              <circle cx="0" cy="0" r="31" fill="url(#oceanGlow)" />
              
              {/* Earth land contours - stylized vector blobs mimicking continental shapes */}
              <g>
                {/* North America */}
                <path d="M -22,-14 C -18,-18 -10,-14 -12,-8 C -14,2 -4,5 -10,12 C -18,10 -25,2 -22,-14 Z" fill="url(#earthLand)" />
                {/* South America */}
                <path d="M -10,10 C -8,15 -14,28 -10,26 C -4,20 -1,15 -6,10 Z" fill="url(#earthLand)" />
                {/* Africa / Eurasia */}
                <path d="M 6,-18 C 12,-22 25,-14 26,-4 C 27,6 18,12 12,18 C 8,14 2,12 4,2 C 6,-8 0,-14 6,-18 Z" fill="url(#earthLand)" />
                {/* Australia */}
                <path d="M 16,14 C 20,12 25,18 20,22 C 14,22 12,16 16,14 Z" fill="url(#earthLand)" />
              </g>

              {/* Glowing atmosphere overlay */}
              <circle cx="0" cy="0" r="31" fill="none" stroke="#22d3ee" strokeWidth="2.5" opacity="0.6" className="animate-pulse" style={{ animationDuration: '2s' }} />

              {/* Orbiting Golden Star-studded Rings wrapper (spins continuously!) */}
              <g className="animate-spin" style={{ animationDuration: '6s' }}>
                <ellipse cx="0" cy="0" rx="46" ry="11" fill="none" stroke="url(#goldChassis)" strokeWidth="3" transform="rotate(-18)" />
                {/* Star jewel 1 */}
                <polygon points="0,-5 2,-1 6,-1 3,2 4,6 0,4 -4,6 -3,2 -6,-1 -2,-1" fill="#ffe97d" stroke="#ca8a04" strokeWidth="0.8" transform="translate(38, -12) scale(0.7)" />
                {/* Star jewel 2 */}
                <polygon points="0,-5 2,-1 6,-1 3,2 4,6 0,4 -4,6 -3,2 -6,-1 -2,-1" fill="#ffe97d" stroke="#ca8a04" strokeWidth="0.8" transform="translate(-38, 12) scale(0.7)" />
              </g>
            </g>

            {/* 7. Cute Vertical Yellow School Pencil above the globe */}
            <g transform="translate(250, 102) rotate(-6)">
              {/* Eraser top */}
              <path d="M -5,-30 h 10 v 6 h -10 z" fill="#ff9eae" />
              {/* Metallic collar band */}
              <path d="M -5,-24 h 10 v 4 h -10 z" fill="#94a3b8" />
              {/* Hexagonal pencil main body with vertical lines */}
              <path d="M -5,-20 h 10 v 30 h -10 z" fill="#facc15" />
              <line x1="-1.5" y1="-20" x2="-1.5" y2="10" stroke="#ca8a04" strokeWidth="1" />
              <line x1="1.5" y1="-20" x2="1.5" y2="10" stroke="#ca8a04" strokeWidth="1" />
              {/* Sharp wood tip */}
              <polygon points="-5,10 5,10 0,22" fill="#fed7aa" />
              {/* Graphite point */}
              <polygon points="-2,15 2,15 0,22" fill="#1e293b" />
            </g>

          </g>
        </svg>

        {/* ================= CURSIVE HEADING TEXT "Foundation phase" ================= */}
        {/* Placed at the top precisely like the video overlay with decorative handwriting arcs */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="relative">
            {/* Elegant curved dashed arc indicator above heading */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-48 h-6 border-t-2 border-dashed border-white/50 rounded-full" />
            
            <h2 
              className="text-white text-3xl md:text-4xl font-semibold tracking-wide italic select-none text-center"
              style={{ 
                fontFamily: 'Comic Sans MS, "Chalkboard SE", "Comic Neue", cursive',
                textShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }}
            >
              Foundation phase
            </h2>

            {/* Small sparkle star left and right under text */}
            <span className="absolute -left-6 top-6 text-yellow-300 text-lg animate-ping">★</span>
            <span className="absolute -right-6 top-4 text-yellow-300 text-lg animate-pulse">★</span>
          </div>
        </div>

        {/* ================= LOADING SUBTITLE ================= */}
        {/* At the bottom exactly matching: "EduAI Companion is Loading....." */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center w-full px-4">
          <p 
            className="text-white text-lg md:text-xl font-bold tracking-wider select-none text-center whitespace-nowrap animate-pulse"
            style={{ 
              textShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            EduAI Companion is Loading.....
          </p>

          {/* Simple and elegant percentage loader progress numerical label */}
          <p className="text-white/60 text-xs font-mono tracking-wider mt-1.5 uppercase">
            Consistency unlocks higher badges • {Math.round(progress)}%
          </p>
        </div>

      </div>

      {/* ================= DOLA AI WATERMARK ================= */}
      {/* Placed perfectly on the bottom-right corner as shown in the original video watermark */}
      <div className="absolute bottom-8 right-8 flex flex-col items-end opacity-85 select-none pointer-events-none">
        <span className="text-[10px] font-mono font-medium tracking-widest text-[#5e9cc9] uppercase">Created with</span>
        <div className="text-2xl font-black italic tracking-wide text-white font-sans" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          Dola AI
        </div>
      </div>
    </div>
  );
};
