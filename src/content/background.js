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
 * @param name
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
		if (details.initiator !== `chrome-extension://${chrome.runtime.id}`) return

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
			} else if (name === 'cookie' && header.value.indexOf('sessionid=') === -1)
				// add auth cookies to authenticate API requests
				header.value = `${header.value}; sessionid=${sessionid}`
		}

		return { requestHeaders: headers }
	},
	{
		types: ['xmlhttprequest'],
		urls: [
			'https://i.instagram.com/api/v1/feed/liked/*',
			'https://i.instagram.com/api/v1/feed/saved/*',
			'https://i.instagram.com/api/v1/feed/collection/*',
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
		if (details.initiator !== `chrome-extension://${chrome.runtime.id}`) return

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
		types: ['image', 'media', 'xmlhttprequest'],
		urls: [
			'*://*.fbcdn.net/*',
			'*://*.cdninstagram.com/*',
			// private_web
			'https://i.instagram.com/api/v1/*',
			'https://www.instagram.com/graphql/*',
		],
	},
	['blocking', 'requestHeaders', 'extraHeaders']
)

/**
 * @param response
 */
function checkStatus(response) {
	if (response.ok) return response

	const error = new Error(`HTTP Error ${response.statusText}`)
	error.status = response.status
	error.response = response
	throw error
}

/**
 * @param response
 */
function toText(response) {
	return response.text()
}

/**
 * @param response
 */
function toJSON(response) {
	return response.json()
}

/**
 * @param e
 */
function logAndReject(e) {
	console.warn(e)
	return Promise.reject(e)
}

/**
 * @param response
 */
function fixMaxId(response) {
	const response_ = response.replace(/"next_max_id":(\d+)/g, '"next_max_id":"$1"')
	;/\s*/g.exec('') // clear regex cache to prevent memory leak
	return response_
}

/**
 * @param response
 */
function parseJSON(response) {
	return JSON.parse(response)
}

const API_URL = {
	PRIVATE: 'https://i.instagram.com/api/v1/',
	PRIVATE_WEB: 'https://i.instagram.com/api/v1/', // once web has more abilities, replace PRIVATE
	PUBLIC: 'https://www.instagram.com/web/',
	GRAPHQL: 'https://www.instagram.com/graphql/query/',
}

const PRIVATE_API_OPTS = {
	headers: {
		Accept: '*/*',
		'Accept-Language': 'en-US',
		'X-FB-HTTP-Engine': 'Liger',
		'X-IG-App-ID': '567067343352427',
		'X-IG-Bandwidth-Speed-KBPS': '-1.000',
		'X-IG-Bandwidth-TotalBytes-B': '0',
		'X-IG-Bandwidth-TotalTime-MS': '0',
		'X-IG-Capabilities': '3brTvw==',
		'X-IG-Connection-Speed': `${Math.trunc(Math.random() * 5000 + 1000)}kbps`,
		'X-IG-Connection-Type': 'WIFI',
	},
	method: 'GET',
	// credits to https://github.com/mgp25/Instagram-API/blob/master/src/Request.php#L377
}

const FB_APP_ID = '936619743392459'

const PRIVATE_WEB_API_OPTS = {
	headers: {
		'x-asbd-id': '',
		'X-IG-App-ID': FB_APP_ID,
		'X-IG-WWW-Claim': '',
	},
	method: 'GET',
}

// sync with components/feed/FetchComponent
const PUBLIC_API_OPTS = {
	headers: {
		'x-asbd-id': '',
		'x-csrftoken': '',
		'X-IG-App-ID': FB_APP_ID,
		'x-instagram-ajax': '',
		'x-requested-with': 'XMLHttpRequest',
	},
	method: 'POST',
}

const GRAPHQL_API_OPTS = {
	// sync with FetchComponent
	headers: {
		'x-asbd-id': '',
		'x-csrftoken': '',
		'X-IG-App-ID': FB_APP_ID,
		'X-IG-WWW-Claim': '',
		'x-requested-with': 'XMLHttpRequest',
	},
	method: 'GET',
}

const WEB_OPTS = {
	headers: {
		'x-asbd-id': '',
		'x-ig-app-id': FB_APP_ID,
		'x-ig-www-claim': '',
		'x-requested-with': 'XMLHttpRequest',
	},
	method: 'GET',
}

/**
 * @param which
 * @param path
 * @param sendResponse
 * @param options
 * @param error
 */
function fetchFromBackground(which, path, sendResponse, options, error) {
	if (which === 'PUBLIC') {
		getCookie('csrftoken') // sync with FetchComponent
			.then(value => {
				PUBLIC_API_OPTS.headers['x-asbd-id'] = localStorage['asbd-id']
				PUBLIC_API_OPTS.headers['x-csrftoken'] = value
				PUBLIC_API_OPTS.headers['x-instagram-ajax'] = localStorage['rollout-hash']
				fetchAux(API_URL[which] + path, PUBLIC_API_OPTS)

				return value
			})
			.catch(logAndReject)

		return false // for now
	}

	if (which === 'PRIVATE_WEB') {
		PRIVATE_WEB_API_OPTS.headers['X-IG-WWW-Claim'] = localStorage['ig-claim']
		PRIVATE_WEB_API_OPTS.headers['x-asbd-id'] = localStorage['asbd-id']
		fetchAux(API_URL[which] + path, PRIVATE_WEB_API_OPTS, 'text')
			.then(fixMaxId)
			.then(parseJSON)
			.then(sendResponse)
			.catch(error || sendResponse)

		return true
	}

	if (which === 'GRAPHQL') {
		getCookie('csrftoken') // sync with FetchComponent
			.then(value => {
				GRAPHQL_API_OPTS.headers['x-asbd-id'] = localStorage['asbd-id']
				GRAPHQL_API_OPTS.headers['X-IG-WWW-Claim'] = localStorage['ig-claim']
				GRAPHQL_API_OPTS.headers['x-csrftoken'] = value
				fetchAux(API_URL[which] + path, GRAPHQL_API_OPTS, 'json')
					.then(sendResponse)
					.catch(error)

				return value
			})
			.catch(logAndReject)

		return false // for now
	}

	const opts = { ...PRIVATE_API_OPTS, ...options }
	if ((opts.method === undefined || opts.method !== 'GET') && opts.body !== undefined) {
		opts.headers['Content-Type'] = 'application/x-www-form-urlencoded; charset=UTF-8'
		opts.body = new FormData()
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
 * @param url
 * @param options
 * @param type
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
		try {
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
				if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
					resolve(xhr.response)
				} else {
					logAndReject(xhr)
				}
			})

			xhr.addEventListener('error', logAndReject)
			xhr.addEventListener('abort', logAndReject)

			xhr.send()
		} catch (e) {
			logAndReject(e)
		}
	})
}

/**
 * @param min
 * @param max
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

		case 'asbd-id':
			window.localStorage['asbd-id'] = request.path
			break

		default:
			break
	}

	return false
})

/**
 * @param when
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
 * @param id
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
 * @param e
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

		if (options.watchPosts) {
			checkForWatchedContent(options.watchPosts, 0, data.watchData) // posts
			checkForWatchedContent(options.watchPosts, 2, data.watchData) // tagged photos
			checkForWatchedContent(options.watchPosts, 3, data.watchData) // igtv
			// checkForWatchedContent(options.watchPosts, 4, data.watchData) // reels
		}

		if (options.watchStories) checkForWatchedContent(options.watchStories, 1, data.watchData) // story
	})
}

/**
 * @param url
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
 * @param url
 */
function getProfilePicId(url) {
	const pic_id = url.split('/')

	return pic_id[pic_id.length - 1].split('?')[0].split('.')[0]
}

/**
 * @param json
 * @param user
 * @param userObject
 * @param watchData
 * @param options
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
		//console.log(user, 'no new post', node)

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
 * @param json
 * @param user
 * @param userObject
 * @param watchData
 * @param options
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

	const isLive = userJson.is_live,
		highlightId = get(['edge_highlight_reels', 'edges', '0', 'node', 'id'], userJson),
		followerId = get(['edge_chaining', 'edges', '0', 'node', 'id'], userJson)

	if (highlightId !== null) watchData[user].highlight = highlightId // @todo could check for rename
	if (followerId !== null && watchData[user].follower && watchData[user].follower !== followerId)
		console.warn(user, 'new common follower', followerId)
	watchData[user].follower = followerId
	// watchData[user].live = isLive

	const isStoryUnseen = id !== null && id > reel.seen
	const isNewHighlight = watchData[user].highlight && watchData[user].highlight !== highlightId
	const needsProfilePic = isStoryUnseen || isNewHighlight || isLive

	if (!needsProfilePic) return
	const blob = getBlobUrl(reel.owner.profile_pic_url)
	const promises = []

	if (isStoryUnseen) {
		// && id != userObj.story
		console.log(user, 'new story')
		//watchData[user].story = `${id}`

		promises.push(
			blob.then(url => createNotification(`story;stories/${user}/`, chrome.i18n.getMessage('watch_newStory', user), options, url))
		)
	} else console.log(user, 'no new story', reel)

	if (isNewHighlight) {
		promises.push(
			blob.then(url => createNotification(`highlight;${user}/`, chrome.i18n.getMessage('watch_newHighlight', user), options, url))
		)
	}

	if (isLive) {
		// @todo when timer is < 60 min, enable check if notification has been sent already
		promises.push(
			blob.then(url => createNotification(`live;${user}/`, chrome.i18n.getMessage('watch_isLive', user), options, url)).catch(logAndReject)
		)
	}

	Promise.all(promises)
		.then(url => URL.revokeObjectURL(url))
		.catch(logAndReject)
}

function createNotification(id, title, options, url) {
	options.type = 'basic'
	options.title = title
	options.iconUrl = url

	chrome.notifications.create(id, options, nId => {
		if (chrome.runtime.lastError) console.error(chrome.runtime.lastError.message)
		// @todo: Maybe clear notification?
	})

	return url
}

function handleGraphQL(type, json, user, userObject, watchData, options) {
	const userJson = get(['data', 'user'], json)
	if (userJson === null) {
		notifyError(user, options)
	}

	const path = type === 2 ? ['edge_user_to_photos_of_you', 'edges', '0', 'node'] : ['edge_felix_video_timeline', 'edges', '0', 'node']
	const typeStr = type === 2 ? 'tagged' : 'tv'
	const data = watchData[user][typeStr]
	if (!data || path.shortcode === data) return

	const action = type === 2 ? 'p' : 'tv'
	const shortcode = path.shortcode
	watchData[user][typeStr] = shortcode

	getBlobUrl(path.display_url)
		.then(url => createNotification(`${typeStr};${action}/${shortcode}`, chrome.i18n.getMessage(`watch_new${typeStr}`, user), options, url))
		.then(url => URL.revokeObjectURL(url))
		.catch(logAndReject)
}

/**
 * @param user
 * @param options
 */
function notifyError(user, options) {
	options.type = 'basic'
	options.title = `${user} could not be found`
	options.message = `${user} might have changed the Instagram nickname. Please go to the options and remove the name.`
	options.iconUrl = 'img/icon-128.png'
	chrome.notifications.create(`error;${user}/`, options) // @TODO: Add 'click to remove'
}

const GRAPHQL_PARAMS = {
	story: {
		hash: 'd4d88dc1500312af6f937f7b804c68c3', // @TODO Update regularely, last check 17.06.2021 - request loads on any profile
		params: {
			include_chaining: true,
			include_highlight_reels: true,
			include_live_status: true,
			include_logged_out_extras: false,
			include_reel: true,
			include_suggested_users: false,
			user_id: '',
		},
	},

	tagged: {
		// referer: https://www.instagram.com/XXX/tagged/
		hash: 'be13233562af2d229b008d2976b998b5', // @TODO Update regularely, last check 24.06.2021 - request loads on any profile on tagged tab
		params: { id: '', first: 12 },
	},

	tv: {
		// referer: https://www.instagram.com/XXX/channel/
		hash: 'bc78b344a68ed16dd5d7f264681c4c76', // @TODO Update regularely, last check 24.06.2021 - request loads on any profile on IGTV tab
		params: { id: '', first: 12 },
	},
}

/**
 * @param user
 * @param userObject
 * @param type
 * @param watchData
 * @param length_
 * @param i
 */
function notify(user, userObject, type, watchData, length_, i) {
	WEB_OPTS.headers['X-IG-WWW-Claim'] = localStorage['ig-claim']
	WEB_OPTS.headers['x-asbd-id'] = localStorage['asbd-id']

	let url,
		queryType = ''

	if (type === 0 || type === 4) {
		queryType = 'PRIVATE_WEB'
		url = type === 0 ? `users/${userObject.id}/info/` : `clips/user/` // .replace('$$ANON$$', '')
		//if (user.indexOf('$$ANON$$') === 0) fetchOptions_ = { ...WEB_OPTS, credentials: 'omit' }
	} /*if (type === 1)*/ else if (type === 1 || type === 2 || type === 3) {
		queryType = 'GRAPHQL'
		const params = GRAPHQL_PARAMS[type === 1 ? 'story' : type === 2 ? 'tagged' : 'tv']
		if (type === 1) params.params.user_id = userObject.id
		else params.params.id = userObject.id

		url = `?query_hash=${params.hash}&variables=${JSON.stringify(params.params)}`
	}

	const options = { ...notificationOptions }
	fetchFromBackground(
		queryType,
		url,
		function (json) {
			switch (type) {
				case 0: {
					handlePost(json, user, userObject, watchData, options)
					break
				}

				case 1: {
					handleStory(json, user, userObject, watchData, options)
					break
				}

				case 2:
				case 3: {
					handleGraphQL(type, json, user, userObject, watchData, options)
					break
				}
				// No default
			}

			if (i === length_) chrome.storage.sync.set({ watchData })
			return json
		},
		undefined,
		function (e) {
			console.warn(e)
			if (e.status === 404) notifyError(user, options)
			if (i === length_) chrome.storage.sync.set({ watchData })
			return e
		}
	)
}

/**
 * @param user
 * @param watchData
 */
function createUserObject(user, watchData) {
	WEB_OPTS.headers['X-IG-WWW-Claim'] = localStorage['ig-claim']
	WEB_OPTS.headers['x-asbd-id'] = localStorage['asbd-id']

	const fetchOptions_ = WEB_OPTS
	//if (user.indexOf('$$ANON$$') === 0) fetchOptions_ = { ...WEB_OPTS, credentials: 'omit' }

	return fetchAux(`https://www.instagram.com/${user}/?__a=1`, fetchOptions_, 'json') // .replace('$$ANON$$', '')
		.then(json => {
			if (watchData[user] === undefined)
				return (watchData[user] = {
					id: json ? json.graphql.user.id : '',
					/*pic: '',
					post: '',
					story: '',
					highlight: '',
					tv: '',
					follower: '',
					reel: '',
					tagged: '',*/
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

/*
reels:
https://i.instagram.com/api/v1/clips/user/ POST
x-asbd-id: ...
x-csrftoken: ...
x-ig-app-id: ...
x-ig-www-claim: ...
x-instagram-ajax: ...

target_user_id: ...
page_size: 12
max_id:

items[0]
*/
