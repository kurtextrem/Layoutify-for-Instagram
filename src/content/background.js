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
			{
				active: true,
				url: `${chrome.runtime.getURL('index.html')}?tabid=${id}`,
			},
			() => chrome.runtime.lastError && createTab(id, true) // only create new tab when there was an error
		)
	} else {
		chrome.tabs.create({ url: `${chrome.runtime.getURL('index.html')}?tabid=${id}` }, newTab => (tabId = newTab.id))
	}
}

/**
 *
 */
function getCookie(name) {
	return new Promise((resolve, reject) => {
		chrome.cookies.get(
			{
				url: 'https://www.instagram.com/',
				name,
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
		getSessionId() // just update for next time

		const headers = details.requestHeaders

		for (const i in headers) {
			const header = headers[i]

			if (header.name === 'User-Agent') {
				// credit https://github.com/mgp25/Instagram-API/master/src/Constants.php
				header.value =
					'Instagram 42.0.0.19.95 Android (24/7.0; 380dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; en_US; 104766893)'
			} else if (header.name === 'Cookie') {
				// add auth cookies to authenticate API requests
				header.value = `${header.value}; sessionid=${sessionid}`
			}
		}

		return { requestHeaders: headers }
	},
	{
		urls: ['https://i.instagram.com/*'],
		types: ['xmlhttprequest'],
	},
	['blocking', 'requestHeaders', 'extraHeaders']
)

chrome.webRequest.onHeadersReceived.addListener(
	modifyCspHeaders,
	{
		urls: ['https://i.instagram.com/*'],
		types: ['xmlhttprequest'],
	},
	['blocking', 'responseHeaders', 'extraHeaders']
)

/**
 *
 */
function modifyCspHeaders(details) {
	const headers = details.responseHeaders

	for (const i in headers) {
		const header = headers[i]

		if (header.name.toLowerCase() === 'content-security-policy') {
			header.value.replace("connect-src 'self'", `connect-src 'self' https://i.instagram.com`)
		}
	}

	return { responseHeaders: details.responseHeaders }
}

const fetchOptions = {
	credentials: 'include',
	mode: 'cors',
}

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
	const response_ = response.replace(/"next_max_id": (\d+)/g, '"next_max_id": "$1"')
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
	PUBLIC: 'https://www.instagram.com/web/',
}

const PRIVATE_API_OPTS = {
	referrerPolicy: 'no-referrer',

	// credits to https://github.com/mgp25/Instagram-API/blob/master/src/Request.php#L377
	headers: new Headers({
		'X-IG-App-ID': '567067343352427',
		'X-IG-Capabilities': '3brTBw==',
		'X-IG-Connection-Type': 'WIFI',
		'X-IG-Connection-Speed': '3700kbps',
		'X-IG-Bandwidth-Speed-KBPS': '-1.000',
		'X-IG-Bandwidth-TotalBytes-B': '0',
		'X-IG-Bandwidth-TotalTime-MS': '0',
		'X-FB-HTTP-Engine': 'Liger',
		Accept: '*/*',
		'Accept-Language': 'en-US',
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
		Connection: 'keep-alive',
	}),
}

const PUBLIC_API_OPTS = {
	method: 'POST',
	headers: new Headers({
		'x-csrftoken': '',
		'x-instagram-ajax': '1',
		'x-requested-with': 'XMLHttpRequest',
	}),
}

/**
 *
 */
function fetchFromBackground(which, path, sendResponse) {
	if (which === 'PUBLIC') {
		getCookie('csrftoken')
			.then(value => {
				PUBLIC_API_OPTS.headers.set('x-csrftoken', value)
				fetchAux(API_URL[which] + path, PUBLIC_API_OPTS)

				return value
			})
			.catch(logAndReject)

		return false // for now
	}

	fetchAux(API_URL[which] + path, PRIVATE_API_OPTS)
		.then(toText)
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
function fetchAux(url, options) {
	let options_ = fetchOptions
	if (options !== undefined) options_ = { ...options_, ...options }

	return fetch(url, options_)
		.then(checkStatus)
		.catch(logAndReject)
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
			getWatchlist()
			break

		case 'watchInBackground':
			createUpdateAlarm()
			break

		case 'stopWatchInBackground':
			chrome.alarms.clear('update')
			break

		case 'fetch':
			fetchFromBackground(request.which.toUpperCase(), request.path, sendResponse)
			return true

		default:
			break
	}

	return false
})

/**
 *
 */
function createUpdateAlarm() {
	chrome.alarms.create('update', {
		delayInMinutes: 1,
		periodInMinutes: 4,
	})
}

/** Open Changelog when updating to a new major/minor version. */
chrome.runtime.onInstalled.addListener(details => {
	if (details.reason !== 'update') return

	createUpdateAlarm()

	const currentVersion = chrome.runtime.getManifest().version,
		splitNew = currentVersion.split('.'),
		splitOld = details.previousVersion.split('.')
	if (+splitNew[0] > +splitOld[0] || +splitNew[1] > +splitOld[1])
		// we only check major und minor, nothing else
		chrome.tabs.create({
			url: `${chrome.runtime.getURL('index.html')}#/changelog`,
		})
})

chrome.alarms.onAlarm.addListener(getWatchlist)

/**
 *
 */
function openIG(id) {
	chrome.tabs.create({
		url: `https://www.instagram.com/${id
			.split('_')
			.splice(1)
			.join('_')}/`,
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
	type: '',
	title: '',
	message: chrome.i18n.getMessage('watch_openProfile'),
	iconUrl: '', // profile pic
	imageUrl: '',
}

const QUERY_HASH = '9ca88e465c3f866a76f7adee3871bdd8',
	storiesParams = {
		user_id: '',
		include_chaining: false,
		include_reel: true,
		include_suggested_users: false,
		include_logged_out_extras: false,
		include_highlight_reels: false,
	}
//orig: {"user_id":"XX","include_chaining":true,"include_reel":true,"include_suggested_users":false,"include_logged_out_extras":false,"include_highlight_reels":true}

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
			options.title = chrome.i18n.getMessage('watch_newPic', user)

			getBlobUrl(pic)
				.then(url => {
					options.iconUrl = url
					return chrome.notifications.create(`pic_${user}`, options, nId => {
						if (chrome.runtime.lastError) console.error(chrome.runtime.lastError.message)
						URL.revokeObjectURL(url)
						// @todo: Maybe clear notification?
					})
				})
				.catch(logAndReject)
		}
		return
	}

	console.log(user, 'new post', json.graphql.user)
	watchData[user].post = id

	options.type = 'image'
	options.title = chrome.i18n.getMessage('watch_newPost', user)

	Promise.all([getBlobUrl(pic), getBlobUrl(node.thumbnail_src)])
		.then(values => {
			options.iconUrl = values[0]
			options.imageUrl = values[1]
			return chrome.notifications.create(`post_${user}`, options, nId => {
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
				return chrome.notifications.create(`story_${user}`, options, nId => {
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
	chrome.notifications.create(`error_${user}`, options, undefined) // @TODO: Add 'click to remove'
}

const WEB_OPTS = {
	headers: new Headers({
		'x-requested-with': 'XMLHttpRequest',
	}),
}

/**
 *
 */
function notify(user, userObject, type, watchData, length_, i) {
	let url,
		fetchOptions_ = WEB_OPTS

	if (type === 0) {
		url = `https://www.instagram.com/${user.replace('$$ANON$$', '')}/?__a=1`
		if (user.indexOf('$$ANON$$') === 0) fetchOptions_ = { ...WEB_OPTS, credentials: 'omit' }
	} /*if (type === 1)*/ else {
		const params = { ...storiesParams }
		params.user_id = userObject.id
		url = `https://www.instagram.com/graphql/query/?${new URLSearchParams({
			query_hash: QUERY_HASH,
			variables: JSON.stringify(params),
		}).toString()}`
	}

	const options = { ...notificationOptions }
	fetchAux(url, fetchOptions_)
		.then(toJSON)
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
	if (user.indexOf('$$ANON$$') === 0) fetchOptions_ = { ...WEB_OPTS, credentials: 'omit' }

	return fetchAux(`https://www.instagram.com/${user.replace('$$ANON$$', '')}/?__a=1`, fetchOptions_)
		.then(toJSON)
		.then(json => {
			if (watchData[user] === undefined)
				return (watchData[user] = {
					id: json ? json.graphql.user.id : '',
					post: '',
					story: '',
					pic: '',
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
			window.setTimeout(function() {
				createUserObject(user, watchData)
					.then(function(e) {
						notify(user, watchData[user], type, watchData, length_, i)
						return e
					})
					.catch(logAndReject)
			}, timeout)
			// @Fixme: edge-case: when a user deleted the post we've saved; solved by storing all 11 nodes and comparing them.
		} else window.setTimeout(notify.bind(undefined, user, watchData[user], type, watchData, length_, i), timeout)

		timeout += getRandom(1000, 15000)
	}
}
