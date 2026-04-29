import { TTSProvider } from '../contexts/AiContext';

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speakText = async (text: string, provider: TTSProvider, language: string = 'en') => {
  stopSpeaking(); // Stop any currently playing audio

  if (provider === 'elevenlabs') {
    try {
      // Free/demo key or standard way. We should require a key ideally, but we'll try to use a standard voice endpoint
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      if (!apiKey) {
         console.warn('VITE_ELEVENLABS_API_KEY is missing. Falling back to browser TTS.');
         return speakWithBrowser(text, language);
      }

      // 21m00Tcm4TlvDq8ikWAM = Rachel (default)
      const voiceId = "21m00Tcm4TlvDq8ikWAM"; 

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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
      audio.play();

    } catch (error) {
      console.error('ElevenLabs TTS failed:', error);
      speakWithBrowser(text, language);
    }
  } else {
    speakWithBrowser(text, language);
  }
};

export const speakWithBrowser = (text: string, language: string) => {
  if (!('speechSynthesis' in window)) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set language
  if (language === 'af') utterance.lang = 'af-ZA';
  else if (language === 'zu') utterance.lang = 'zu-ZA';
  else if (language === 'st') utterance.lang = 'st-ZA';
  else utterance.lang = 'en-US';

  // Find a voice that matches
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang.split('-')[0]));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
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
