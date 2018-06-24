'use strict'

/** Stores tab ID */
let tabId

/**
 * Creates a new tab.
 *
 * @param {Number} id Tab ID
 * @param {Boolean} force Whether to force a tab creation
 */
function createTab(id, force) {
	if (tabId !== undefined && !force) {
		chrome.tabs.update(
			tabId,
			{ active: true, url: `${chrome.runtime.getURL('index.html')}?tabid=${id}` },
			() => chrome.runtime.lastError && createTab(this, true) // only create new tab when there was an error
		)
	} else {
		chrome.tabs.create({ url: `${chrome.runtime.getURL('index.html')}?tabid=${id}` }, newTab => (tabId = newTab.id))
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
		.catch(console.error)
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
				header.value = 'Instagram 27.0.0.7.97 Android (24/7.0; 380dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; en_US)'
			} else if (header.name === 'Cookie') {
				// add auth cookies to authenticate API requests
				header.value = `${header.value}; sessionid=${sessionid}`
			}
		}

		return { requestHeaders: headers }
	},
	{
		urls: ['https://i.instagram.com/api/v1/feed/liked/*', 'https://i.instagram.com/api/v1/feed/saved/*'],
		types: ['xmlhttprequest'],
	},
	['blocking', 'requestHeaders']
)

function checkStatus(response) {
	if (response.ok) return response

	const error = new Error(`HTTP Error ${response.statusText}`)
	error.status = response.statusText
	error.response = response
	throw error
}

const get = (path, object) => path.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), object)

function logAndReturn(e) {
	console.error(e)
	return e
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
		.then(e => e.json())
		.catch(logAndReturn)
}

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
			chrome.alarms.clear('update', () => {
				chrome.alarms.create('update', { delayInMinutes: 1, periodInMinutes: 5 })
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

chrome.notifications.onClicked.addListener(id => {
	chrome.tabs.create({
		url: `https://www.instagram.com/${id.replace('post_', '').replace('story_', '')}/`,
	})
})

chrome.notifications.onButtonClicked.addListener((id, buttonIndex) => {
	if (buttonIndex === -1)
		return chrome.tabs.create({
			url: `https://www.instagram.com/${id.replace('post_', '').replace('story_', '')}/`,
		})
})

function getWatchlist(e) {
	chrome.storage.local.get({ options: null, watchData: null }, data => {
		// @todo: Switch watchData to sync
		const options = data.options
		if (chrome.runtime.lastError || options === null || data.watchData === null) return console.error(chrome.runtime.lastError.message)

		if (options.watchPosts) checkForWatchedContent(options.watchPosts, 0, data.watchData)
		if (options.watchStories !== null) checkForWatchedContent(options.watchStories, 1, data.watchData)
	})
}

function getBlobUrl(url) {
	return new Promise((resolve, reject) => {
		window
			.fetch(url)
			.then(checkStatus)
			.then(response => response.blob())
			.then(blob => resolve(URL.createObjectURL(blob)))
			.catch(e => console.error(e) && reject(e) && e)
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
	const node = get(['graphql', 'user', 'edge_owner_to_timeline_media', 'edges', '0', 'node'], json),
		id = node !== null ? node.shortcode : null
	if (id !== null && id != userObj.post) {
		console.log(user, 'new post', json.graphql.user)
		watchData[user].post = id

		options.type = 'image'
		options.title = chrome.i18n.getMessage('watch_newPost', user)

		Promise.all([getBlobUrl(json.graphql.user.profile_pic_url_hd), getBlobUrl(node.thumbnail_src)])
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
			.catch(logAndReturn)
	}
}

function handleStory(json, user, userObj, watchData, options) {
	const reel = get(['data', 'user', 'reel'], json),
		id = reel !== null ? reel.latest_reel_media : null
	if (id !== null && reel.seen !== id) {
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
			.catch(logAndReturn)
	} else console.log(user, 'no new story', reel)
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

	fetchAux(url)
		.then(json => {
			const options = Object.assign({}, notificationOptions) // eslint-disable-line

			if (type === 0) {
				handlePost(json, user, userObj, watchData, options)
			} else if (type === 1) {
				handleStory(json, user, userObj, watchData, options)
			}

			if (i === len) chrome.storage.local.set({ watchData })
			return json
		})
		.catch(logAndReturn)
}

/**
 * Fetches and compares data with saved data.
 *
 * @param {Array} users Instagram Username Array
 * @param {Integer} type 0 = Posts, 1 = Stories
 * @param {watchData} watchData Saved data
 */
function checkForWatchedContent(users, type, watchData) {
	const len = users.length - 1

	let timeout = 0
	for (let i = 0; i <= len; ++i) {
		const user = users[i],
			userObj = watchData[user]

		timeout += getRandom(400, 800)
		window.setTimeout(() => {
			notify(user, userObj, type, watchData, len, i)
		}, timeout)
		// @Fixme: edge-case: when a user deleted the post we've saved; solved by storing all 11 nodes and comparing them.
	}
}
