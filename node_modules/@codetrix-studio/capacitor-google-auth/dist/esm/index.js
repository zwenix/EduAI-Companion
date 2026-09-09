import { registerPlugin } from '@capacitor/core';
const GoogleAuth = registerPlugin('GoogleAuth', {
    web: () => import('./web').then((m) => new m.GoogleAuthWeb()),
});
export * from './definitions';
export { GoogleAuth };
//# sourceMappingURL=index.js.map