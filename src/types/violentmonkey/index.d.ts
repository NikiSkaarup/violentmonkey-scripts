type vm_responseObjectTypeUnknown = vm_responseObjectType<unknown>;
type vm_responseObjectType<T> = {
	status: number;
	statusText: string;
	readyState: number;
	responseHeaders: string;
	response: string | Blob | ArrayBuffer | Document | object | null;
	responseText: string | undefined;
	responseXML: Document | null;
	lengthComputable: boolean;
	loaded: number;
	total: number;
	finalUrl: string;
	context: T;
};

type vm_detailType<T> = {
	url: string;
	method?: string;
	user?: string;
	password?: string;
	overrideMimeType?: string;
	headers?: { [key: string]: string };
	responseType?: string;
	timeout?: number;
	data?:
		| string
		| ArrayBuffer
		| Blob
		| DataView
		| FormData
		| ReadableStream
		| TypedArray
		| URLSearchParams;
	binary?: boolean;
	context?: T;
	anonymous?: boolean;
	onabort?: (resp: vm_responseObjectType<T>) => void;
	onerror?: (resp: vm_responseObjectType<T>) => void;
	onload?: (resp: vm_responseObjectType<T>) => void;
	onloadend?: (resp: vm_responseObjectType<T>) => void;
	onloadstart?: (resp: vm_responseObjectType<T>) => void;
	onprogress?: (resp: vm_responseObjectType<T>) => void;
	onreadystatechange?: (resp: vm_responseObjectType<T>) => void;
	ontimeout?: (resp: vm_responseObjectType<T>) => void;
};

type vm_optionType = {
	text: string;
	title?: string;
	image?: string;
	onclick?: () => void;
	ondone?: () => void;
};

type vm_resourceType = {
	name: string;
	url: string;
};

type vm_scriptType = {
	description: string;
	excludes: Array<string>;
	includes: Array<string>;
	matches: Array<string>;
	name: string;
	namespace: string;
	resources: Array<vm_resourceType>;
	'run-at': string;
	version: string;
};

type vm_platformType = {
	arch: string;
	browserName: string;
	browserVersion: string;
	fullVersionList: Array<{
		brand: string;
		version: string;
	}>;
	mobile: boolean;
	os: string;
};

type vm_infoType = {
	uuid: string;
	scriptMetaStr: string;
	scriptWillUpdate: boolean;
	scriptHandler: string;
	version: string;
	isIncognito: boolean;
	platform: vm_platformType;
	userAgent: string;
	userAgentData: {
		brands: Array<{ brand: string; version: string }>;
		mobile: boolean;
		platform: string;
		getHighEntropyValues: (hints: string[]) => Promise<{ [key: string]: unknown }>;
	};
	script: vm_scriptType;
	injectInto: string;
};

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

declare namespace GM {
	function addStyle(css: string): void;
	function addElement(tagName: string, attributes?: { [key: string]: unknown }): HTMLElement;
	function addElement(
		parent: Node | Element | ShadowRoot,
		tagName: string,
		attributes?: { [key: string]: unknown },
	): HTMLElement;
	function registerMenuCommand(
		caption: string,
		func: (event: MouseEvent | KeyboardEvent) => void,
		options?: { id?: string; title?: string; autoClose?: boolean },
	): string;
	function deleteValue(key: string): Promise<void>;
	function deleteValues(keys: string[]): Promise<void>;
	function download(options: {
		url: string;
		name: string;
		headers?: object;
		timeout?: number;
		context?: unknown;
		user?: string;
		password?: string;
		anonymous?: boolean;
		onabort?: () => void;
		onerror?: () => void;
		onload?: () => void;
		onloadend?: () => void;
		onloadstart?: () => void;
		onprogress?: () => void;
		onreadystatechange?: () => void;
		ontimeout?: () => void;
	}): Promise<void>;
	function download(url: string, name: string): Promise<void>;
	function getResourceUrl(name: string, isBlobUrl?: boolean): Promise<string>;
	function getValue<T>(key: string, defaultValue?: string | number | boolean): Promise<T>;
	function getValue(key: string, defaultValue?: string | number | boolean): Promise<string>;
	function getValues<T>(keys: string[]): Promise<{ [key: string]: T }>;
	function getValues<T>(obj: { [key: string]: T }): Promise<{ [key: string]: T }>;
	const info: vm_infoType;
	function listValues(): Promise<string[]>;
	function notification(options: {
		text: string;
		title?: string;
		image?: string;
		silent?: boolean; // false
		tag?: string;
		zombieTimeout?: number;
		zombieUrl?: string;
		onclick?: () => void;
		ondone?: () => void;
	}): Promise<() => void>;
	function notification(
		text: string,
		title?: string,
		image?: string,
		onclick?: () => void,
	): promise<() => void>;
	function openInTab(
		url: string,
		options?: {
			active?: boolean; // true
			container?: number; // 0 = default (main) container 1, 2, etc. = internal container index
			insert?: boolean; // true
			pinned?: boolean; // false
		},
	): {
		onclose?: () => void;
		closed: boolean;
		close: () => void;
	};
	function openInTab(
		url: string,
		openInBackground: boolean,
	): {
		onclose?: () => void;
		closed: boolean;
		close: () => void;
	};
	function setClipboard(data: string, type: string): void;
	function setValue(key: string, value: unknown): Promise<void>;
	function setValues(obj: { [key: string]: unknown }): Promise<void>;

	// function xmlHttpRequest<T>(details: vm_detailType<T>): { abort: () => void };
	function xmlHttpRequest<T>(details: vm_detailType<T>): Promise<vm_responseObjectType<T>>;
}

function GM_getValue<t>(key: string, defaultValue?: t): t;
function GM_getValue<t>(key: string, defaultValue?: string | number | boolean): t;
function GM_getValue(key: string, defaultValue?: string | number | boolean): string;

function GM_setValue<t>(key: string, value: t): void;
function GM_setValue(key: string, value: string | number | boolean): void;

function GM_deleteValue(key: string): void;

function GM_listValues(): string[];

function GM_addValueChangeListener(
	name,
	callback: (name, oldValue, newValue, remote) => void,
): string;

function GM_removeValueChangeListener(listenerId: string): void;

function GM_getResourceText(name: string): string;

function GM_getResourceURL(name: string): string;
function GM_getResourceURL(name: string, isBlobUrl: boolean): string;

function GM_addElement(tagName: string, attributes?: { [key: string]: string }): HTMLElement;
function GM_addElement(
	parentNode: Node | Element | ShadowRoot,
	tagName: string,
	attributes?: { [key: string]: string },
): HTMLElement;

function GM_addStyle(css: string): HTMLStyleElement;

function GM_openInTab(url: string, options?: openInNewTabOptionsType): openInNewTabReturnType;
function GM_openInTab(url: string, openInBackground?: boolean): openInNewTabReturnType;

function GM_registerMenuCommand(
	caption: string,
	onClick: (e: MouseEvent | KeyboardEvent) => void,
): void;

function GM_unregisterMenuCommand(caption: string): void;

function GM_notification(option: vm_optionType): vm_notificationReturnType;
function GM_notification(
	text: string,
	title?: string,
	image?: string,
	onclick?: () => void,
): vm_notificationReturnType;

function GM_setClipboard(data: string, type: string): void;

function GM_xmlhttpRequest(request: vm_xmlhttpRequestType): Promise<vm_xmlhttpRequestReturnType>;

function GM_download(url: string, name?: string): void;
function GM_download(options: vm_downloadOptionsType): void;
