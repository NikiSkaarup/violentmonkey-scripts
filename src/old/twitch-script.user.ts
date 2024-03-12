// ==UserScript==
// @name        Click the claim button - twitch.tv
// @namespace   nwsScripts
// @match       https://www.twitch.tv/*
// @version     1.0
// @author      nws
// @run-at      document-end
// @grant       none
// @description remove distractions
// @updateURL   http://localhost:8432/twitch-script.user.js
// @downloadURL http://localhost:8432/twitch-script.user.js
// ==/UserScript==

// biome-ignore lint/suspicious/noRedundantUseStrict: ... I want to use strict mode
'use strict';

const twitchFix = () => {
  const onReady = async () => {
    setInterval(() => {
      const button = document.querySelector<HTMLButtonElement>('button[aria-label="Claim Bonus"]');
      if (button) setTimeout(() => button.click(), Math.random() * 900);
    }, 1000);
  }

  const ready = async () => {
    if (document.readyState !== 'complete') {
      setTimeout(ready, 50);
      return;
    }
    await onReady();
  }
  ready();
}
twitchFix();
