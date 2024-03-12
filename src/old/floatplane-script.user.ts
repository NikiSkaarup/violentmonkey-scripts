// ==UserScript==
// @name        floatplane script
// @namespace   https://skaarup.dev
// @resource    configuration-ui http://localhost:8432/styles/configuration-ui.css
// #@icon        https://skaarup.dev/usericons/floatplane-script-icon.png
// @homepageURL https://skaarup.dev/userscripts
// @updateURL   http://localhost:8432/floatplane-script.user.js
// @downloadURL http://localhost:8432/floatplane-script.user.js
// #@updateURL   https://skaarup.dev/userscripts/floatplane-script.user.js
// #@downloadURL https://skaarup.dev/userscripts/floatplane-script.user.js
// #@require     https://skaarup.dev/userlibs/nws.lib.js
// @match       https://*floatplane.com/*
// @grant       none
// @version     1.0
// @author      nws
// @description improve the floatplane experience
// @grant       GM_info
// @grant       GM_setValue
// @grant       GM_getValue
// @grant       GM_getResourceText
// @grant       GM_registerMenuCommand
// @grant       GM_notification
// @inject-into content
// @run-at      document-start
// @noframes
// ==/UserScript==

/*
  TODO: Update configurations with options stored in GM_setValue and GM_getValue
    TODO: checkbox, Check for new videos
    TODO: checkbox, Check if live
    TODO: textarea, with creators to check for new videos
    TODO: textarea, with creators to check for if live
    TODO: checkbox, Modifying /live chat
    TODO: checkbox, Modifying /live stream
    TODO: checkbox, Modifying /post/ video
    TODO: input, last notified video id
  TODO: Update to show if a creator is live in sidebar
*/

import nws from '../nws.lib';

const floatplaneScript2 = () => {
  const debug = (message: unknown) => nws.debug(message, GM_info.script.name);
  const styleResources: resource[] = [];
  const jsonResources: resource[] = [];
  const scriptResources: resource[] = [];

  const key = {
    firstRun: 'firstRun',
    dataAttr: 'data-nws-floatplane-script',
  }

  const videoIds: string[] = [];
  const baseUrl = 'https://www.floatplane.com/post/';
  const checkUrl = 'https://www.floatplane.com/api/v3/content/creator/list';
  const limit = 'limit=20';
  const ids: string[] = ['59f94c0bdd241b70349eb72b', '5d48c7be5fa46b731f1d5885'];
  const notifiedAboutLive = new Set<string>();
  const getPostedKey = (anchor: HTMLAnchorElement): string => anchor.href.replace(baseUrl, '');

  const registerConfig = () => {
    const subContainer = nws.createHTMLElement('div', 'nws-sub-container-content');
    const title = nws.createHTMLElement('p', 'nws-current-title nws-border-bottom');
    title.innerText = `${GM_info.script.name} version ${GM_info.script.version} configuration`;
    subContainer.appendChild(title);

    nws.config.register(GM_info, subContainer, () => {
      // placeholder
    });
  }

  const waitForElementToExist = async (querySelector: string, callback: (element: HTMLElement) => unknown, timeoutMS?: number): Promise<void> => {
    debug(`waitForElementToExist: ${querySelector}`);
    const executeCheck = () => {
      const element = document.querySelector<HTMLElement>(querySelector);
      const timeout = setTimeout(executeCheck, timeoutMS ?? 100);
      if (!element) return;
      clearTimeout(timeout);
      callback(element);
      debug(`waitForElementToExist: ${querySelector} exist...`);
    };
    executeCheck();
  }

  const configuringLiveVideo = () => {
    const liveStreamView = document.querySelector<HTMLElement>('div.route-wrapper.livestream-view');
    if (liveStreamView === null) return;
    liveStreamView.style.display = 'grid';
    liveStreamView.style.gridTemplateColumns = '1fr 400px';
    liveStreamView.style.paddingRight = '0';

    const liveScrollWrapper = liveStreamView.querySelector<HTMLElement>('div.live-scroll-wrapper');
    if (liveScrollWrapper === null) return;
    liveScrollWrapper.style.flexShrink = '0';

    const playerContainer = liveScrollWrapper.querySelector<HTMLElement>('div.player-container.livestream');
    if (playerContainer === null) return;
    playerContainer.style.width = 'auto';
    playerContainer.style.maxWidth = '100%';
    playerContainer.style.maxHeight = '100vh';

    const innerContainer = playerContainer.querySelector<HTMLElement>('div.inner-container');
    if (innerContainer === null) return;
    innerContainer.style.paddingBottom = '0';
    innerContainer.style.overflow = 'auto';

    const streamContainer = innerContainer.querySelector<HTMLElement>('div.stream-container');
    if (streamContainer === null) return;
    streamContainer.style.position = 'relative';

    const videoJS = streamContainer.querySelector<HTMLElement>('div[aria-label="video player"]');
    if (videoJS === null) return;
    videoJS.style.paddingTop = '0';
    videoJS.style.height = 'auto';
    videoJS.style.backgroundColor = 'transparent';

    const video = videoJS.querySelector<HTMLElement>('video.vjs-tech');
    if (video === null) return;
    video.style.position = 'relative';
    video.style.top = 'unset';
    video.style.left = 'unset';
    video.style.display = 'block';
    video.style.maxHeight = '100vh';
  }

  const configuringLiveChat = (liveChatWrapper: HTMLElement) => {
    liveChatWrapper.style.width = '100%';
    liveChatWrapper.style.height = '100vh';

    const chatInputContainer = liveChatWrapper.querySelector<HTMLElement>('div.chat-view-container.chat-messages-container > div.chat-input-container');
    if (chatInputContainer === null) return;
    chatInputContainer.style.height = '65px';
    chatInputContainer.style.display = 'flex';
    chatInputContainer.style.flexFlow = 'row nowrap';
    chatInputContainer.style.padding = '8px 0 0 8px';
    chatInputContainer.style.gap = '4px';

    const iconSelf = chatInputContainer.querySelector<HTMLElement>('div.icon-self');
    if (iconSelf === null) return;
    iconSelf.style.height = '20px';
    iconSelf.style.width = '20px';
    iconSelf.style.position = 'relative';
    iconSelf.style.left = 'unset';
    iconSelf.style.bottom = 'unset';

    const chatInput = chatInputContainer.querySelector<HTMLElement>('textarea.chat-input');
    if (chatInput === null) return;
    chatInput.style.fontSize = '16px';
    chatInput.style.height = '60px';
    chatInput.style.marginTop = '0';
    chatInput.style.paddingLeft = '0';

    const hintContainer = chatInputContainer.querySelector<HTMLElement>('div.hint-container');
    if (hintContainer === null) return;
    hintContainer.remove();
  }

  const setupLive = () => {
    if (!window.location.href.includes('/live')) return;
    waitForElementToExist('div.live-chat-wrapper', configuringLiveChat);
    waitForElementToExist('video.vjs-tech', configuringLiveVideo);
  }

  const configuringVideo = () => {
    const routeWrapper = document.querySelector<HTMLElement>('div.route-wrapper');
    if (routeWrapper === null) return;
    routeWrapper.style.display = 'grid';
    routeWrapper.style.gridTemplateColumns = '1fr';

    const playerContainer = routeWrapper.querySelector<HTMLElement>('div.player-container');
    if (playerContainer === null) return;
    playerContainer.style.width = 'auto';
    playerContainer.style.maxWidth = '100%';
    playerContainer.style.maxHeight = '100vh';

    const innerContainer = playerContainer.querySelector<HTMLElement>('div.inner-container');
    if (innerContainer === null) return;
    innerContainer.style.paddingBottom = '0';
    innerContainer.style.overflow = 'auto';

    const videoJS = innerContainer.querySelector<HTMLElement>('div[aria-label="video player"]');
    if (videoJS === null) return;
    videoJS.style.paddingTop = '0';
    videoJS.style.height = 'auto';
    videoJS.style.backgroundColor = 'transparent';

    setTimeout(() => {
      const interval = setInterval(() => {
        const video = videoJS.querySelector<HTMLElement>('video.vjs-tech');
        if (video === null || video.style.position === 'relative') return;
        video.style.position = 'relative';
        video.style.left = 'unset';
        video.style.bottom = 'unset';
        video.style.display = 'block';
        video.style.maxHeight = '100vh';
        clearInterval(interval);
      }, 100);
    }, 1000);
  }

  const setupVideo = () => {
    if (!window.location.href.includes('/post/')) return;
    debug('Setting up video...');
    waitForElementToExist('video.vjs-tech', configuringVideo);
    debug('Set up video.');
  }

  const defaultOptions = {
    title: `Floatplane: `,
    videos: `Uploaded @@ new videos`,
    live: `Is currently live`,
    noLongerLive: `Is no longer live`
  };

  const baseOptions = {
    image: 'https://pbs.floatplane.com/icons/favicon-196x196.png'
  }

  const notLive = (creator: floatplane.creator) => {
    if (notifiedAboutLive.has(creator.id)) {
      notifiedAboutLive.delete(creator.id);
      const options = {
        ...baseOptions,
        title: `${defaultOptions.title}${creator.title}`,
        text: defaultOptions.noLongerLive,
      }
      GM_notification(options);
    }
  }

  const live = (creator: floatplane.creator) => {
    if (notifiedAboutLive.has(creator.id)) return;
    notifiedAboutLive.add(creator.id);
    const options = {
      ...baseOptions,
      title: `${defaultOptions.title}${creator.title}`,
      text: defaultOptions.live,
    }
    GM_notification(options);
  }

  const checkIfLive = async (list: floatplane.listResponse) => {
    const creators = list.blogPosts.map(item => item.creator).reduce<floatplane.creator[]>((acc, curr) => {
      if (acc.find(creator => creator.id === curr.id)) return acc;
      return [...acc, curr];
    }, []);

    creators.forEach(creator => {
      if (creator.liveStream.offline) {
        notLive(creator);
        return;
      }
      live(creator);
    });
  }

  const checkForNewVideos = async (list: floatplane.listResponse) => {
    const index = list.blogPosts.findIndex((blogPost) => videoIds.includes(blogPost.id));

    if (index === -1) return;
    const newList = list.blogPosts.slice(0, index);
    if (newList.length === 0) return;


    const creatorsWithIds: { [key: string]: string[] } = {}
    newList.forEach(blogPost => {
      videoIds.push(blogPost.id);
      creatorsWithIds[blogPost.creator.title] = creatorsWithIds[blogPost.creator.title] || [];
      creatorsWithIds[blogPost.creator.title].push(blogPost.id);
    });

    for (const creatorName in creatorsWithIds) {
      const options = {
        ...baseOptions,
        title: `${defaultOptions.title}${creatorName}`,
        text: defaultOptions.videos.replace('@@', creatorsWithIds[creatorName].length.toString()),
      }
      GM_notification(options);
    }
  };

  const fetchList = async (): Promise<void> => {
    const idList = ids.map((value, index) => `ids[${index}]=${value}`).join('&');
    const url = `${checkUrl}?${idList}&${limit}`;
    const resp = await fetch(url);
    if (resp.status !== 200) return;
    const list = await resp.json() as floatplane.listResponse;
    checkForNewVideos(list);
    checkIfLive(list);
  }

  const setupCheckers = () => {
    if (window.location.href !== 'https://www.floatplane.com/') return;
    const checkers = (feed: HTMLElement) => {
      const latestFeedItem = feed.querySelector<HTMLAnchorElement>('div.ReactElementGridItem > a.ReactPostTile.video');
      if (latestFeedItem === null) return;
      const key = getPostedKey(latestFeedItem);
      videoIds.push(key);
      setInterval(fetchList, 5 * 60 * 1000);
    }
    waitForElementToExist('div.ReactVideoFeed.grid', checkers);
  }

  const registerResources = async () => {
    nws.resources.register('stylesheets', ...styleResources);
    nws.resources.register('json', ...jsonResources);
    nws.resources.register('scripts', ...scriptResources);
  }

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
    setupCheckers();
    setupLive();
    setupVideo();
    console.log(`NWS - ${GM_info.script.name} - Loaded.`);
  }

  registerConfig();
  registerResources();
  nws.init(onInit);
};
floatplaneScript2();
