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
		chrome.tabs.create(
			{ url: `${chrome.runtime.getURL('index.html')}?tabid=${id}` },
			newTab => (tabId = newTab.id)
		)
	}
}

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
function getSessionId() {
	getCookie('sessionid')
		.then(value => (sessionid = value))
		.catch(logAndReturn)
}

getSessionId()

const extraInfoSpec = ['blocking']
if (chrome.webRequest.OnBeforeSendHeadersOptions.EXTRA_HEADERS !== undefined)
	extraInfoSpec.push('extraHeaders') // needed for Chrome 72+, https://groups.google.com/a/chromium.org/forum/#!topic/chromium-extensions/vYIaeezZwfQ

const typeSpec = {
	urls: ['https://i.instagram.com/*'],
	types: ['xmlhttprequest'],
},

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
	typeSpec,
	extraInfoSpec.concat('requestHeaders')
)

function modifyCspHeaders(details) {
	const headers = details.responseHeaders

	for (const i in headers) {
		const header = headers[i]

		if (header.name.toLowerCase() === 'content-security-policy') {
			header.value.replace(
				"connect-src 'self'",
				`connect-src 'self' https://i.instagram.com`
			)
		}
	}

	return { responseHeaders: details.responseHeaders }
}

chrome.webRequest.onHeadersReceived.addListener(
	modifyCspHeaders,
	typeSpec,
	extraInfoSpec.concat('responseHeaders')
)

function checkStatus(response) {
	if (response.ok) return response

	const error = new Error(response.statusText)
	error.status = response.status
	error.response = response
	throw error
}

const get = (path, object) =>
	path.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), object)

function logAndReturn(e) {
	console.warn(e)
	return e
}

function toJSON(e) {
	return e.json()
}

function fetchAux(url) {
	return window
		.fetch(url, {
			headers: new Headers({
				'x-requested-with': 'XMLHttpRequest',
			}),
			credentials: 'include',
			mode: 'cors',
		})
		.then(checkStatus)
		.then(toJSON)
}

function getRandom(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

chrome.runtime.onMessage.addListener(function listener(
	request,
	sender,
	sendResponse
) {
	switch (request.action) {
		case 'click':
			createTab(sender.tab.id, false)
			break

		case 'watchNow':
			getWatchlist()
			break

		case 'watchInBackground':
			chrome.alarms.clear('update', () => {
				chrome.alarms.create('update', {
					delayInMinutes: 1,
					periodInMinutes: 5,
				})
			})
			break

		case 'stopWatchInBackground':
			chrome.alarms.clear('update')
			break

		default:
			break
	}
})

/** Open Changelog when updating to a new major/minor version. */
chrome.runtime.onInstalled.addListener(details => {
	if (details.reason !== 'update') return

	// @TODO: Migration code. Remove for v3.0
	chrome.storage.local.get({ options: null }, data => {
		if (data.options === null) return

		chrome.storage.sync.set({ options: data.options })
		chrome.storage.local.remove('options')
	})
	chrome.storage.local.get({ watchData: null }, data => {
		if (data.watchData === null) return

		chrome.storage.sync.set({ watchData: data.watchData })
		chrome.storage.local.remove('watchData')
	})

	const currentVersion = chrome.runtime.getManifest().version,
		splitNew = currentVersion.split('.'),
		oldVersion = details.previousVersion,
		splitOld = oldVersion.split('.')
	if (splitNew[0] > splitOld[0] || splitNew[1] > splitOld[1])
		// we only check major und minor, nothing else
		chrome.tabs.create({
			url: `${chrome.runtime.getURL('index.html')}#/changelog`,
		})
})

chrome.alarms.onAlarm.addListener(getWatchlist)

function openIG(id) {
	chrome.tabs.create({
		url: `https://www.instagram.com/${id
			.replace('post_', '')
			.replace('story_', '')
			.replace('error_', '')}/`,
	})
}
chrome.notifications.onClicked.addListener(openIG)

chrome.notifications.onButtonClicked.addListener((id, buttonIndex) => {
	if (buttonIndex !== -1) return
	openIG(id)
})

function getWatchlist(e) {
	chrome.storage.sync.get({ options: null, watchData: null }, data => {
		const options = data.options
		if (chrome.runtime.lastError) {
			console.error(chrome.runtime.lastError.message)
			return
		}
		if (options === null || data.watchData === null) {
			console.error('Empty options/watchData', options, data.watchData)
			return
		}

		if (options.watchPosts)
			checkForWatchedContent(options.watchPosts, 0, data.watchData)
		if (options.watchStories)
			checkForWatchedContent(options.watchStories, 1, data.watchData)
	})
}

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

function handlePost(json, user, userObj, watchData, options) {
	const node = get(
			['graphql', 'user', 'edge_owner_to_timeline_media', 'edges', '0', 'node'],
			json
		),
		id = node !== null ? node.shortcode : null
	if (id !== null && id != userObj.post) {
		console.log(user, 'new post', json.graphql.user)
		watchData[user].post = id

		options.type = 'image'
		options.title = chrome.i18n.getMessage('watch_newPost', user)

		Promise.all([
			getBlobUrl(json.graphql.user.profile_pic_url_hd),
			getBlobUrl(node.thumbnail_src),
		])
			.then(values => {
				options.iconUrl = values[0]
				options.imageUrl = values[1]
				return chrome.notifications.create(`post_${user}`, options, nId => {
					if (chrome.runtime.lastError)
						console.error(chrome.runtime.lastError.message)
					URL.revokeObjectURL(values[0])
					URL.revokeObjectURL(values[1])
					// @todo: Maybe clear notification?
				})
			})
			.catch(logAndReturn)
	}
}

function handleStory(json, user, userObj, watchData, options) {
	const userJson = get(['data', 'user'], json)
	if (userJson === null) {
		notifyError(user, options)
		return
	}

	const reel = userJson.reel,
		id = reel !== null ? reel.latest_reel_media : null

	if (reel.seen > id) console.warn('seen id > current id: story deleted?')
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
					if (chrome.runtime.lastError)
						console.error(chrome.runtime.lastError.message)
					URL.revokeObjectURL(url)
					// @todo: Maybe clear notification?
				})
			})
			.catch(logAndReturn)
	} else console.log(user, 'no new story', reel)
}

function notifyError(user, options) {
	options.type = 'basic'
	options.title = `${user} could not be found`
	options.message = `${user} might have changed the Instagram nickname. Please go to the options and remove the name.`
	options.iconUrl = 'img/icon-128.png'
	chrome.notifications.create(`error_${user}`, options, undefined) // @TODO: Add 'click to remove'
}

function notify(user, userObj, type, watchData, len, i) {
	let url
	if (type === 0) url = `https://www.instagram.com/${user}/?__a=1`
	if (type === 1) {
		const params = Object.assign({}, storiesParams) // eslint-disable-line
		params.user_id = userObj.id
		url = `https://www.instagram.com/graphql/query/?${new URLSearchParams({
			query_hash: QUERY_HASH,
			variables: JSON.stringify(params),
		}).toString()}`
	}

	const options = Object.assign({}, notificationOptions) // eslint-disable-line
	fetchAux(url)
		.then(json => {
			if (type === 0) {
				handlePost(json, user, userObj, watchData, options)
			} else if (type === 1) {
				handleStory(json, user, userObj, watchData, options)
			}

			if (i === len) chrome.storage.sync.set({ watchData })
			return json
		})
		.catch(e => {
			console.warn(e)
			if (e.status === 404) notifyError(user, options)
			if (i === len) chrome.storage.sync.set({ watchData })
			return e
		})
}

function createUserObj(user, watchData) {
	fetchAux(`https://www.instagram.com/${user}/?__a=1`)
		.then(json => {
			if (watchData[user] === undefined)
				return (watchData[user] = {
					id: json ? json.graphql.user.id : '',
					post: '',
					story: '',
				})
			return (watchData[user].id = json ? json.graphql.user.id : '')
		})
		.catch(e => {
			console.warn(e)
			if (e.status === 404) {
				const options = Object.assign({}, notificationOptions) // eslint-disable-line
				notifyError(user, options)
			}
			return e
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
	const len = users.length - 1

	let timeout = 0
	for (let i = 0; i <= len; ++i) {
		const user = users[i],
			userObj = watchData[user]

		if (userObj === undefined || userObj.id === '')
			createUserObj(user, watchData)

		timeout += getRandom(400, 800)
		window.setTimeout(() => {
			notify(user, watchData[user], type, watchData, len, i)
		}, timeout)
		// @Fixme: edge-case: when a user deleted the post we've saved; solved by storing all 11 nodes and comparing them.
	}
}
