// ==UserScript==
// @name        nyaa.si
// @namespace   https://skaarup.dev
// @resource    configuration-ui http://localhost:8432/styles/configuration-ui.css
// @resource    nyaa.siOverrides http://localhost:8432/styles/nyaa.si-overrides.css
// #@icon        http://localhost:8432/usericons/nyaa.si-icon.png
// @homepageURL https://skaarup.dev/userscripts
// @updateURL   http://localhost:8432/nyaa.si.user.js
// @downloadURL http://localhost:8432/nyaa.si.user.js
// @match       https://nyaa.si/*
// @grant       none
// @version     1.0
// @author      nws
// @description Nyaa.si features
// @grant       GM_info
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_getResourceText
// @grant       GM_registerMenuCommand
// @grant       GM_notification
// @grant       GM_openInTab
// @inject-into content
// @run-at      document-start
// @noframes
// #@unwrap
// ==/UserScript==

import nws from './nws.lib';

const initScript = () => {
  const debug = (message: unknown) => nws.debug(message, GM_info.script.name);

  const styleResources: manga_reading.resourceType[] = [
    {
      name: 'nyaa.siOverrides',
      data: '',
      urls: ['https://nyaa.si'],
      at: 'site',
      site: 'global',
      shouldLoad: () => true
    }
  ];
  const jsonResources: manga_reading.resourceType[] = [];
  const scriptResources: manga_reading.resourceType[] = [];

  const key = {
    firstRun: 'firstRun',
    dataAttr: 'data-nws-nyaa-si-script'
  };

  const setLocation = (url: string) => {
    (window.location = url as unknown as Location);
  }

  const registerConfig = () => {
    const subContainer = nws.createHTMLElement(
      'div',
      'nws-sub-container-content'
    );
    const title = nws.createHTMLElement(
      'p',
      'nws-current-title nws-border-bottom'
    );
    title.innerText = `${GM_info.script.name} version ${GM_info.script.version} configuration`;
    subContainer.appendChild(title);

    nws.config.register(GM_info, subContainer, () => {
      // callback!
    });
  };

  const siteOverrides = () => {
    debug("Applying site overrides...");
    // site overrides
    document.body.classList.add('dark');
    debug("Applied site overrides.");
  };

  const shortcutHelpers = nws.shortcut.helpers;

  let current: HTMLTableRowElement;

  const getFirstRow = () => {
    const rows = document.querySelectorAll(
      'table.table.table-bordered.table-hover.table-striped.torrent-list > tbody > tr'
    );
    return rows[0] as HTMLTableRowElement;
  };

  const getRow = (direction: 'up' | 'down') => {
    let row: HTMLTableRowElement = current;
    if (!row) {
      row = getFirstRow();
      return row;
    }
    row.classList.remove('nws-selected-row');
    if (direction === 'up') {
      row = row.previousElementSibling as HTMLTableRowElement;
    }
    if (direction === 'down') {
      row = row.nextElementSibling as HTMLTableRowElement;
    }
    if (!row) {
      row = current;
    }
    row.classList.add('nws-selected-row');
    row.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    window.getSelection()?.removeAllRanges();
    return row;
  };

  const configClosedShortcuts = (e: KeyboardEvent): boolean => {
    switch (true) {
      case e.code === 'ArrowLeft' && shortcutHelpers.shiftModifier(e):
        e.preventDefault();
        if (
          !document
            .querySelector('nav > ul.pagination > li:first-child > a')
            ?.classList.contains('disabled')
        ) {
          setLocation(
            (
              document.querySelector(
                'nav > ul.pagination > li:first-child > a'
              ) as HTMLAnchorElement
            ).href
          );
        }
        debug('ArrowLeft');
        return true;
      case e.code === 'ArrowRight' && shortcutHelpers.shiftModifier(e):
        e.preventDefault();
        if (
          !document
            .querySelector('nav > ul.pagination > li:last-child > a')
            ?.classList.contains('disabled')
        ) {
          setLocation(
            (
              document.querySelector(
                'nav > ul.pagination > li:last-child > a'
              ) as HTMLAnchorElement
            ).href
          );
        }
        debug('ArrowRight');
        return true;
      case e.code === 'ArrowUp' && shortcutHelpers.shiftModifier(e):
        e.preventDefault();
        debug('ArrowUp');
        current = getRow('up');
        return true;
      case e.code === 'ArrowDown' && shortcutHelpers.shiftModifier(e):
        e.preventDefault();
        debug('ArrowDown');
        current = getRow('down');
        return true;
      case e.code === 'Enter' && shortcutHelpers.shiftModifier(e):
        e.preventDefault();
        debug('Enter');
        return true;
    }

    return false;
  };

  const registerResources = async () => {
    nws.resources.register('stylesheets', ...styleResources);
    nws.resources.register('json', ...jsonResources);
    nws.resources.register('scripts', ...scriptResources);
  };

  const registerKeyUps = () => {
    const namePrefix = GM_info.script.name;
    nws.shortcut.keyUp.register('ConfigClosed', {
      name: `${namePrefix} - config closed`,
      callback: configClosedShortcuts
    });
  };

  const checkFirstRun = () => {
    debug('First run check...');
    const firstRun = GM_getValue<boolean>(key.firstRun, true);

    if (firstRun) {
      debug('First run detected.');
      GM_setValue(key.firstRun, false);

      GM_notification(
        'First run setup complete',
        `NWS - ${GM_info.script.name}`
      );
    }
    debug('First run checked.');
  };

  const onInit = async () => {
    console.log(`NWS - ${GM_info.script.name} - Loading...`);
    checkFirstRun();
    registerKeyUps();
    siteOverrides();
    console.log(`NWS - ${GM_info.script.name} - Loaded.`);
  };

  registerConfig();
  registerResources();
  nws.init(onInit);
};

initScript();
