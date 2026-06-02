import React from 'react';

export const SplashScreen = () => {
  return (
    <div
      className="fixed inset-0 z-[100] flex h-screen w-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-500"
      style={{ backgroundColor: '#4f46e5' /* indigo-600 fallback while gradient loads */ }}
    >
      <div className="animate-fadeInZoom text-center">
        <img
          src="https://i.ibb.co/tTc5gG5k/eduai-company-logo2-preview-177246762158%200-2-preview-177247315%203046.png"
          alt="EduAI Companion Logo"
          style={{ width: 'auto', height: '299px' }}
          className="mx-auto drop-shadow-glow"
        />
        <h1 className="text-4xl font-bold text-white mt-6 font-hand">
          EduAI <span className="text-yellow-400">Companion</span>
        </h1>
        <p className="text-lg text-white/70 mt-2 animate-pulse">
          EduAI is Loading...
        </p>
      </div>
    </div>
  );
};
