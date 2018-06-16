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

function fetch(url) {
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
		.catch(e => console.error(e) && e)
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

chrome.alarms.onAlarm.addListener(() => {
	getWatchlist()
})

function getWatchlist() {
	chrome.storage.local.get({ watchPosts: null, watchStories: null, watchData: {} }, data => {
		if (chrome.runtime.lastError) return console.error(chrome.runtime.lastError)

		if (data.watchPosts !== null) checkForWatchedContent(data.watchPosts, 0, data.watchData)
		if (data.watchStories !== null) checkForWatchedContent(data.watchStories, 1, data.watchData)
	})
}

const QUERY_HASH = '9ca88e465c3f866a76f7adee3871bdd8',
	storiesParams = {
		user_id: '',
		include_chaining: false,
		include_reel: true,
		include_suggested_users: false,
		include_logged_out_extras: false,
		include_highlight_reels: true,
	}
//orig: {"user_id":"XX","include_chaining":true,"include_reel":true,"include_suggested_users":false,"include_logged_out_extras":false,"include_highlight_reels":true}

/**
 * Fetches and compares data with saved data.
 *
 * @param {Array} users Instagram Username Array
 * @param {Integer} type 0 = Posts, 1 = Stories
 * @param {watchData} watchData Saved data
 */
function checkForWatchedContent(users, type, watchData) {
	function notify(user, userObj) {
		let url
		if (type === 0) url = `https://www.instagram.com/${curr}/?__a=1`
		if (type === 1) {
			const params = Object.assign({}, storiesParams) // eslint-disable-line
			params.user_id = userObj.id
			url = `https://www.instagram.com/graphql/query/?${new URLSearchParams({
				query_hash: QUERY_HASH,
				variables: JSON.stringify(storiesParams),
			}).toString()}`
		}

		fetch(url)
			.then(json => {
				let shouldNotify = ''
				const options = {
					type: '',
					title: '',
					message: 'Click to open the profile.',
					iconUrl: '', // profile pic
					imageUrl: '',
				}

				if (type === 0) {
					const node = get(['graphql', 'user', 'edge_owner_to_timeline_media', 'edges', '0', 'node'], json),
						id = node !== null ? node.shortcode : null
					if (id !== userObj.post) {
						userObj.post = id
						shouldNotify = id

						options.type = 'image'
						options.title = `${user} posted a new post`
						options.iconUrl = json.graphql.profile_pic_url_hd
						options.imageUrl = node.thumbnail_src
					}
				}

				if (type === 1) {
					const reel = get(['data', 'user', 'reel'], json),
						id = reel.latest_reel_media
					if (reel.seen === null && id !== userObj.story) {
						userObj.story = `${reel.latest_reel_media}`
						shouldNotify = id

						options.type = 'basic'
						options.title = `${user} posted a new story`
						options.iconUrl = reel.owner.profile_pic_url
					}
				}

				if (shouldNotify !== '')
					chrome.notifications.create(`ige_${shouldNotify}`, options, _nId => {
						if (chrome.runtime.lastError) console.error(chrome.runtime.lastError)
						// @todo: Maybe clear?
					})

				return json
			})
			.catch(e => console.error(e) && e)
	}

	const len = users.length - 1
	for (let i = 0; i <= len; ++i) {
		const user = users[i],
			userObj = watchData[user]

		window.setTimeout(() => {
			notify(user, userObj)
			if (i === len) chrome.storage.local.set({ watchData })
		}, getRandom(400, 700))
		// @Fixme: edge-case: when a user deleted the post we've saved; solved by storing all 11 nodes and comparing them.
	}
}
