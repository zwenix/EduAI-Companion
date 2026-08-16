// Android hardware / gesture back button handling.
//
// Without this, Capacitor's default behaviour on Android is to close the app on
// the very first back press, because the WebView has no history entries to pop.
// Here we take over the event entirely and route it into the app's own
// navigation, only exiting from the home screen after a confirmation press.

import { useEffect, useRef } from 'react';
import { isNativeApp } from './platform';

export type BackHandler = () => boolean | Promise<boolean>;

/**
 * @param handler Called on every back press. Return `true` if the press was
 *   consumed (a panel closed, a screen navigated). Return `false` when there is
 *   nowhere left to go — the app then asks for a confirming second press before
 *   exiting.
 * @param onConfirmExit Optional UI hook (toast) shown on the first "nowhere left
 *   to go" press.
 */
export function useAndroidBackButton(handler: BackHandler, onConfirmExit?: () => void) {
  const handlerRef = useRef(handler);
  const confirmRef = useRef(onConfirmExit);
  handlerRef.current = handler;
  confirmRef.current = onConfirmExit;

  useEffect(() => {
    if (!isNativeApp()) return;

    let removeListener: (() => void) | undefined;
    let disposed = false;
    let lastBackPress = 0;

    (async () => {
      try {
        const { App } = await import('@capacitor/app');

        const listener = await App.addListener('backButton', async () => {
          let consumed = false;
          try {
            consumed = await handlerRef.current();
          } catch (err) {
            console.warn('[BackButton] handler threw, treating as unhandled:', err);
          }

          if (consumed) {
            lastBackPress = 0;
            return;
          }

          // Root screen: require a double press within 2s before exiting so a
          // stray tap never drops the user out of the app.
          const now = Date.now();
          if (now - lastBackPress < 2000) {
            App.exitApp();
            return;
          }
          lastBackPress = now;
          confirmRef.current?.();
        });

        if (disposed) {
          listener.remove();
        } else {
          removeListener = () => listener.remove();
        }
      } catch (err) {
        console.warn('[BackButton] @capacitor/app unavailable:', err);
      }
    })();

    return () => {
      disposed = true;
      removeListener?.();
    };
  }, []);
}
