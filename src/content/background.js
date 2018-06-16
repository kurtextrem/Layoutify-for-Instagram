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

chrome.runtime.onMessage.addListener(function listener(request, sender, sendResponse) {
	if (request.action === 'click') createTab(sender.tab.id, false)
})

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

function fetch(url) {
	return window
		.fetch(url, {
			headers: new Headers({
				'x-requested-with': 'XMLHttpRequest',
			}),
			credentials: 'include',
			mode: 'cors'
		})
		.then(checkStatus)
		.then(e => e.json())
		.catch(e => console.error(e) && e)
}

function getRandom(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

chrome.runtime.onInstalled.addListener(() => {
	chrome.alarms.clear('update', () => {
		chrome.alarms.create('update', { delayInMinutes: 1, periodInMinutes: 5 })
	})
})
chrome.alarms.onAlarm.addListener(() => {
	chrome.storage['local'].get({ watchPosts: null, watchStories: null, watchData: null }, data => {
		if (chrome.runtime.lastError) return console.error(chrome.runtime.lastError)

		if (data.watchPosts !== null)
			checkForWatchedContent(data.watchPosts, 0, data.watchData)
		if (data.watchStories !== null)
			checkForWatchedContent(data.watchStories, 1, data.watchData)

		return
	})
})

const QUERY_HASH = '9ca88e465c3f866a76f7adee3871bdd8',
	storiesParams = {
		user_id: null,
		include_chaining: false,
		include_reel: true,
		include_suggested_users: false,
		include_logged_out_extras: false,
		include_highlight_reels: true,
	}
//orig: {"user_id":"XX","include_chaining":true,"include_reel":true,"include_suggested_users":false,"include_logged_out_extras":false,"include_highlight_reels":true}

/**
 * watchData type
 * name: { // username
 * 	id: Integer, // user_id
 * 	post: String, // short_code
 * 	story: Integer, // latest_reel_media id
 * }
 */

/**
 * Fetches and compares data with saved data.
 * 
 * @param {Object} users 
 * @param {Integer} type 0 = Posts, 1 = Stories
 * @param {watchData} watchData Saved data
 */
function checkForWatchedContent(users, type, watchData) {
	const len = users.length - 1
	for (let i = 0; i <= len; ++i) {
		const user = users[i],
			userObj = watchData[user]

		window.setTimeout(() => {
			let url
			if (type === 0)
				url = `/${curr}/?__a=1`
			if (type === 1) {
				const params = Object.assign({}, storiesParams)
				params.user_id = userObj.id
				url = 'https://www.instagram.com/graphql/query/?' +
					new URLSearchParams({ query_hash: QUERY_HASH, variables: JSON.stringify(storiesParams) }).toString()
			}

			fetch(url).then(json => {
				let notify = ''
				const options = {
					type: '',
					title: '',
					message: '',
					iconUrl: '', // profile pic
					imageUrl: '',
				}

				if (type === 0) {
					const id = get(['graphql', 'user', 'edge_owner_to_timeline_media', 'edges', '0', 'node', 'shortcode'], json)
					if (id !== userObj.post) {
						userObj.post = id
						notify = id

						options.type = 'image'
						options.title = user + ' posted a new post'
					}
				}

				if (type === 1) {
					const reel = get(['data', 'user', 'reel'], json),
						id = reel.latest_reel_media
					if (reel.seen === null && id !== userObj.story) {
						userObj.story = reel.latest_reel_media
						notify = id

						options.type = 'basic'
						options.title = user + ' posted a new story'
					}
				}

				// notification perission setzen!
				if (notify !== '')
					chrome.notifications.create('ige_' + notify, options, _nId => {
						if (chrome.runtime.lastError) return

						// clear after 30 seconds or never?
					})

				if (i === len) chrome.storage['local'].set({ watchData })

				return json
			})
		}, getRandom(400, 700))
		// @Fixme: edge-case: when a user deleted the post we've saved; solved by storing all 11 nodes and comparing them.
	}
}