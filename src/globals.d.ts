import type * as Runtime from './runtime-api.js';

declare global {
  type TurboWarpExtension = Runtime.TurboWarpExtension;
  type ScratchTranslate = Runtime.ScratchTranslate;
  type ScratchBlockUtility = Runtime.ScratchBlockUtility;
  type ScratchApi = Runtime.ScratchApi;
  const Scratch: ScratchApi;
}
