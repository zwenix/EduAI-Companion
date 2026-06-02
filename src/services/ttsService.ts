import { TTSProvider } from '../contexts/AiContext';


let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let isAudioPaused = false;
let audioQueue: string[] = [];

export const speakText = async (text: string, provider: TTSProvider, language: string = 'en', voice: string = '21m00Tcm4TlvDq8ikWAM'): Promise<void> => {
  stopSpeaking(); // Stop any currently playing audio

  if (localStorage.getItem('eduai_sound_muted') === 'true') {
    return;
  }

  if (provider === 'groq-whisper') {
    try {
      console.info("Groq's whisper-large-v3-turbo selected. (Whisper is an ASR transcription model; utilizing high-quality Google TTS/Browser Core fallback for vocal synthesis output).");
      return await speakWithGoogle(text, language);
    } catch (error) {
      console.error('Groq whisper TTS fallback failed:', error);
      return await speakWithBrowser(text, language);
    }
  } else if (provider === 'huggingface') {
    return await speakWithHuggingFace(text, language);
  } else if (provider === 'google-tts') {
    return await speakWithGoogle(text, language);
  } else {
    // browser falls back to browser synthesis
    return await speakWithBrowser(text, language);
  }
};

const getLangCode = (language: string): string => {
  if (language.toLowerCase().includes('afrikaans') || language === 'af') return 'af';
  if (language.toLowerCase().includes('zulu') || language === 'zu') return 'zu';
  if (language.toLowerCase().includes('xhosa') || language === 'xh') return 'xh';
  if (language.toLowerCase().includes('sesotho') || language === 'st') return 'st';
  if (language.toLowerCase().includes('spanish')) return 'es';
  if (language.toLowerCase().includes('french')) return 'fr';
  if (language.toLowerCase().includes('german')) return 'de';
  return 'en';
};

export const speakWithHuggingFace = async (text: string, language: string): Promise<void> => {
  try {
    const code = getLangCode(language);
    let model = 'facebook/mms-tts-eng';
    if (code === 'zu') model = 'facebook/mms-tts-zul';
    else if (code === 'xh') model = 'facebook/mms-tts-xho';
    else if (code === 'af') model = 'facebook/mms-tts-afr';
    else if (code === 'st') model = 'facebook/mms-tts-sot';
    else if (code === 'es') model = 'facebook/mms-tts-spa';
    else if (code === 'fr') model = 'facebook/mms-tts-fra';
    else if (code === 'de') model = 'facebook/mms-tts-deu';
    
    // Some models like espnet/kan-bayashi_ljspeech_vits are better for English 
    if (code === 'en') model = 'espnet/kan-bayashi_ljspeech_vits';

    const cleanText = text.replace(/[*_#`~>|-]/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/!\[[^\]]*\]\([^)]+\)/g, '');
    if (!cleanText.trim()) return;

    // Split text into chunks because HF inference API limits length
    const chunks = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    
    return new Promise(async (resolve) => {
      audioQueue = [];
      let fetchPromises = [];

      for (let chunk of chunks) {
        if (!chunk.trim()) continue;
        fetchPromises.push(
          fetch('/api/tts/hf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: chunk.trim(), model })
          }).then(res => {
            if (!res.ok) throw new Error("HF TTS Failed");
            return res.json();
          }).then(data => {
            if (data.error) throw new Error(data.error);
            return data.audio;
          })
        );
      }

      try {
        const urls = await Promise.all(fetchPromises);
        audioQueue = urls;

        const playNext = () => {
          if (audioQueue.length === 0) return resolve();
          const nextUrl = audioQueue.shift();
          if (!nextUrl) return resolve();
          
          currentAudio = new Audio(nextUrl);
          currentAudio.onended = () => playNext();
          currentAudio.onerror = () => {
            console.warn("HF Audio play error, falling back to Google TTS");
            speakWithGoogle(text, language).then(resolve);
          };
          const playPromise = currentAudio.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.warn("HF Audio play rejected, falling back to Google TTS", err);
              speakWithGoogle(text, language).then(resolve);
            });
          }
        };
        playNext();
      } catch (err) {
        console.error("HuggingFace TTS error", err);
        return await speakWithGoogle(text, language).then(resolve);
      }
    });
  } catch (error) {
    console.error('Hugging Face inference error:', error);
    return await speakWithGoogle(text, language);
  }
};

export const speakWithGoogle = async (text: string, language: string): Promise<void> => {
  return new Promise((resolve) => {
    let cleanText = text.replace(/[*_#`~>|-]/g, '');
    cleanText = cleanText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); 
    cleanText = cleanText.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
    if (!cleanText.trim()) return resolve();
    
    const run = async () => {
      try {
        const code = getLangCode(language);
        const res = await fetch('/api/tts/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: cleanText, lang: code })
        });
        
        if (!res.ok) throw new Error("Google TTS proxy failed");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        
        audioQueue = data.urls;
        
        const playNext = () => {
          if (audioQueue.length === 0) return resolve();
          const nextUrl = audioQueue.shift();
          if (!nextUrl) return resolve();
          
          currentAudio = new Audio(nextUrl);
          currentAudio.onended = () => playNext();
          currentAudio.onerror = () => {
            console.warn("Google TTS audio playback failed, falling back to browser speech synthesis");
            speakWithBrowser(text, language).then(resolve);
          };
          const playPromise = currentAudio.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              console.warn("Google TTS play rejected, falling back to browser speech synthesis", err);
              speakWithBrowser(text, language).then(resolve);
            });
          }
        };
        
        playNext();
      } catch (err) {
        console.error('Google TTS error:', err);
        speakWithBrowser(text, language).then(resolve);
      }
    };
    run();
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
