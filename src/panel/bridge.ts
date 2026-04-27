import type { UIToolsAPI } from '../shared/api';
import { state } from './state';

export function injectRuntime(callback?: () => void): void {
  fetch(chrome.runtime.getURL('injected.js'))
    .then((r) => r.text())
    .then((code) => {
      chrome.devtools.inspectedWindow.eval(code, (_result, err) => {
        if (err) {
          console.error('UI Tools: runtime injection failed', err);
          return;
        }
        state.runtimeReady = true;
        callback?.();
      });
    });
}

export function call<K extends keyof UIToolsAPI>(
  method: K,
  ...args: Parameters<UIToolsAPI[K]>
): Promise<ReturnType<UIToolsAPI[K]>> {
  const expr = `__UITools.${method}(${args.map((a) => JSON.stringify(a)).join(',')})`;
  return new Promise((resolve, reject) => {
    chrome.devtools.inspectedWindow.eval(expr, (result, exceptionInfo) => {
      if (exceptionInfo) {
        state.runtimeReady = false;
        injectRuntime(() => {
          chrome.devtools.inspectedWindow.eval(expr, (r2, e2) => {
            if (e2) reject(e2);
            else resolve(r2 as ReturnType<UIToolsAPI[K]>);
          });
        });
        return;
      }
      resolve(result as ReturnType<UIToolsAPI[K]>);
    });
  });
}
