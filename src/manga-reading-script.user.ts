// ==UserScript==
// @name        manga reading script
// @namespace   https://skaarup.dev
// @resource    configuration-ui http://localhost:8432/styles/configuration-ui.css
// @resource    manganatoOverrides http://localhost:8432/styles/manganato-overrides.css
// @resource    manganatoOverridesNeither http://localhost:8432/styles/manganato-overrides-neither.css
// @resource    manganatoOverridesChapter http://localhost:8432/styles/manganato-overrides-chapter.css
// @resource    manganatoOverridesManga http://localhost:8432/styles/manganato-overrides-manga.css
// @resource    manganatoOverridesChapterOrManga http://localhost:8432/styles/manganato-overrides-chapter-or-manga.css
// #@icon        http://localhost:8432/usericons/manga-reading-script-icon.png
// @homepageURL https://skaarup.dev/userscripts
// @updateURL   http://localhost:8432/manga-reading-script.user.js
// @downloadURL http://localhost:8432/manga-reading-script.user.js
// @match       https://manganelo.com/*
// @match       https://readmanganato.com/*
// @match       https://readmanganato.com/*
// @match       https://manganato.com/*
// @grant       none
// @version     1.0
// @author      nws
// @description Adds nearly complete keyboard navigation and cleans up the user interface of manganato
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

/*
  TODO: store data in json, for more customization per manga.
*/

import nws from './nws.lib';

const mangaReadingScript = () => {
  const debug = (message: unknown) => nws.debug(message, GM_info.script.name);

  const globals: manga_reading.globalsType = {
    nextUrl: '',
    prevUrl: '',
    currentTitle: '',
    uiInitialized: false,
    currentSite: {
      name: 'None',
      urls: ['https://example.com'],
      at: 'neither',
      active: false,
      activeRegex: RegExp(''),
      atChapterRegex: RegExp(''),
      atMangaRegex: RegExp(''),
      titleLinkSelector: '',
      nextChapterSelector: '',
      prevChapterSelector: '',
    },
    titleList: [],
    sites: {
      manganato: {
        name: 'manganato',
        urls: ['https://readmanganato.com', 'https://manganato.com'],
        active: false,
        at: 'neither',
        activeRegex: /https:\/\/(?:read)?manganato\.com\S*/,
        atChapterRegex: /https:\/\/(?:read)?manganato.com\/manga-[\w.\-~%]+\/chapter-[\d.-]+/,
        atMangaRegex: /https:\/\/(?:read)?manganato.com\/manga-[\w.\-~%]+$/,
        titleLinkSelector: '.panel-breadcrumb > a:nth-child(3)',
        nextChapterSelector: 'a.navi-change-chapter-btn-next.a-h',
        prevChapterSelector: 'a.navi-change-chapter-btn-prev.a-h',
      },
      manganelo: {
        name: 'manganelo',
        urls: ['https://manganelo.com'],
        active: false,
        at: 'neither',
        activeRegex: /https:\/\/manganelo\.com\S*/,
        atChapterRegex: /https:\/\/(?:manganelo\.com)\/chapter\/[\w.\-~%]+\/[\w.\-~%]+/,
        atMangaRegex: /https:\/\/(?:manganelo\.com)\/(?:manga\/[\w.\-~%]+|read-[\w.\-~%]+)/,
        titleLinkSelector: '.panel-breadcrumb > a:nth-child(3)',
        nextChapterSelector: 'a.navi-change-chapter-btn-next.a-h',
        prevChapterSelector: 'a.navi-change-chapter-btn-prev.a-h',
      },
    },
  };

  const shouldLoad = (resource: resource) => {
    let loadResource = resource.at === 'universal'
      || resource.urls.find((url) => window.location.href.includes(url)) !== undefined;

    if (loadResource) {
      switch (resource.site) {
        case 'global':
          loadResource = true;
          break;
        case 'manga':
          loadResource = atManga();
          break;
        case 'chapter':
          loadResource = atChapter();
          break;
        case 'chapterOrManga':
          loadResource = atChapterOrManga();
          break;
        case 'neither':
          loadResource = atNeither();
          break;
        default:
          loadResource = false;
      }
    }
    return loadResource;
  }

  const styleResources: manga_reading.resourceType[] = [
    {
      name: 'manganatoOverrides',
      data: '',
      urls: ['https://readmanganato.com', 'https://manganato.com'],
      at: 'site',
      site: 'global',
      shouldLoad: shouldLoad,
    },
    {
      name: 'manganatoOverridesNeither',
      data: '',
      urls: ['https://readmanganato.com', 'https://manganato.com'],
      at: 'site',
      site: 'neither',
      shouldLoad: shouldLoad,
    },
    {
      name: 'manganatoOverridesChapter',
      data: '',
      urls: ['https://readmanganato.com', 'https://manganato.com'],
      at: 'site',
      site: 'chapter',
      shouldLoad: shouldLoad,
    },
    {
      name: 'manganatoOverridesManga',
      data: '',
      urls: ['https://readmanganato.com', 'https://manganato.com'],
      at: 'site',
      site: 'manga',
      shouldLoad: shouldLoad,
    },
    {
      name: 'manganatoOverridesChapterOrManga',
      data: '',
      urls: ['https://readmanganato.com', 'https://manganato.com'],
      at: 'site',
      site: 'chapterOrManga',
      shouldLoad: shouldLoad,
    },
  ];
  const jsonResources: manga_reading.resourceType[] = [];
  const scriptResources: manga_reading.resourceType[] = [];

  const defaults: { titleList: string[] } = {
    titleList: [],
  };

  const key = {
    firstRun: 'firstRun',
    titleList: 'titleList',
    dataAttr: 'data-nws-manga-reading-script',
  }

  const ui = {
    titleList: document.createElement('textarea'),
    subTitle: document.createElement('p'),
  };

  const escapeRegExp = (input: string) => input.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
  const setLocation = (url: string) => window.location = url as unknown as Location;
  const setTitleList = () => ui.titleList.value = globals.titleList.join('\r\n');
  const atNeither = () => globals.currentSite.at === 'neither';
  const atChapter = () => globals.currentSite.at === 'chapter';
  const atManga = () => globals.currentSite.at === 'manga';
  const atChapterOrManga = () => atChapter() || atManga();
  const getChapterList = () => document.querySelector('div.panel-story-chapter-list > ul.row-content-chapter') as HTMLElement;

  const setStyle = (array: NodeListOf<HTMLElement>, style: string, value: string) => {
    const arr = [...array];
    for (const item of arr) {
      (item.style as unknown as stringKeyedObject)[style] = value;
    }
  };

  const resize = () => {
    if (!globals.sites.manganato.active || !atChapter()) return;

    const title = 'Image Width / %';
    const height = "'auto h' to fit images to page height,";
    const width = "'auto w' to fit images to page width.";
    const inp = prompt(`${title}\n${height}\n${width}`);
    const input = inp?.valueOf().toLowerCase();
    if (input === null || input === "0") return;

    const pageWidth = document.body.clientWidth;
    const images = document.querySelectorAll('.container-chapter-reader img') as NodeListOf<HTMLImageElement>;

    if (input === 'auto w' || input === 'w') {
      images.forEach(image => image.style.width = pageWidth / image.width * 100 + '%');
    } else if (input === 'auto h' || input === 'h') {
      for (const image of images) {
        image.style.width = pageWidth / image.width * 100 + '%';
        image.style.width = window.visualViewport.height / image.height * 100 + '%';
      }
    } else {
      images.forEach(image => image.style.width = input + '%');
    }
  }

  const setSubTitle = () => {
    const titleText = atChapterOrManga() ? globals.currentTitle : 'No title';
    ui.subTitle.innerText = `Current Title(affected by buttons): ${titleText}`;
  }

  const registerConfig = () => {
    const subContainer = nws.createHTMLElement('div', 'nws-sub-container-content');
    const title = nws.createHTMLElement('p', 'nws-current-title nws-border-bottom nws-padding-bottom');
    title.innerText = `${GM_info.script.name} version ${GM_info.script.version} configuration`;
    subContainer.appendChild(title);
    ui.subTitle = nws.createElement<HTMLParagraphElement>('p', 'nws-current-title nws-padding-top nws-padding-bottom');
    setSubTitle();
    subContainer.appendChild(ui.subTitle);

    const titleListFormGroup = nws.createHTMLElement('div', 'nws-form-group nws-form-group-horizontal');
    subContainer.appendChild(titleListFormGroup);
    const label = nws.createElement<HTMLLabelElement>('label', 'nws-label');
    label.innerText = 'Titles to remove gaps from:';
    label.htmlFor = key.titleList;
    ui.titleList = nws.createElement<HTMLTextAreaElement>('textarea', 'nws-textarea nws-title-list');
    ui.titleList.id = key.titleList;
    ui.titleList.value = globals.titleList.join('\r\n');
    ui.titleList.rows = 12;
    titleListFormGroup.appendChild(label);
    titleListFormGroup.appendChild(ui.titleList);

    const divButtons = nws.createHTMLElement('div', 'nws-buttons-container nws-space-between nws-padding-bottom');
    subContainer.appendChild(divButtons);

    const btnRemove = nws.createElement<HTMLButtonElement>('button', 'nws-button nws-remove');
    btnRemove.innerText = 'Remove Current Title';
    btnRemove.onclick = removeTitle;
    btnRemove.disabled = atNeither();
    divButtons.appendChild(btnRemove);

    const btnAdd = nws.createElement<HTMLButtonElement>('button', 'nws-button nws-add');
    btnAdd.innerText = 'Add Current Title';
    btnAdd.onclick = addTitle;
    btnAdd.disabled = atNeither();
    divButtons.appendChild(btnAdd);

    const divSubButtons = nws.createHTMLElement('div', 'nws-sub-buttons-container');
    divButtons.appendChild(divSubButtons);

    const btnReset = nws.createElement<HTMLButtonElement>('button', 'nws-button nws-cancel');
    btnReset.innerText = 'Reset';
    btnReset.onclick = () => ui.titleList.value = globals.titleList.join('\r\n');
    divSubButtons.appendChild(btnReset);

    const btnSave = nws.createElement<HTMLButtonElement>('button', 'nws-button nws-save');
    btnSave.innerText = 'Save';
    btnSave.onclick = saveTitles;
    divSubButtons.appendChild(btnSave);

    nws.config.register(GM_info, subContainer, () => {
      setTitleList();
      btnRemove.disabled = atNeither();
      btnAdd.disabled = atNeither();
    });
  }

  const addTitle = () => {
    const trimmedValue = ui.titleList.value.trim();
    const taTitleListValue = trimmedValue.split(/\r?\n/);
    const includes = taTitleListValue.includes(globals.currentTitle)
    if (includes) return;

    const curTAVal = trimmedValue.length > 0 ? trimmedValue + '\r\n' : '';
    ui.titleList.value = curTAVal + globals.currentTitle;
  }

  const saveTitles = () => {
    globals.titleList = [...new Set(ui.titleList.value.trim().split(/\r?\n/).sort())];
    GM_setValue(key.titleList, JSON.stringify(globals.titleList));
    if (atChapter()) removeMargins();
  }

  const removeTitle = () => {
    const curTAVal = ui.titleList.value.trim();
    const regex = new RegExp(escapeRegExp(globals.currentTitle) + '\\r?\\n?', 'gi');
    ui.titleList.value = curTAVal.replace(regex, '');
  }

  const goToFirstChapter = () => {
    if (!globals.sites.manganato.active) return;
    const firstChapter = getChapterList().lastElementChild as HTMLElement;
    const firstChapterLink = firstChapter.querySelector('a.chapter-name') as HTMLAnchorElement | undefined;
    if (firstChapterLink) setLocation(firstChapterLink.href);
  };

  const goToLatestChapter = () => {
    if (!globals.sites.manganato.active) return;
    const latestChapter = getChapterList().firstElementChild as HTMLElement;
    const latestChapterLink = latestChapter.querySelector('.chapter-name') as HTMLAnchorElement | undefined;
    if (latestChapterLink) setLocation(latestChapterLink.href);
  };

  const removeMargins = () => {
    if (!atChapter()) return;
    let margin = '5px auto 0';
    if (globals.titleList.includes(globals.currentTitle)) {
      margin = '0 auto';
      setStyle(document.querySelectorAll('.container-chapter-reader > div'), 'display', 'none');
    }
    setStyle(document.querySelectorAll('.container-chapter-reader img'), 'margin', margin);
  }

  const findUrls = () => {
    debug('Finding URLs...');
    const titleLink = document.querySelector<HTMLAnchorElement>(globals.currentSite.titleLinkSelector);

    globals.currentTitle = titleLink?.innerText.trim().toLowerCase() ?? 'None';
    setSubTitle();
    if (!atChapter() || titleLink === null) {
      debug('Found URLs.');
      return;
    }

    const nextChapterLink = document.querySelector<HTMLAnchorElement>(globals.currentSite.nextChapterSelector);
    if (nextChapterLink) globals.nextUrl = nextChapterLink.href;
    else globals.nextUrl = titleLink.href;

    const prevChapterLink = document.querySelector<HTMLAnchorElement>(globals.currentSite.prevChapterSelector);
    if (prevChapterLink) globals.prevUrl = prevChapterLink.href;
    else globals.prevUrl = titleLink.href;
    debug('Found URLs.');
  }

  const loadTitleList = () => {
    debug(`Loading title list...`);
    globals.titleList = JSON.parse(GM_getValue(key.titleList, JSON.stringify(defaults.titleList)));
    debug(`Loaded title list.`);
  }

  const manganatoSiteOverrides = () => {
    if (!globals.sites.manganato.active) return;

    document.querySelector('.body-site > .container .panel-fb-comment')?.remove();
    document.querySelector('body > #fb-root')?.remove();
    document.querySelector('.body-site > .container-footer')?.remove();

    if (atChapter()) {
      const chapterContainer = document.querySelector('.container-chapter-reader');
      chapterContainer?.nextSibling?.remove();
      chapterContainer?.nextSibling?.remove();

      const firstContainer = document.querySelector('.body-site > .container:first-of-type');
      firstContainer?.classList.add('overrides-header-container');
      const lastContainer = document.querySelector('.body-site > .container:last-of-type');
      lastContainer?.classList.add('overrides-footer-container');
    }
    if (!(atChapterOrManga())) genreAllSetFirstActive();
  }

  const siteOverrides = () => {
    debug(`Applying site overrides...`);
    manganatoSiteOverrides();
    debug(`Applied site overrides.`);
  }

  const setActiveSite = () => {
    debug(`Setting active site...`);
    const href = window.location.href;
    for (const site of Object.values(globals.sites)) {
      site.active = site.activeRegex.test(href);
      if (!site.active) continue;
      const atChapter = site.atChapterRegex.test(href);
      const atManga = site.atMangaRegex.test(href);

      switch (true) {
        case atChapter:
          site.at = 'chapter';
          break;
        case atManga:
          site.at = 'manga';
          break;
        default:
          site.at = 'neither';
          break;
      }

      globals.currentSite = site;
      break;
    }
    debug(`Set active site: ${globals.currentSite.name}`);
  }

  let genreAllItems: HTMLDivElement[] = [];
  let genreAllItemsIndex = 0;
  const genreAllActiveItemClass = 'nws-genre-all-active-item';

  const genreAllGoToPage = (direction: string) => {
    const pageSelected = document.querySelector<HTMLAnchorElement>('.panel-page-number > .group-page > a.page-select:not(.page-blue)');
    if (!pageSelected) return;
    const previous = pageSelected.previousElementSibling as HTMLAnchorElement | undefined;
    const next = pageSelected.nextElementSibling as HTMLAnchorElement | undefined;
    switch (direction) {
      case 'ArrowLeft':
        if (previous === undefined || previous.classList.contains('page-blue')) return;
        setLocation(previous.href);
        break;
      case 'ArrowRight':
        if (next === undefined || next.classList.contains('page-blue')) return;
        setLocation(next.href);
        break;
    }
  }

  const genreAllSetFirstActive = () => {
    genreAllItems = [...document.querySelectorAll<HTMLDivElement>("div.panel-content-genres > div.content-genres-item")];
    if (genreAllItems.length > 0) {
      genreAllItemsIndex = 0;
      genreAllItems[genreAllItemsIndex].classList.add(genreAllActiveItemClass);
    }
  }

  const genreAllOpenMangaInNewTab = () => {
    const anchor = genreAllItems[genreAllItemsIndex].querySelector<HTMLAnchorElement>('.genres-item-img');
    if (anchor) {
      GM_openInTab(anchor.href, { active: false, insert: true });
    }
  };

  const genreAllBrowse = (direction: string) => {
    switch (direction) {
      case 'ArrowUp':
        if (genreAllItemsIndex < 2) return;
        genreAllItems[genreAllItemsIndex].classList.remove(genreAllActiveItemClass);
        genreAllItemsIndex = genreAllItemsIndex - 2;
        genreAllItems[genreAllItemsIndex].classList.add(genreAllActiveItemClass);
        break;
      case 'ArrowDown':
        if (genreAllItemsIndex + 2 > genreAllItems.length - 1) return
        genreAllItems[genreAllItemsIndex].classList.remove(genreAllActiveItemClass);
        genreAllItemsIndex = genreAllItemsIndex + 2;
        genreAllItems[genreAllItemsIndex].classList.add(genreAllActiveItemClass);
        break;
      case 'ArrowLeft':
        if (genreAllItemsIndex === 0) return;
        genreAllItems[genreAllItemsIndex].classList.remove(genreAllActiveItemClass);
        genreAllItemsIndex = genreAllItemsIndex - 1;
        genreAllItems[genreAllItemsIndex].classList.add(genreAllActiveItemClass);
        break;
      case 'ArrowRight':
        if (genreAllItemsIndex == genreAllItems.length - 1) return;
        genreAllItems[genreAllItemsIndex].classList.remove(genreAllActiveItemClass);
        genreAllItemsIndex = genreAllItemsIndex + 1;
        genreAllItems[genreAllItemsIndex].classList.add(genreAllActiveItemClass);
        break;
    }
    genreAllItems[genreAllItemsIndex].scrollIntoView({ behavior: "smooth", block: "center" });
    window.getSelection()?.removeAllRanges();
  }

  const shortcutHelpers = nws.shortcut.helpers;

  const configClosedShortcuts = (e: KeyboardEvent): boolean => {
    const chapter = atChapter();
    const manga = atManga();
    const chapterOrManga = chapter || manga;

    switch (true) {
      case e.code === 'ArrowLeft' && shortcutHelpers.noModifier(e) && chapter:
        setLocation(globals.prevUrl);
        return true;
      case e.code === 'ArrowLeft' && shortcutHelpers.noModifier(e) && manga:
        goToLatestChapter();
        return true;
      case e.code === 'ArrowLeft' && shortcutHelpers.noModifier(e) && !chapterOrManga && window.location.href.includes('manganato.com/genre-all'):
        genreAllGoToPage(e.code);
        return true;
      case e.code === 'ArrowRight' && shortcutHelpers.noModifier(e) && chapter:
        setLocation(globals.nextUrl);
        return true;
      case e.code === 'ArrowRight' && shortcutHelpers.noModifier(e) && manga:
        goToFirstChapter();
        return true;
      case e.code === 'ArrowRight' && shortcutHelpers.noModifier(e) && !chapterOrManga && window.location.href.includes('manganato.com/genre-all'):
        genreAllGoToPage(e.code);
        return true;
      case e.code === 'ArrowUp' && shortcutHelpers.shiftModifier(e) && !chapterOrManga && window.location.href.includes('manganato.com/genre-all'):
        genreAllBrowse(e.code);
        return true;
      case e.code === 'ArrowDown' && shortcutHelpers.shiftModifier(e) && !chapterOrManga && window.location.href.includes('manganato.com/genre-all'):
        genreAllBrowse(e.code);
        return true;
      case e.code === 'ArrowLeft' && shortcutHelpers.shiftModifier(e) && !chapterOrManga && window.location.href.includes('manganato.com/genre-all'):
        genreAllBrowse(e.code);
        return true;
      case e.code === 'ArrowRight' && shortcutHelpers.shiftModifier(e) && !chapterOrManga && window.location.href.includes('manganato.com/genre-all'):
        genreAllBrowse(e.code);
        return true;
      case e.code === 'Enter' && shortcutHelpers.shiftModifier(e) && !chapterOrManga && window.location.href.includes('manganato.com/genre-all'):
        genreAllOpenMangaInNewTab();
        return true;
      case e.code === 'Quote' && shortcutHelpers.shiftModifier(e) && chapter:
        resize();
        return true;
      case e.code === 'BracketLeft' && shortcutHelpers.shiftModifier(e) && chapterOrManga:
        setTitleList();
        removeTitle();
        saveTitles();
        return true;
      case e.code === 'BracketRight' && shortcutHelpers.shiftModifier(e) && chapterOrManga:
        setTitleList();
        addTitle();
        saveTitles();
        return true;
    }
    return false;
  }

  const registerResources = async () => {
    nws.resources.register('stylesheets', ...styleResources);
    nws.resources.register('json', ...jsonResources);
    nws.resources.register('scripts', ...scriptResources);
  }

  const registerKeyUps = () => {
    const namePrefix = GM_info.script.name;
    nws.shortcut.keyUp.register('ConfigClosed', { name: `${namePrefix} - config closed`, callback: configClosedShortcuts });
  };

  const checkFirstRun = () => {
    debug('First run check...');
    const firstRun = GM_getValue<boolean>(key.firstRun, true);

    if (firstRun) {
      debug('First run detected.');
      GM_setValue(key.firstRun, false);

      GM_notification('First run setup complete', `NWS - ${GM_info.script.name}`);
    }
    debug('First run checked.');
  }

  const onInit = async () => {
    console.log(`NWS - ${GM_info.script.name} - Loading...`);
    checkFirstRun();
    registerKeyUps();
    setActiveSite();
    loadTitleList();
    findUrls();
    if (atChapter()) removeMargins();
    siteOverrides();
    console.log(`NWS - ${GM_info.script.name} - Loaded.`);
  }

  registerConfig();
  registerResources();
  nws.init(onInit);
};

mangaReadingScript();
