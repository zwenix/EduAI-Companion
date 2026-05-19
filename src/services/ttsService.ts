import { TTSProvider } from '../contexts/AiContext';
import * as googleTTS from 'google-tts-api';

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let isAudioPaused = false;
let audioQueue: string[] = [];

export const speakText = async (text: string, provider: TTSProvider, language: string = 'en', voice: string = '21m00Tcm4TlvDq8ikWAM'): Promise<void> => {
  stopSpeaking(); // Stop any currently playing audio

  if (provider === 'elevenlabs') {
    try {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      if (!apiKey) {
         console.warn('VITE_ELEVENLABS_API_KEY is missing. Falling back to Google TTS API.');
         return await speakWithGoogle(text, language);
      }

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
        method: 'POST',
        headers: {
          'accept': 'audio/mpeg',
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      if (!response.ok) {
        let errData = 'Unknown error';
        try {
          const json = await response.json();
          errData = json.detail?.message || json.detail || JSON.stringify(json);
        } catch(e) { }
        throw new Error(`ElevenLabs API error (${response.status}): ${errData}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudio = audio;
      
      return new Promise((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play();
      });

    } catch (error) {
      console.error('ElevenLabs TTS failed:', error);
      return await speakWithGoogle(text, language);
    }
  } else {
    return await speakWithGoogle(text, language);
  }
};

const getLangCode = (language: string) => {
  if (language.toLowerCase().includes('afrikaans') || language === 'af') return 'af';
  if (language.toLowerCase().includes('zulu') || language === 'zu') return 'zu';
  if (language.toLowerCase().includes('xhosa') || language === 'xh') return 'xh';
  if (language.toLowerCase().includes('sesotho') || language === 'st') return 'st';
  if (language.toLowerCase().includes('spanish')) return 'es';
  if (language.toLowerCase().includes('french')) return 'fr';
  if (language.toLowerCase().includes('german')) return 'de';
  return 'en-ZA';
};

export const speakWithGoogle = async (text: string, language: string): Promise<void> => {
  return new Promise((resolve) => {
    let cleanText = text.replace(/[*_#`~>|-]/g, '');
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); 
    cleanText = cleanText.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
    if (!cleanText.trim()) return resolve();
    
    try {
      const code = getLangCode(language);
      const urls = googleTTS.getAllAudioUrls(cleanText, { lang: code, slow: false, splitPunct: ',.?!' });
      audioQueue = urls.map(u => u.url);
      
      const playNext = () => {
        if (audioQueue.length === 0) return resolve();
        const nextUrl = audioQueue.shift();
        if (!nextUrl) return resolve();
        
        currentAudio = new Audio(nextUrl);
        currentAudio.onended = () => playNext();
        currentAudio.onerror = () => {
          console.error("Google TTS audio playback failed");
          resolve(); 
        };
        currentAudio.play();
      };
      
      playNext();
    } catch (err) {
      console.error('Google TTS error:', err);
      speakWithBrowser(text, language).then(resolve);
    }
  });
};

export const speakWithBrowser = (text: string, language: string): Promise<void> => {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    
    let cleanText = text.replace(/[*_#`~>|-]/g, '');
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); 
    cleanText = cleanText.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.volume = 1;
    utterance.rate = 0.95;
    
    const code = getLangCode(language);
    utterance.lang = code === 'en' ? 'en-US' : (code.length === 2 ? `${code}-${code.toUpperCase()}` : code);

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
  
    const setupVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find(v => v.lang.startsWith(code) || v.lang.startsWith(utterance.lang.split('-')[0]));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    };
  
    if (window.speechSynthesis.getVoices().length > 0) {
      setupVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => setupVoice();
      setTimeout(() => { if (!currentUtterance) setupVoice(); }, 500);
    }
  });
};

export const pauseSpeaking = () => {
  if (currentAudio) {
    currentAudio.pause();
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
};

export const stopSpeaking = () => {
  audioQueue = [];
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
};

export const resumeSpeaking = () => {
  if (currentAudio) {
    currentAudio.play();
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
};
