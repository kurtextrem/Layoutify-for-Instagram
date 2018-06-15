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

function fetch(url, headers) {
	return window
		.fetch(url, { headers, credentials: 'include', mode: 'cors' })
		.then(checkStatus)
		.then(e => e.json())
		.catch(e => console.error(e) && e)
}

function getRandom(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

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

function checkForWatchedContent() {
	const users = {}
	const headers = new Headers({
		'x-requested-with': 'XMLHttpRequest',
	})

	for (const user in users) {
		const rand = getRandom(400, 700)

		window.setTimeout(() => {
			fetch(`/${user.name}/?__a=1`, headers).then(json => {
				const id = get(['graphql', 'user', 'edge_owner_to_timeline_media', 'edges', '0', 'node', 'shortcode'], json)
				if (id !== users[userId].post) notify()

				return json
			})
		}, rand)

		window.setTimeout(() => {
			const params = Object.assign({}, storiesParams)
			params.user_id = user.id
			fetch(
				'https://www.instagram.com/graphql/query/?' +
					new URLSearchParams({ query_hash: QUERY_HASH, variables: JSON.stringify(storiesParams) }).toString()
			).then(json => {
				const reel = get(['data', 'user', 'reel'], json)
				if (reel.seen === null && reel.latest_reel_media !== users[userId].story) notify()

				return json
			})
		}, rand + getRandom(100, 200))
		// @Fixme: edge-case: when a user deleted the post we've saved; solved by storing all 11 nodes and comparing them.
	}
}
