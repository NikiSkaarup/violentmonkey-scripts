// Greasemonkey api
// https://wiki.greasespot.net/Greasemonkey_Manual:API

type gm_responseObjectType = {
	readyState: number;
	responseHeaders: string;
	responseText: string;
	status: number;
	statusText: string;
	context?: unknown;
	lengthComputable?: boolean;
	loaded?: number;
	total?: number;
};

type gm_detailType = {
	binary?: boolean;
	context?: unknown;
	data?: string;
	headers?: { [key: string]: string };
	method?: string;
	overrideMimeType?: string;
	password?: string;
	responseType?: string;
	synchronous?: boolean;
	timeout?: number;
	upload?: {
		onabort?: (event: gm_responseObjectType) => void;
		onerror?: (event: gm_responseObjectType) => void;
		onload?: (event: gm_responseObjectType) => void;
		onprogress?: (event: gm_responseObjectType) => void;
	};
	url: string;
	user?: string;
	onabort?: (event: gm_responseObjectType) => void;
	onerror?: (event: gm_responseObjectType) => void;
	onload?: (event: gm_responseObjectType) => void;
	onprogress?: (event: gm_responseObjectType) => void;
	onreadystatechange?: (event: gm_responseObjectType) => void;
	ontimeout?: (event: gm_responseObjectType) => void;
};

type gm_optionType = {
	text: string;
	title?: string;
	image?: string;
	onclick?: () => void;
	ondone?: () => void;
};

type gm_resourceType = {
	[key: string]: {
		name: string;
		mimetype: string;
		url: string;
	};
};

type gm_scriptType = {
	description: string;
	excludes: string[];
	includes: string[];
	matches: string[];
	name: string;
	namespace: string;
	resources: gm_resourceType;
	'run-at': string;
	version: string;
};

type gm_infoType = {
	script: gm_scriptType;
	scriptMetaStr: string;
	scriptHandler: string;
	version: string;
};
