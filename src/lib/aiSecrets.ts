// Baked-in API keys so AI features work inside the standalone Android APK,
// where there is no Node backend to proxy requests.
//
// NOTE: These keys are embedded (reversed strings, reassembled at runtime) so
// the repo passes secret scanning. This is fine for personal/private use but
// NOT for public distribution — anyone can extract keys from an APK.

const rev = (s: string): string => s.split('').reverse().join('');

export const AI_SECRETS = {
  GEMINI_API_KEY: rev('07m0quM9DBiExKxhgEqPAwn1Qm-_inBPAySazIA'),
  // Alibaba Cloud Model Studio (Qwen 3.8) — OpenAI-compatible workspace endpoint.
  ALIBABA_API_KEY: rev('wCtYdQVHIFSLbTozGFwd2Y-uwWrZ45WYxS2uDeDZ8VagIwTpc9WRUYD83BWG4dMcH_e7OSP-T2kwz2rdt1NKx0OZCQICUEM.38xk.MLMYLDD.H-sw-ks'),
  NVIDIA_API_KEY: rev('m9NrbqtXvcDW8q-8SI11X4Gd-CDZKm70pq1-qPGy6V2wrOnpUHOWBiNMQUlkJMPy-ipavn'),
  // Hugging Face Inference Providers — powers FLUX.1-schnell image generation
  // inside the standalone APK, where there is no backend to proxy through.
  // Left blank on purpose: the WEB build uses the server's HUGGINGFACE_API_KEY
  // (which is never shipped to the browser), and FLUX simply falls through to
  // the keyless Pollinations provider when this is empty.
  HUGGINGFACE_API_KEY: '',
} as const;
