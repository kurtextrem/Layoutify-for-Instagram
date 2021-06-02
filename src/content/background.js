'use strict'

/** Stores tab ID */
let tabId

/**
 * Creates a new tab.
 *
 * @param {number} id Tab ID
 * @param {boolean} force Whether to force a tab creation
 */
function createTab(id, force) {
	if (tabId !== undefined && !force) {
		chrome.tabs.update(
			tabId,
			{ active: true },
			() => chrome.runtime.lastError && createTab(id, true) // only create new tab when there was an error
		)
	} else {
		chrome.tabs.create({ url: chrome.runtime.getURL('index.html') }, newTab => (tabId = newTab.id))
	}
}

/**
 *
 */
function getCookie(name) {
	return new Promise((resolve, reject) => {
		chrome.cookies.get(
			{
				name,
				url: 'https://www.instagram.com/',
			},
			function cookies(cookie) {
				if (cookie !== null) resolve(cookie.value)
				reject()
			}
		)
	})
}

let sessionid = ''
/**
 *
 */
function getSessionId() {
	getCookie('sessionid')
		.then(value => (sessionid = value))
		.catch(logAndReject)
}

getSessionId()

// Hook into web request and modify headers before sending the request
chrome.webRequest.onBeforeSendHeaders.addListener(
	function listener(details) {
		if (details.initiator !== 'chrome-extension://' + chrome.runtime.id) return

		getSessionId() // just update for next time

		const headers = details.requestHeaders

		for (const i in headers) {
			const header = headers[i],
				name = header.name.toLowerCase()

			if (name === 'user-agent') {
				// credit https://github.com/mgp25/Instagram-API/master/src/Constants.php
				// https://packagist.org/packages/mgp25/instagram-php / https://github.com/dilame/instagram-private-api
				header.value =
					'Instagram 121.0.0.29.119 Android (24/7.0; 380dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; en_US; 185203708)'
			} else if (name === 'cookie') {
				if (header.value.indexOf('sessionid=') === -1)
					// add auth cookies to authenticate API requests
					header.value = `${header.value}; sessionid=${sessionid}`
			}
		}

		return { requestHeaders: headers }
	},
	{
		types: ['xmlhttprequest'],
		urls: [
			'https://i.instagram.com/api/v1/feed/liked/*',
			'https://i.instagram.com/api/v1/feed/saved/*',
			'https://i.instagram.com/api/v1/feed/collection/*',
			'https://i.instagram.com/api/v1/collections/list/*',
		],
	},
	['blocking', 'requestHeaders', 'extraHeaders']
)

/**
 * So we can load images/videos on 3-dots page.
 */
chrome.webRequest.onBeforeSendHeaders.addListener(
	function modifyCospHeaders(details) {
		// @todo Replace this with declarative netrequest https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/#:~:text=within%20a%20tab.-,initiator,-string%C2%A0optional
		if (details.initiator !== 'chrome-extension://' + chrome.runtime.id) return

		const headers = details.requestHeaders

		let updated = false
		for (const i in headers) {
			const header = headers[i]

			if (header.name === 'Referer') {
				header.value = 'https://www.instagram.com/'
				updated = true
			}
		}

		if (!updated) headers.push({ name: 'referer', value: 'https://www.instagram.com/' })

		return { requestHeaders: details.requestHeaders }
	},
	{
		types: ['image', 'media'],
		urls: ['*://*.fbcdn.net/*', '*://*.cdninstagram.com/*'],
	},
	['blocking', 'requestHeaders', 'extraHeaders']
)

/**
 *
 */
function checkStatus(response) {
	if (response.ok) return response

	const error = new Error(`HTTP Error ${response.statusText}`)
	error.status = response.status
	error.response = response
	throw error
}

/**
 *
 */
function toText(response) {
	return response.text()
}

/**
 *
 */
function toJSON(response) {
	return response.json()
}

/**
 *
 */
function logAndReject(e) {
	console.warn(e)
	return Promise.reject(e)
}

/**
 *
 */
function fixMaxId(response) {
	const response_ = response.replace(/"next_max_id":(\d+)/g, '"next_max_id":"$1"')
	;/\s*/g.exec('') // clear regex cache to prevent memory leak
	return response_
}

/**
 *
 */
function parseJSON(response) {
	return JSON.parse(response)
}

const API_URL = {
	PRIVATE: 'https://i.instagram.com/api/v1/',
	PRIVATE_WEB: 'https://i.instagram.com/api/v1/', // once web has more abilities, replace PRIVATE
	PUBLIC: 'https://www.instagram.com/web/',
}

const PRIVATE_API_OPTS = {
	headers: {
		Accept: '*/*',
		//'Accept-Encoding': 'gzip, deflate',
		//'Accept-Language': 'en-US',
		//Connection: 'keep-alive',
		'X-FB-HTTP-Engine': 'Liger',
		'X-IG-App-ID': '567067343352427',
		'X-IG-Bandwidth-Speed-KBPS': '-1.000',
		'X-IG-Bandwidth-TotalBytes-B': '0',
		'X-IG-Bandwidth-TotalTime-MS': '0',
		'X-IG-Capabilities': '3brTvw==',
		'X-IG-Connection-Speed': ~~(Math.random() * 5000 + 1000) + 'kbps',
		'X-IG-Connection-Type': 'WIFI',
	},
	method: 'GET',
	// credits to https://github.com/mgp25/Instagram-API/blob/master/src/Request.php#L377
}

const PRIVATE_WEB_API_OPTS = {
	headers: {
		'X-IG-App-ID': '936619743392459',
		'X-IG-WWW-Claim': '',
	},
	method: 'GET',
}

// sync with components/feed/FetchComponent
const PUBLIC_API_OPTS = {
	headers: {
		'x-asbd-id': '437806', // @TODO Update from ConsumerLibCommons e.ASBD_ID= | last update 02.06.2021
		'x-csrftoken': '',
		'X-IG-App-ID': '936619743392459',
		'x-instagram-ajax': '',
		'x-requested-with': 'XMLHttpRequest',
	},
	method: 'POST',
}

const GRAPHQL_API_OPTS = {
	headers: {
		'x-csrftoken': '',
		'X-IG-App-ID': '936619743392459',
		'X-IG-WWW-Claim': '',
		'x-requested-with': 'XMLHttpRequest',
	},
	method: 'GET',
}

/**
 *
 */
function fetchFromBackground(which, path, sendResponse, options) {
	if (which === 'PUBLIC') {
		getCookie('csrftoken')
			.then(value => {
				PUBLIC_API_OPTS.headers['x-csrftoken'] = value // can also be obtained by using window.__initialData.data.config.csrf_token||window._csrf_token
				PUBLIC_API_OPTS.headers['x-instagram-ajax'] = localStorage['rollout-hash']
				fetchAux(API_URL[which] + path, PUBLIC_API_OPTS)

				return value
			})
			.catch(logAndReject)

		return false // for now
	}

	if (which === 'PRIVATE_WEB') {
		PRIVATE_WEB_API_OPTS.headers['X-IG-WWW-Claim'] = localStorage['ig-claim']
		fetchAux(API_URL[which] + path, PRIVATE_WEB_API_OPTS, 'text')
			.then(fixMaxId)
			.then(parseJSON)
			.then(sendResponse)
			.catch(sendResponse)

		return true
	}

	const opts = { ...PRIVATE_API_OPTS, ...options }
	if (opts.method === undefined || opts.method !== 'GET') {
		if (opts.body !== undefined) {
			opts.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
			opts.body = new FormData()
		}
	}

	fetchAux(API_URL[which] + path, opts, 'text')
		.then(fixMaxId)
		.then(parseJSON)
		.then(sendResponse)
		.catch(sendResponse)

	return true
}

//const UID = getCookie('ds_user_id').then(value => value),
//	UUID = '' // 'android-' + SparkMD5.hash(document.getElementsByClassName('coreSpriteDesktopNavProfile')[0].href.split('/')[3]).slice(0, 16)

/**
 *
 */
function fetchAux(url, options, type) {
	let opts
	if (options !== undefined) opts = { credentials: 'include', method: 'GET', ...options }

	if (opts.credentials === 'omit')
		return fetch(url, opts)
			.then(checkStatus)
			.then(type === 'json' ? toJSON : toText)
			.catch(logAndReject)

	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest()
		xhr.open(opts.method, url, true)
		xhr.responseType = type || 'text'
		xhr.withCredentials = true

		const headers = opts.headers
		for (const header in headers) {
			if (!Object.prototype.hasOwnProperty.call(headers, header)) continue
			xhr.setRequestHeader(header, headers[header])
		}

		xhr.addEventListener('load', function () {
			resolve(xhr.response)
		})

		xhr.addEventListener('error', logAndReject)
		xhr.addEventListener('abort', logAndReject)

		xhr.send()
	})
}

/**
 *
 */
function getRandom(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

chrome.runtime.onMessage.addListener(function listener(request, sender, sendResponse) {
	switch (request.action) {
		case 'click':
			createTab(sender.tab.id, false)
			break

		case 'watchNow':
			watchNow()
			break

		case 'watchInBackground':
			createUpdateAlarm()
			break

		case 'stopWatchInBackground':
			chrome.alarms.clear('update')
			break

		case 'fetch':
			fetchFromBackground(request.which.toUpperCase(), request.path, sendResponse, request.options)
			return true

		// variables from IG web
		case 'ig-claim':
			window.localStorage['ig-claim'] = request.path
			break

		case 'rollout-hash':
			window.localStorage['rollout-hash'] = request.path
			break

		default:
			break
	}

	return false
})

/**
 *
 */
function createUpdateAlarm(when) {
	chrome.alarms.create('update', {
		delayInMinutes: when ? undefined : 1,
		periodInMinutes: 52, // @todo Try to get this as low as possible, 15: acc locked
		when: when || undefined,
	})
}

/** Open Changelog when updating to a new major/minor version. */
chrome.runtime.onInstalled.addListener(details => {
	if (details.reason !== 'update') return

	chrome.alarms.get('update', function (alarm) {
		const when = alarm !== undefined ? alarm.scheduledTime : undefined
		createUpdateAlarm(when)
	})

	const currentVersion = chrome.runtime.getManifest().version,
		splitNew = currentVersion.split('.'),
		splitOld = details.previousVersion.split('.')
	if (+splitNew[0] > +splitOld[0] || +splitNew[1] > +splitOld[1])
		// we only check major und minor, nothing else
		chrome.tabs.create({
			url: 'https://github.com/kurtextrem/Layoutify-for-Instagram/blob/master/CHANGELOG.md#changelog',
		})
})

function watchNow(e) {
	const now = Date.now(),
		last = window.localStorage.ige_lastFetch || 0

	const INTERVAL = 900000 // 15min
	if (now - +last > INTERVAL) {
		window.localStorage.ige_lastFetch = now
		getWatchlist()
	}
}

chrome.alarms.onAlarm.addListener(watchNow)

/**
 *
 */
function openIG(id) {
	chrome.tabs.create({
		url: `https://www.instagram.com/${id.split(';').splice(1)}`,
	})
}
chrome.notifications.onClicked.addListener(openIG)

chrome.notifications.onButtonClicked.addListener((id, buttonIndex) => {
	if (buttonIndex !== -1) return
	openIG(id)
})

/**
 *
 */
function getWatchlist(e) {
	chrome.storage.sync.get({ options: null, watchData: null }, data => {
		const options = data.options
		if (chrome.runtime.lastError) {
			console.error(chrome.runtime.lastError.message)
			return
		}
		if (options === null) {
			console.error('Empty options', options, data.watchData)
			return
		}

		if (data.watchData === null) {
			data.watchData = {}
		}

		if (options.watchPosts) checkForWatchedContent(options.watchPosts, 0, data.watchData)
		if (options.watchStories) checkForWatchedContent(options.watchStories, 1, data.watchData)
	})
}

/**
 *
 */
function getBlobUrl(url) {
	return new Promise((resolve, reject) => {
		window
			.fetch(url)
			.then(checkStatus)
			.then(response => response.blob())
			.then(blob => resolve(URL.createObjectURL(blob)))
			.catch(e => {
				console.error(e)
				reject(e)
				return e
			})
	})
}

const notificationOptions = {
	iconUrl: '',
	imageUrl: '',
	message: chrome.i18n.getMessage('watch_openProfile'),
	title: '', // profile pic
	type: '',
}

const get = (path, object) => path.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), object)

/**
 *
 */
function getProfilePicId(url) {
	const pic_id = url.split('/')

	return pic_id[pic_id.length - 1].split('?')[0].split('.')[0]
}

/**
 *
 */
function handlePost(json, user, userObject, watchData, options) {
	const node = get(['graphql', 'user', 'edge_owner_to_timeline_media', 'edges', '0', 'node'], json)
	if (node === null) {
		notifyError(user, options)
		return
	}

	const id = node.shortcode,
		pic = json.graphql.user.profile_pic_url_hd
	if (id === null || id == userObject.post) {
		// if no post exsits, or if String/Number id == userObject.post (String)
		console.log(user, 'no new post', node)

		const user_pic = watchData[user].pic,
			picId = getProfilePicId(pic)
		if (user_pic === undefined) {
			watchData[user].pic = picId
		} else if (getProfilePicId(user_pic) !== picId) {
			watchData[user].pic = picId
			// @todo: Migration code getProfilePicId(user_pic)
			options.type = 'basic'
			options.title = chrome.i18n.getMessage('watch_newPic', user) // new profile picture

			getBlobUrl(pic)
				.then(url => {
					options.iconUrl = url
					return chrome.notifications.create(`pic;${user}/`, options, nId => {
						if (chrome.runtime.lastError) console.error(chrome.runtime.lastError.message)
						URL.revokeObjectURL(url)
						// @todo: Maybe clear notification?
					})
				})
				.catch(logAndReject)
		}
		return
	}

	console.log(user, 'new post', node, userObject.post)
	watchData[user].post = id

	options.type = 'image'
	options.title = chrome.i18n.getMessage('watch_newPost', user)

	Promise.all([getBlobUrl(pic), getBlobUrl(node.thumbnail_src)])
		.then(values => {
			options.iconUrl = values[0]
			options.imageUrl = values[1]
			return chrome.notifications.create(`post;p/${id}/`, options, nId => {
				if (chrome.runtime.lastError) console.error(chrome.runtime.lastError.message)
				URL.revokeObjectURL(values[0])
				URL.revokeObjectURL(values[1])
				// @todo: Maybe clear notification?
			})
		})
		.catch(logAndReject)
}

/**
 *
 */
function handleStory(json, user, userObject, watchData, options) {
	const userJson = get(['data', 'user'], json)
	if (userJson === null) {
		notifyError(user, options)
		return
	}

	const reel = userJson.reel,
		id = reel !== null ? reel.latest_reel_media : null

	if (reel.seen > id) console.warn(user, 'seen id > current id: story deleted?')
	if (id !== null && id > reel.seen) {
		// && id != userObj.story
		console.log(user, 'new story')
		//watchData[user].story = `${id}`

		options.type = 'basic'
		options.title = chrome.i18n.getMessage('watch_newStory', user)

		getBlobUrl(reel.owner.profile_pic_url)
			.then(url => {
				options.iconUrl = url
				return chrome.notifications.create(`story;stories/${user}/`, options, nId => {
					if (chrome.runtime.lastError) console.error(chrome.runtime.lastError.message)
					URL.revokeObjectURL(url)
					// @todo: Maybe clear notification?
				})
			})
			.catch(logAndReject)
	} else console.log(user, 'no new story', reel)
}

/**
 *
 */
function notifyError(user, options) {
	options.type = 'basic'
	options.title = `${user} could not be found`
	options.message = `${user} might have changed the Instagram nickname. Please go to the options and remove the name.`
	options.iconUrl = 'img/icon-128.png'
	chrome.notifications.create(`error;${user}/`, options, undefined) // @TODO: Add 'click to remove'
}

const WEB_OPTS = {
	headers: {
		'x-requested-with': 'XMLHttpRequest',
	},
}

const QUERY_HASH = 'd4d88dc1500312af6f937f7b804c68c3', // @TODO Update regularely, last check 09.09.2020 - request loads on any profile/non-home page
	storiesParams = {
		include_chaining: true,
		include_highlight_reels: false,
		include_live_status: true,
		include_logged_out_extras: false,
		include_reel: true,
		include_suggested_users: false,
		user_id: '',
	}
//orig: {"user_id":"1514906067","include_chaining":true,"include_reel":true,"include_suggested_users":false,"include_logged_out_extras":false,"include_highlight_reels":false,"include_live_status":true}

/**
 *
 */
function notify(user, userObject, type, watchData, length_, i) {
	let url,
		fetchOptions_ = WEB_OPTS

	if (type === 0) {
		url = `https://www.instagram.com/${user}/?__a=1` // .replace('$$ANON$$', '')
		//if (user.indexOf('$$ANON$$') === 0) fetchOptions_ = { ...WEB_OPTS, credentials: 'omit' }
	} /*if (type === 1)*/ else {
		const params = { ...storiesParams }
		params.user_id = userObject.id
		url = `https://www.instagram.com/graphql/query/?query_hash=${QUERY_HASH}&variables=${JSON.stringify(params)}`
	}

	const options = { ...notificationOptions }
	fetchAux(url, fetchOptions_, 'json')
		.then(json => {
			if (type === 0) {
				handlePost(json, user, userObject, watchData, options)
			} else if (type === 1) {
				handleStory(json, user, userObject, watchData, options)
			}

			if (i === length_) chrome.storage.sync.set({ watchData })
			return json
		})
		.catch(e => {
			console.warn(e)
			if (e.status === 404) notifyError(user, options)
			if (i === length_) chrome.storage.sync.set({ watchData })
			return e
		})
}

/**
 *
 */
function createUserObject(user, watchData) {
	let fetchOptions_ = WEB_OPTS
	//if (user.indexOf('$$ANON$$') === 0) fetchOptions_ = { ...WEB_OPTS, credentials: 'omit' }

	return fetchAux(`https://www.instagram.com/${user}/?__a=1`, fetchOptions_, 'json') // .replace('$$ANON$$', '')
		.then(json => {
			if (watchData[user] === undefined)
				return (watchData[user] = {
					id: json ? json.graphql.user.id : '',
					pic: '',
					post: '',
					story: '',
				})
			return (watchData[user].id = json ? json.graphql.user.id : '')
		})
		.catch(e => {
			console.warn(e)
			if (e.status === 404) {
				const options = { ...notificationOptions }
				notifyError(user, options)
			}
			throw e
		})
}

/**
 * Fetches and compares data with saved data.
 *
 * @param {Array} users Instagram Username Array
 * @param {number} type 0 = Posts, 1 = Stories
 * @param {watchData} watchData Saved data
 */
function checkForWatchedContent(users, type, watchData) {
	const length_ = users.length - 1

	let timeout = 0
	for (let i = 0; i <= length_; ++i) {
		const user = users[i],
			userObject = watchData[user]

		if (userObject === undefined || userObject.id === '') {
			window.setTimeout(function () {
				createUserObject(user, watchData)
					.then(function (e) {
						window.setTimeout(function () {
							notify(user, watchData[user], type, watchData, length_, i)
						})
						return e
					})
					.catch(logAndReject)
			}, timeout)
			// @Fixme: edge-case: when a user deleted the post we've saved; solved by storing all 11 nodes and comparing them.
		} else window.setTimeout(notify.bind(undefined, user, watchData[user], type, watchData, length_, i), timeout)

		timeout += getRandom(1000, 15000)
	}
}
