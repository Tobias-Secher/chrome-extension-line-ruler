import { state } from './state.js';

const INJECTED_MODULES = [
  'src/injected/constants.js',
  'src/injected/rulers.js',
  'src/injected/guides.js',
  'src/injected/boxes.js',
  'src/injected/crosshair.js',
  'src/injected/overlays.js',
  'src/injected/inspect.js',
  'src/injected/api.js',
];

export function injectRuntime(callback) {
  Promise.all(
    INJECTED_MODULES.map(function (m) {
      return fetch(chrome.runtime.getURL(m)).then(function (r) { return r.text(); });
    })
  ).then(function (scripts) {
    var code = "(function(){\n'use strict';\n" + scripts.join('\n') + '\n})();';
    chrome.devtools.inspectedWindow.eval(code, function (result, err) {
      if (err) {
        console.error('UI Tools: runtime injection failed', err);
        return;
      }
      state.runtimeReady = true;
      if (callback) callback();
    });
  });
}

export function evalInPage(expression, callback) {
  chrome.devtools.inspectedWindow.eval(expression, function (result, exceptionInfo) {
    if (exceptionInfo) {
      state.runtimeReady = false;
      injectRuntime(function () {
        chrome.devtools.inspectedWindow.eval(expression, function (result2, err2) {
          if (!err2 && callback) callback(result2);
        });
      });
      return;
    }
    if (callback) callback(result);
  });
}
