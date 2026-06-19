import { TTSProvider } from '../contexts/AiContext';


let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let isAudioPaused = false;
let audioQueue: string[] = [];

/**
 * Sanitizes markdown, HTML, code fragments, table styling, and helper formatting
 * to convert the input into screen-reader friendly plain text narration.
 */
export const cleanTextForSpeech = (text: string): string => {
  if (!text) return '';
  
  let clean = text;

  // 1. Remove HTML and CSS comments completely
  clean = clean.replace(/<!--[\s\S]*?-->/g, ' ');
  clean = clean.replace(/\/\*[\s\S]*?\*\//g, ' ');

  // 2. Remove <style> ... </style> blocks and all content inside them
  clean = clean.replace(/<style[\s\S]*?<\/style>/gi, ' ');

  // 3. Remove <script> ... </script> blocks and all content inside them
  clean = clean.replace(/<script[\s\S]*?<\/script>/gi, ' ');

  // 4. Remove code blocks completely (e.g. ```javascript ... ```) as they are unreadable
  clean = clean.replace(/```[\s\S]*?```/g, ' ');

  // 5. Remove inline code highlights (e.g. `const x = 5` -> const x = 5)
  clean = clean.replace(/`([^`]+)`/g, '$1');

  // 6. Remove dynamic and visual layout tags/instructions or brackets (e.g. [Illustration: ...])
  clean = clean.replace(/\[\s*(Illustration|Style|Color|Layout|Background|Font|Image|Theme)[^\]]*\]/gi, ' ');
  clean = clean.replace(/\[[^\]]{1,100}\]/g, ' '); // general safety for brackets containing style/meta annotations up to 100 chars

  // 7. Remove hex color codes (e.g. #FFFFFF or #123456)
  clean = clean.replace(/#[0-9a-fA-F]{6}\b/g, ' ');
  clean = clean.replace(/#[0-9a-fA-F]{3}\b/g, ' ');

  // 8. Replace common CSS properties text if printed/leaked
  clean = clean.replace(/\b(color|background|font-family|font-size|font-weight|text-align|border|padding|margin|display|flex|grid|justify-content|align-items|height|width|line-height|text-decoration|text-transform|position|top|left|right|bottom|z-index|opacity|box-shadow|border-radius)\s*:[^;]+;/gi, ' ');

  // 9. Remove all HTML tags completely (like <span style="..."> or <font color="...">)
  clean = clean.replace(/<\/?[^>]+(>|$)/g, ' ');

  // 10. Remove Markdown image links: ![alt text](url)
  clean = clean.replace(/!\[[^\]]*\]\([^)]+\)/g, ' ');

  // 11. Convert Markdown links: [Link Name](url) -> Link Name
  clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 12. Handle Markdown table formatting elements:
  // - Remove lines that are just dashes/pipes (table divider rows like |---|---|)
  clean = clean.replace(/^[|:\s-]+\|[\s|:-]*$/gm, ' ');
  // - Clean table pipes | by replacing them with space
  clean = clean.replace(/\|/g, ' ');

  // 13. Remove other common Markdown structure characters, but leave sentence structure intact:
  // - Remove Asterisks (**bold**, *italic*)
  clean = clean.replace(/\*+/g, '');
  // - Remove Underscores (__bold__, _italic_)
  clean = clean.replace(/_+/g, '');
  // - Remove Strike-through: ~~strike~~
  clean = clean.replace(/~~/g, '');
  // - Remove Heading hashes at start of lines, e.g. #, ##, ###
  clean = clean.replace(/^[#\s]+/gm, '');
  // - Remove blockquote indicators at start of lines, e.g. > Space
  clean = clean.replace(/^>\s*/gm, '');
  // - Remove list dashes/asterisks/plus at start of lines, e.g. - list or * list, but keep numbers
  clean = clean.replace(/^[\s]*[-*+]\s+/gm, ' ');

  // 14. Strip any dangling curly braces/styles braces
  clean = clean.replace(/[{}]/g, ' ');

  // 15. Replace HTML entities with clean spoken equivalents
  const entities: { [key: string]: string } = {
    '&nbsp;': ' ',
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': 'and',
    '&quot;': '"',
    '&apos;': "'",
    '#': ' ',
  };
  Object.keys(entities).forEach(entity => {
    clean = clean.replaceAll(entity, entities[entity]);
  });

  // 16. Minimize multiple spaces/newlines to a single space, stripping extra leading/trailing whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
};

export const speakText = async (text: string, provider: TTSProvider, language: string = 'en', voice: string = '21m00Tcm4TlvDq8ikWAM'): Promise<void> => {
  stopSpeaking(); // Stop any currently playing audio

  if (localStorage.getItem('eduai_sound_muted') === 'true') {
    return;
  }

  const sanitizedText = cleanTextForSpeech(text);
  if (!sanitizedText.trim()) return;

  if (provider === 'groq-whisper') {
    try {
      console.info("Groq's whisper-large-v3-turbo selected. (Whisper is an ASR transcription model; utilizing high-quality Google TTS/Browser Core fallback for vocal synthesis output).");
      return await speakWithGoogle(sanitizedText, language);
    } catch (error) {
      console.error('Groq whisper TTS fallback failed:', error);
      return await speakWithBrowser(sanitizedText, language);
    }
  } else if (provider === 'huggingface') {
    return await speakWithHuggingFace(sanitizedText, language);
  } else if (provider === 'google-tts') {
    return await speakWithGoogle(sanitizedText, language);
  } else {
    // browser falls back to browser synthesis
    return await speakWithBrowser(sanitizedText, language);
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

    const cleanText = cleanTextForSpeech(text);
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
    const cleanText = cleanTextForSpeech(text);
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
    
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText.trim()) return resolve();
    
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
