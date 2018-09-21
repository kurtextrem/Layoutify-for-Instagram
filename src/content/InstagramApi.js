'use strict'

window.logAndReturn = function logAndReturn(e) {
	console.error(e)
	return e
}

const fetchOptions = {
	credentials: 'include',
	mode: 'cors',
}

// credits to https://github.com/mgp25/Instagram-API/blob/master/src/Request.php#L377
const headers = new Headers({
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
})

function fetchAux(url, options) {
	const opts = fetchOptions
	opts.referrerPolicy = 'no-referrer' // we only want that when requesting the private API
	opts.headers = headers
	if (options !== undefined) Object.assign(opts, options) // eslint-disable-line

	return window
		.fetch(url, opts)
		.then(checkStatus)
		.then(toText)
		.then(fixMaxId)
		.then(parseJSON)
		.catch(window.logAndReturn)
}

function checkStatus(response) {
	if (response.ok) return response

	const error = new Error(`HTTP Error ${response.statusText}`)
	error.status = response.statusText
	error.response = response
	throw error
}

function toText(response) {
	return response.text()
}

const fixMaxIdRegex = /"next_max_id": (\d+)/g
function fixMaxId(response) {
	return response.replace(fixMaxIdRegex, '"next_max_id": "$1"')
}

function parseJSON(response) {
	return JSON.parse(response)
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
			if (chrome.storage[this.STORAGE] === undefined) return reject(new Error('Chrome storage not available'))

			try {
				return cb(resolve, reject)
			} catch (e) {
				return reject(e)
			}
		})
	}

	set(key, value) {
		return this.promise((resolve, reject) =>
			chrome.storage[this.STORAGE].set({ [key]: value }, data => Storage.check(data, resolve, reject))
		)
	}

	setObj(obj) {
		return this.promise((resolve, reject) => chrome.storage[this.STORAGE].set(obj, data => Storage.check(data, resolve, reject)))
	}

	get(key, defaultValue) {
		return this.promise((resolve, reject) =>
			chrome.storage[this.STORAGE].get({ [key]: defaultValue }, data => Storage.check(data[key], resolve, reject))
		)
	}

	remove(key) {
		return this.promise((resolve, reject) => chrome.storage[this.STORAGE].remove(key, data => Storage.check(data, resolve, reject)))
	}

	static check(data, resolve, reject) {
		if (chrome.runtime.lastError) {
			console.error(chrome.runtime.lastError.message)
			return reject(chrome.runtime.lastError.message)
		}

		return resolve(data)
	}
}

window.IG_Storage = new Storage('local')
window.IG_Storage_Sync = new Storage('sync')

function getCookies(wanted) {
	const cookies = document.cookie.split('; '),
		result = {}

	for (const i in cookies) {
		const cookie = cookies[i].split('='),
			index = wanted.indexOf(cookie[0])
		if (index !== -1) {
			result[wanted[index]] = cookie[1]
		}
	}

	return result
}

const API = 'https://i.instagram.com/api/v1/'
const WEB_API = 'https://www.instagram.com/web/'

const UID = getCookies(['ds_user_id']).ds_user_id,
	UUID = '' // 'android-' + SparkMD5.hash(document.getElementsByClassName('coreSpriteDesktopNavProfile')[0].href.split('/')[3]).slice(0, 16)

/**
 * 0 -> posts + set next max id -> max id -> posts + set next max id -> repeat from 1.
 */
class InstagramAPI {
	constructor(endpoint) {
		this.endpoint = endpoint // e.g. liked
		this.action = endpoint.slice(0, -1) // e.g. like
		this.uid = UID
		this.uuid = UUID

		this.firstNextMaxId = undefined
		this.firstRun = true

		this.nextMaxId = null
		this.items = []

		this.start = this.start.bind(this)
		this.fetch = this.fetch.bind(this)
		this.storeNext = this.storeNext.bind(this)
		this.normalize = this.normalize.bind(this)
		this.storeData = this.storeData.bind(this)
	}

	start() {
		if (this.firstNextMaxId === undefined) {
			return window.IG_Storage.get(this.endpoint, { items: [], nextMaxId: '' }).then(data => {
				this.firstNextMaxId = data.nextMaxId
				this.items = data.items
				return data
			})
		}
		return Promise.resolve(this.items)
	}

	fetch() {
		if (this.nextMaxId === '') return Promise.resolve(this.items) // nothing more to fetch

		return fetchAux(`${API}feed/${this.endpoint}/?${this.nextMaxId ? `max_id=${this.nextMaxId}&` : ''}`) // maxId means "show everything before X"
			.then(this.storeNext)
			.then(this.normalize)
			.then(this.storeData)
	}

	storeNext(data) {
		console.log(data)
		this.nextMaxId = data.next_max_id !== undefined ? `${data.next_max_id}` : ''

		return data
	}

	normalize(data) {
		if (Array.isArray(data.items) && data.items[0].media !== undefined) {
			// we need to normalize "saved"
			data.items = data.items.map(item => item.media)
		}
		return data
	}

	/**
	 * Compares an old dataset with a new dataset and merges accordingly.
	 * n := old dataset length
	 * m := new datset length
	 *
	 * Runs from min(n, m) until 0 and compares all items from the new dataset with the current item `i` from the new.
	 * Then replaces all items from the old dataset, that are lower than the found `match` number.
	 *
	 * This has one caveat: We can't replace older items and thus there might be deleted items still left. We can not delete them.
	 *
	 * @param {Object} items
	 * @return {Bool} True if items have been merged
	 */
	mergeItems(items) {
		if (!Array.isArray(items)) return false // don't add

		const len = items.length - 1
		const oldItems = this.items,
			safeLen = Math.min(len, oldItems.length - 1)

		if (safeLen === -1 || len === -1) return false

		let match = -1
		outer: for (let i = safeLen; i >= 0; --i) {
			for (let x = len; x >= 0; --x) {
				// compare every X to i
				if (oldItems[i].id === items[x].id) {
					match = i
					break outer
				}
			}
		}

		// no match, no merge
		if (match === -1) return false

		this.items = items.concat(oldItems.splice(match)) // add stored items to back
		return true
	}

	storeData(data) {
		const merged = this.mergeItems(data.items) // modifies this.items inline

		// If this was first run and we found no matches that means our data is too old (e.g. items got removed by user, or a lot added)
		if (this.firstRun && !merged && this.firstNextMaxId !== this.nextMaxId) {
			this.items = []
		}
		this.firstRun = false

		// Add new (older) items to the back
		if (!merged) this.items = this.items.concat(data.items)

		window.IG_Storage.set(this.endpoint, { items: this.items, nextMaxId: this.nextMaxId })

		return this.items
	}

	add(id) {
		const cookies = getCookies(['csrftoken']),
			headers = new Headers({
				'x-csrftoken': cookies.csrftoken,
				'x-instagram-ajax': '1',
				'x-requested-with': 'XMLHttpRequest',
			})

		let node = this.action
		if (node === 'like') node += 's'

		return fetchAux(`${WEB_API}${node}/${id}/${this.action}/`, {
			method: 'POST',
			headers,
		})
	}

	remove(id) {
		const cookies = getCookies(['csrftoken']),
			headers = new Headers({
				'x-csrftoken': cookies.csrftoken,
				'x-instagram-ajax': '1',
				'x-requested-with': 'XMLHttpRequest',
			})

		let node = this.action
		if (node === 'like') node += 's'

		return fetchAux(`${WEB_API}${node}/${id}/un${this.action}/`, {
			method: 'POST',
			headers,
		})
	}
}
