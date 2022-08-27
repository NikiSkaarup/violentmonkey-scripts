/* eslint-disable @typescript-eslint/no-unused-vars */
// Violentmonkey API
// Based on https://violentmonkey.github.io/api/gm/

type vm_responseObjectType = {
  status: number;
  statusText: string;
  readyState: number;
  responseHeaders: string;
  responseText: string;
  finalUrl: string;
  context: unknown;
};

type vm_xmlhttpRequestType = {
  url: string;
  method?: string;
  user?: string;
  password?: string;
  overrideMimeType?: string;
  headers?: { [key: string]: string };
  responseType?: string;
  timeout?: number;
  data?: string;
  binary?: boolean;
  context?: unknown;
  anonymous?: boolean;
  onabort?: (event: vm_responseObjectType) => void;
  onerror?: (event: vm_responseObjectType) => void;
  onload?: (event: vm_responseObjectType) => void;
  onloadend?: (event: vm_responseObjectType) => void;
  onloadstart?: (event: vm_responseObjectType) => void;
  onprogress?: (event: vm_responseObjectType) => void;
  onreadystatechange?: (event: vm_responseObjectType) => void;
  ontimeout?: (event: vm_responseObjectType) => void;
};

type vm_downloadOptionsType = {
  url: string;
  name?: string;
  onload?: (event: vm_responseObjectType) => void;
  headers: { [key: string]: string };
  timeout: number;
  onerror?: (event: vm_responseObjectType) => void;
  onprogress?: (event: vm_responseObjectType) => void;
  ontimeout?: (event: vm_responseObjectType) => void;
};

type vm_xmlhttpRequestReturnType = {
  abort: () => void;
};

type vm_optionType = {
  text: string;
  title?: string;
  image?: string;
  onclick?: () => void;
  ondone?: () => void;
};

type vm_notificationReturnType = {
  remove: () => void;
};

type vm_resourceType = {
  [key: string]: {
    name: string;
    mimetype: string;
    url: string;
  }
};

type vm_scriptType = {
  description: string;
  excludes: string[];
  includes: string[];
  matches: string[];
  name: string;
  namespace: string;
  resources: vm_resourceType;
  "run-at": string;
  version: string;
};

type vm_platformType = {
  arch: string;
  browserName: string;
  browserVersion: string;
  os: string;
};

type vm_infoType = {
  uuid: string;
  scriptMetaStr: string;
  scriptWillUpdate: boolean;
  scriptHandler: string;
  version: string;
  platform: vm_platformType;
  script: vm_scriptType;
  injectInto: string;
}

type openInNewTabOptionsType = {
  active?: boolean;
  container?: number;
  insert?: boolean;
  pinned?: boolean;
};

type openInNewTabReturnType = {
  onclose: () => void;
  closed: boolean;
  close: () => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unsafeWindow: Window & nwsWindow;
const GM_info: vm_infoType;

function GM_getValue<t>(key: string, defaultValue?: t): t;
function GM_getValue<t>(key: string, defaultValue?: string | number | boolean): t;
function GM_getValue(key: string, defaultValue?: string | number | boolean): string;

function GM_setValue<t>(key: string, value: t): void;
function GM_setValue(key: string, value: string | number | boolean): void;

function GM_deleteValue(key: string): void;

function GM_listValues(): string[];

function GM_addValueChangeListener(name, callback: (name, oldValue, newValue, remote) => void): string;

function GM_removeValueChangeListener(listenerId: string): void;

function GM_getResourceText(name: string): string;

function GM_getResourceURL(name: string): string;
function GM_getResourceURL(name: string, isBlobUrl: boolean): string;

function GM_addElement(tagName: string, attributes?: { [key: string] }): HTMLElement;
function GM_addElement(parentNode: Node | Element | ShadowRoot, tagName: string, attributes?: { [key in string] }): HTMLElement;

function GM_addStyle(css: string): HTMLStyleElement;

function GM_openInTab(url: string, options?: openInNewTabOptionsType): openInNewTabReturnType;
function GM_openInTab(url: string, openInBackground?: boolean): openInNewTabReturnType;

function GM_registerMenuCommand(caption: string, onClick: (e: MouseEvent | KeyboardEvent) => void): void;

function GM_unregisterMenuCommand(caption: string): void;

function GM_notification(option: vm_optionType): vm_notificationReturnType;
function GM_notification(text: string, title?: string, image?: string, onclick?: () => void): vm_notificationReturnType;

function GM_setClipboard(data: string, type: string): void;

function GM_xmlhttpRequest(request: vm_xmlhttpRequestType): Promise<vm_xmlhttpRequestReturnType>;

function GM_download(url: string, name?: string): void;
function GM_download(options: vm_downloadOptionsType): void;
