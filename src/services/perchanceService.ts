/**
 * Perchance AI Image Generator Service — compatibility entry point.
 *
 * The implementation moved to `perchanceClient.ts` when the integration was
 * rebuilt around the user-approved generator https://perchance.org/l62y86k8kq
 * (with the previous generic ai-text-to-image-generator kept as a secondary
 * embed, plus an in-frame DOM driver fallback). This module re-exports the
 * new engine so every existing import path keeps working unchanged.
 */

export {
  PERCHANCE_GENERATOR_NAME,
  PERCHANCE_GENERATOR_URL,
  PERCHANCE_GENERATOR_URL_SECONDARY,
  generatePerchanceImageClient,
} from "./perchanceClient";
