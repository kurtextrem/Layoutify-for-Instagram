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

class Storage {
	constructor(storage) {
		this.STORAGE = storage

		this.promise = this.promise.bind(this)
		this.set = this.set.bind(this)
		this.get = this.get.bind(this)
		this.remove = this.remove.bind(this)
	}

	promise(cb) {
		return new Promise((resolve, reject) => {
			if (chrome.storage[this.STORAGE] === undefined) reject('') // @TODO: Don't emit on SSR

			try {
				cb(resolve, reject)
			} catch (e) {
				reject(e)
			}
		})
	}

	set(key, value) {
		return this.promise((resolve, reject) =>
			chrome.storage[this.STORAGE].set({ [key]: value }, data => Storage.check(data, resolve, reject))
		)
	}

	get(key, defaultValue) {
		return this.promise((resolve, reject) =>
			chrome.storage[this.STORAGE].get(defaultValue !== undefined ? { [key]: defaultValue } : key, data =>
				Storage.check(data, resolve, reject)
			)
		)
	}

	remove(key) {
		return this.promise((resolve, reject) => chrome.storage[this.STORAGE].remove(key, data => Storage.check(data, resolve, reject)))
	}

	getBytes() {
		return this.promise((resolve, reject) => chrome.storage[this.STORAGE].getBytesInUse(null, resolve))
	}

	static check(data, resolve, reject) {
		if (chrome.runtime.lastError) {
			console.error(chrome.runtime.lastError.message)
			/*if (chrome.runtime.lastError.message.indexOf('QUOTA_BYTES') !== 0) {
				alert('Because you have a lot of likes / collections, please go to "About" and clear old data.')
			}*/
			return reject(chrome.runtime.lastError.message)
		}

		return resolve(data)
	}
}
const localStorage = new Storage('local')

/**
 * @param name
 */
function getCookie(name) {
	return new Promise((resolve, reject) => {
		chrome.cookies.get({ name, url: 'https://www.instagram.com/' }, function cookies(cookie) {
			if (cookie !== null) resolve(cookie.value)
			reject()
		})
	})
}

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
	;/\s*/.exec('') // clear regex cache to prevent memory leak
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
	WEB: 'https://www.instagram.com/',
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
		'x-ig-app-id': FB_APP_ID,
		'x-ig-www-claim': '',
	},
	method: 'GET',
}

// sync with components/feed/FetchComponent
const PUBLIC_API_OPTS = {
	headers: {
		'x-asbd-id': '',
		'x-csrftoken': '',
		'x-ig-app-id': FB_APP_ID,
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
		'x-ig-app-id': FB_APP_ID,
		'x-ig-www-claim': '',
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
async function fetchFromBackground(which, path, sendResponse, options, error) {
	const {
		'asbd-id': asbdId,
		'rollout-hash': rolloutHash,
		'ig-claim': igClaim,
	} = await localStorage.get({ 'asbd-id': '', 'rollout-hash': '', 'ig-claim': '' })
	if (!asbdId || !rolloutHash || !igClaim) {
		console.error('no', asbdId, rolloutHash, igClaim)
		return
	}

	if (which === 'PUBLIC') {
		getCookie('csrftoken') // sync with FetchComponent
			.then(value => {
				PUBLIC_API_OPTS.headers['x-asbd-id'] = asbdId
				PUBLIC_API_OPTS.headers['x-csrftoken'] = value
				PUBLIC_API_OPTS.headers['x-instagram-ajax'] = rolloutHash
				fetchAux(API_URL[which] + path, PUBLIC_API_OPTS)

				return value
			})
			.catch(logAndReject)

		return
	}

	if (which === 'PRIVATE_WEB') {
		PRIVATE_WEB_API_OPTS.headers['x-asbd-id'] = asbdId
		PRIVATE_WEB_API_OPTS.headers['x-ig-www-claim'] = igClaim
		fetchAux(API_URL[which] + path, PRIVATE_WEB_API_OPTS, 'text')
			.then(fixMaxId)
			.then(parseJSON)
			.then(sendResponse)
			.catch(error || sendResponse)

		return
	}

	if (which === 'GRAPHQL') {
		getCookie('csrftoken') // sync with FetchComponent
			.then(value => {
				GRAPHQL_API_OPTS.headers['x-asbd-id'] = asbdId
				GRAPHQL_API_OPTS.headers['x-ig-www-claim'] = igClaim
				GRAPHQL_API_OPTS.headers['x-csrftoken'] = value
				fetchAux(API_URL[which] + path, GRAPHQL_API_OPTS, 'json')
					.then(sendResponse)
					.catch(error)

				return value
			})
			.catch(logAndReject)

		return
	}

	if (which === 'WEB') {
		WEB_OPTS.headers['x-asbd-id'] = asbdId
		WEB_OPTS.headers['x-ig-www-claim'] = igClaim

		fetchAux(API_URL[which] + path, WEB_OPTS, 'json')
			.then(sendResponse)
			.catch(error)

		return
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

	return fetch(url, opts)
		.then(checkStatus)
		.then(type === 'json' ? toJSON : toText)
		.catch(logAndReject)
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
			localStorage.set('ig-claim', request.path)
			break

		case 'rollout-hash':
			localStorage.set('rollout-hash', request.path)
			break

		case 'asbd-id':
			localStorage.set('asbd-id', request.path)
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
		periodInMinutes: 57, // @todo Try to get this as low as possible, 15: acc locked
		when: when || undefined,
	})
}

/** Open Changelog when updating to a new major/minor version. */
chrome.runtime.onInstalled.addListener(details => {
	//importScripts('webrequest.js')

	;(function () {
		let id = 0

		// this is a workaround until https://bugs.chromium.org/p/chromium/issues/detail?id=1226276#c4 is fixed.
		chrome.declarativeNetRequest.getDynamicRules(function (rules) {
			if (rules.length > 2) return // already loaded

			chrome.declarativeNetRequest.updateDynamicRules({
				addRules: [
					/** So we can load images/videos on 3-dots page. */
					...[
						'fbcdn.net',
						'cdninstagram.com',
						// private_web
						'i.instagram.com/api/v1/*',
						'instagram.com',
					].map(item => ({
						id: ++id,
						priority: 1,
						action: {
							type: 'modifyHeaders',
							requestHeaders: [
								{
									header: 'referer',
									operation: 'set',
									value: 'https://www.instagram.com/',
								},
							],
						},
						condition: {
							urlFilter: `||${item}`,
							domains: [chrome.runtime.id],
							resourceTypes: ['image', 'media', 'xmlhttprequest'],
						},
					})),

					// Hook into web request and modify headers before sending the request
					...['i.instagram.com/api/v1/feed/liked/*', 'i.instagram.com/api/v1/feed/saved/*', 'i.instagram.com/api/v1/feed/collection/*'].map(
						item => ({
							id: ++id,
							priority: 1,
							action: {
								type: 'modifyHeaders',
								requestHeaders: [
									{
										header: 'user-agent',
										operation: 'set',
										value:
											'Instagram 121.0.0.29.119 Android (24/7.0; 380dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; en_US; 185203708)',
									},
								],
							},
							condition: {
								urlFilter: `||${item}`,
								domains: [chrome.runtime.id],
								resourceTypes: ['xmlhttprequest'],
							},
						})
					),
				],
			})
		})
	})()

	if (details.reason !== chrome.runtime.OnInstalledReason.UPDATE) return

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

async function watchNow(e) {
	const now = Date.now()
	const INTERVAL = 900000 // 15min
	const last = (await localStorage.get('ige_lastFetch', 0)).ige_lastFetch
	if (now - last > INTERVAL) {
		await localStorage.set('ige_lastFetch', now)
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
			// checkForWatchedContent(options.watchPosts, 3, data.watchData) // reels
		}

		if (options.watchStories) checkForWatchedContent(options.watchStories, 1, data.watchData) // story
	})
}

/*const blobToBase64 = blob => {
	const reader = new FileReader()
	reader.readAsDataURL(blob)
	return new Promise(resolve => {
		reader.onloadend = () => {
			resolve(reader.result)
		}
	})
}*/

/**
 * @param url
 */
function getBlobUrl(url) {
	return url
	/*return new Promise((resolve, reject) => {
		fetch(url)
			.then(checkStatus)
			.then(response => response.blob())
			.then(blobToBase64)
			.catch(e => {
				console.error(e)
				reject(e)
			})
	})*/
}

const notificationOptions = {
	iconUrl: '',
	imageUrl: '',
	message: '',
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

function cmpAndNotify(value, storeKey, i18nKey, notificationPath, store, blob, user, options) {
	if (!value) return false

	const hasNew = value !== store[storeKey]
	store[storeKey] = value

	const getMessage = {
		watch_isLive: 'Live',
		watch_newHighlight: 'Highlight',
		watch_newtv: 'TV',
		watch_privtrue: 'Private',
		watch_privfalse: 'Unprivate,',
	}

	if (hasNew) {
		blob.then(url => createNotification(`${storeKey};${notificationPath}`, `Instagram ${getMessage[i18nKey]}: ${user}`, options, url)) // chrome.i18n.getMessage(i18nKey, user)
		return true
	}

	return false
}

/**
 * @param json
 * @param user
 * @param userObject
 * @param watchData
 * @param options
 */
function handlePost(json, user, userObject, watchData, options) {
	// @todo graphql.user.is_private
	const userNode = get(['graphql', 'user'], json)
	if (userNode === null) {
		notifyError(user, options)
		return
	}

	const node = get(['edge_owner_to_timeline_media', 'edges', '0', 'node'], userNode)
	const data = watchData[user]

	const pic = userNode.profile_pic_url_hd

	let load, cancel
	const blob = new Promise((resolve, reject) => {
		load = resolve
		cancel = reject
	})
		.then(() => getBlobUrl(pic))
		.catch(() => {})

	const isPrivate = userNode.is_private
	const hasPrivateChanged = cmpAndNotify(userNode.is_private, 'priv', `watch_priv${isPrivate}`, `${user}/`, data, blob, user, options)

	const tvShort = get(['edge_felix_video_timeline', 'edges', '0', 'node', 'shortcode'], userNode)
	const hasNewTV = cmpAndNotify(tvShort, 'tv', `watch_newtv`, `tv/${tvShort}`, data, blob, user, options)

	const oldPicId = data.pic ? getProfilePicId(data.pic) : '', // @todo Migration code getProfilePicId
		picId = getProfilePicId(pic)
	const profilePictureChanged = oldPicId !== picId
	data.pic = picId

	if (profilePictureChanged) blob.then(url => createNotification(`pic;${user}/`, `Instagram Avatar: ${user}`, options, url)) // chrome.i18n.getMessage(`watch_newPic`, user)

	const id = node.shortcode
	const hasNewPost = id !== null && id != userObject.post
	data.post = id
	if (hasNewPost) {
		// if no post exsits, or if String/Number id == userObject.post (String)
		//console.log(user, 'no new post', node)
		console.log(user, 'new post', node, userObject.post)

		load()
		Promise.all([blob, getBlobUrl(node.thumbnail_src)])
			.then(values => {
				options.type = 'image'
				options.title = `Instagram: ${user}` //chrome.i18n.getMessage('watch_newPost', user) // @TODO
				options.message = node.edge_media_to_caption?.edges?.[0].node?.text || node.location?.name // chrome.i18n.getMessage('watch_openProfile') // @TODO
				options.iconUrl = values[0]
				options.imageUrl = values[1]

				return chrome.notifications.create(`post;p/${id}/`, options, nId => {
					if (chrome.runtime.lastError) console.error(chrome.runtime.lastError.message)
					// @todo: Maybe clear notification?
				})
			})
			.catch(logAndReject)

		return
	}

	if (hasPrivateChanged || hasNewTV || profilePictureChanged) {
		load()
	} else cancel()
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

	const reel = userJson.reel
	const data = watchData[user]

	let load, cancel
	const blob = new Promise((resolve, reject) => {
		load = resolve
		cancel = reject
	})
		.then(() => getBlobUrl(reel.owner.profile_pic_url))
		.catch(() => {})

	/* @todo Collect all edge_highlight_reels IDs -> highlight:ID check
	const reels = get(['edge_highlight_reels', 'edges'])
	if (reels !== null) {
		const reelIds = []
		for (let i = 0; i < reels.length; ++i) {
			reelIds.push(reels[i].node.id)
		}
	} */

	const followerId = get(['edge_chaining', 'edges', '0', 'node', 'id'], userJson)
	if (followerId !== null && data.follower && data.follower !== followerId) console.warn(user, 'new common follower', followerId)
	data.follower = followerId

	const highlightId = get(['edge_highlight_reels', 'edges', '0', 'node', 'id'], userJson)
	const hasNewHighlight = cmpAndNotify(highlightId, 'highlight', `watch_newHighlight`, `${user}/`, data, blob, user, options) // @todo could check for rename

	const isLive = cmpAndNotify(userJson.is_live, 'live', `watch_isLive`, `${user}/`, data, blob, user, options) // @todo when timer is < 60 min, enable check if notification has been sent already

	const id = reel !== null ? reel.latest_reel_media : null
	if (reel.seen > id) console.warn(user, 'seen id > current id: story deleted?')
	const isStoryUnseen = id !== null && id > reel.seen
	if (isStoryUnseen) {
		// && id != userObj.story
		console.log(user, 'new story')
		//data.story = `${id}`

		blob.then(url => createNotification(`story;stories/${user}/`, `Instagram Story: ${user}`, options, url)) // chrome.i18n.getMessage('watch_newStory', user)
	} // else console.log(user, 'no new story', reel)

	if (isStoryUnseen || hasNewHighlight || isLive) {
		load()
	} else cancel()
}

function createNotification(id, title, options, url) {
	options.type = 'basic'
	options.title = title
	options.message = `--> instagram.com/${id.split(';')[1]}` //chrome.i18n.getMessage('watch_openProfile') // @TODO
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

	const path = ['edge_user_to_photos_of_you', 'edges', '0', 'node']
	const typeStr = 'tagged'
	const data = watchData[user][typeStr]
	if (!data || path.shortcode === data) return

	const action = 'p'
	const shortcode = path.shortcode
	watchData[user][typeStr] = shortcode

	getBlobUrl(path.display_url)
		.then(url => createNotification(`${typeStr};${action}/${shortcode}`, `Instagram Tagged: ${user}`, options, url)) // chrome.i18n.getMessage(`watch_new${typeStr}`, user), // @TODO
		.catch(logAndReject)
}

/**
 * @param user
 * @param options
 */
function notifyError(user, options) {
	options.type = 'basic'
	options.title = `${user} could not be found`
	options.message = `${user} might have changed the Instagram nickname. Please go to the options and update the name.`
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
	let url,
		queryType = ''

	switch (type) {
		case 0: {
			// @todo user.profile_context_mutual_follow_ids -> fetchFromBackground('PRIVATE_WEB', `users/${id}/info/`, console.log)
			queryType = 'WEB'
			url = `${user.replace('$$ANON$$', '')}/?__a=1`

			break
		}

		case 1:
		case 2: {
			queryType = 'GRAPHQL'
			const params = GRAPHQL_PARAMS[type === 1 ? 'story' : 'tagged']
			if (type === 1) params.params.user_id = userObject.id
			else params.params.id = userObject.id

			url = `?query_hash=${params.hash}&variables=${JSON.stringify(params.params)}`

			break
		}

		case 3: {
			queryType = 'PRIVATE_WEB'
			url = `clips/user/`

			break
		}

		default:
			return
	}

	const options = { ...notificationOptions }
	fetchFromBackground(
		queryType,
		url,
		json => {
			switch (type) {
				case 0: {
					handlePost(json, user, userObject, watchData, options)
					break
				}

				case 1: {
					handleStory(json, user, userObject, watchData, options)
					break
				}

				case 2: {
					handleGraphQL(type, json, user, userObject, watchData, options)
					break
				}

				default:
					return
			}

			if (i === length_) chrome.storage.sync.set({ watchData })
		},
		user.indexOf('$$ANON$$') === 0 ? { ...WEB_OPTS, credentials: 'omit' } : undefined,
		e => {
			console.warn(e)
			if (e.status === 404) notifyError(user, options)
			if (i === length_) chrome.storage.sync.set({ watchData })
		}
	)
}

/**
 * @param user
 * @param watchData
 */
function createUserObject(user, watchData) {
	return new Promise((resolve, reject) => {
		fetchFromBackground(
			'WEB',
			`${user.replace('$$ANON$$', '')}/?__a=1`,
			json => {
				if (watchData[user] === undefined) {
					watchData[user] = {
						id: json ? json.graphql.user.id : '',
						/*pic: '',
					post: '',
					story: '',
					highlight: '',
					tv: '',
					follower: '',
					reel: '',
					tagged: '',*/
					}
					resolve()
				}

				watchData[user].id = json ? json.graphql.user.id : reject()
			},
			user.indexOf('$$ANON$$') === 0 ? { ...WEB_OPTS, credentials: 'omit' } : undefined,
			e => {
				console.warn(e)
				if (e.status === 404) {
					const options = { ...notificationOptions }
					notifyError(user, options)
				}

				reject()
			}
		)
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
			setTimeout(function () {
				createUserObject(user, watchData)
					.then(function () {
						notify(user, watchData[user], type, watchData, length_, i)
					})
					.catch(logAndReject)
			}, timeout)
			// @Fixme: edge-case: when a user deleted the post we've saved; solved by storing all 11 nodes and comparing them.
		} else setTimeout(notify.bind(undefined, user, watchData[user], type, watchData, length_, i), timeout)

		timeout += getRandom(5000, 25000)
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

----------------------

check highlight reels for new items:
-> track changed title for each
https://i.instagram.com/api/v1/feed/reels_media/
reel_ids: highlight:XXX
reel_ids: highlight:XXX
reel_ids: highlight:XXX
reel_ids: highlight:XXX
reel_ids: highlight:XXX

reels["highlight:XXX"].latest_reel_media
*/
