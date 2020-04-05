'use strict'

window.logAndReject = function logAndReject(e) {
	console.error(e)
	return Promise.reject(e)
}

class Storage {
	constructor(storage) {
		this.STORAGE = storage

		this.promise = this.promise.bind(this)
		this.set = this.set.bind(this)
		this.get = this.get.bind(this)
		this.remove = this.remove.bind(this)
	}

	promise(callback) {
		return new Promise((resolve, reject) => {
			if (chrome.storage[this.STORAGE] === undefined) return reject(new Error('Chrome storage not available'))

			try {
				return callback(resolve, reject)
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

	setObj(object) {
		return this.promise((resolve, reject) => chrome.storage[this.STORAGE].set(object, data => Storage.check(data, resolve, reject)))
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

/**
 *
 */
function fetchFromBackground(which, path, options) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ action: 'fetch', options, path, which }, text => {
			if (text === undefined && chrome.runtime.lastError) return reject(chrome.runtime.lastError.message)

			return resolve(text)
		})
	})
}

/**
 * 0 -> posts + set next max id -> max id -> posts + set next max id -> repeat from 1.
 */
class InstagramAPI {
	constructor(endpoint) {
		this.endpoint = endpoint // e.g. liked
		this.action = endpoint.slice(0, -1) // e.g. like

		this.firstRun = true
		this.nextMaxId = null
		this.items = []

		this.start = this.start.bind(this)
		this.fetch = this.fetch.bind(this)
		this.storeNext = this.storeNext.bind(this)
		this.normalize = this.normalize.bind(this)
		this.setData = this.setData.bind(this)
		this.mergeItems = this.mergeItems.bind(this)
		this.storeItems = this.storeItems.bind(this)
	}

	start() {
		if (this.firstRun) {
			return window.IG_Storage.get(this.endpoint, {
				items: [],
				nextMaxId: '',
			}).then(data => {
				this.nextMaxId = data.nextMaxId
				this.items = data.items
				return data
			})
		}
		return Promise.resolve(this.items)
	}

	fetch() {
		if (!this.firstRun && this.nextMaxId === '') return Promise.resolve(this.items) // nothing more to fetch

		return fetchFromBackground('private', `feed/${this.endpoint}/?${this.nextMaxId && !this.firstRun ? `max_id=${this.nextMaxId}&` : ''}`) // maxId means "show everything before X"
			.then(this.storeNext)
			.then(this.normalize)
			.then(this.setData)
			.then(this.storeItems)
			.catch(data => {
				console.error(data)
				return data
			})
			.catch(this.storeItems)
	}

	storeNext(data) {
		console.log(data)
		if (!this.firstRun || this.nextMaxId === '') this.nextMaxId = data.next_max_id ? `${data.next_max_id}` : ''

		return data
	}

	normalize(data) {
		const items = data.items
		if (!Array.isArray(items)) return new Error('No items')

		const length_ = items.length

		const isSaved = length_ !== 0 && items[0].media !== undefined
		for (let i = 0; i < length_; ++i) {
			if (isSaved) items[i] = items[i].media // we need to normalize "saved"

			// @todo: Rewrite to whitelist instead of blacklist
			const item = items[i]
			item.preview_comments = undefined // we don't want to store too much
			item.organic_tracking_token = undefined
			item.max_num_visible_preview_comments = undefined
			item.location = undefined // @todo
			item.lng = undefined // @todo
			item.lat = undefined // @todo
			item.inline_composer_display_condition = undefined
			item.has_viewer_saved = undefined
			item.has_more_comments = undefined
			item.filter_type = undefined
			item.device_timestamp = undefined // @todo
			item.client_cache_key = undefined // @todo
			item.caption_is_edited = undefined // @todo
			item.can_viewer_save = undefined
			item.can_viewer_reshare = undefined
			item.can_view_more_preview_comments = undefined
			item.comment_count = undefined // @todo
			item.comment_likes_enabled = undefined // @todo
			item.comment_threading_enabled = undefined
			item.photo_of_you = undefined // @todo
			item.pk = undefined
			item.original_height = undefined
			item.original_width = undefined
			item.user.friendship_status = undefined // @todo is_bestie
			item.user.has_anonymous_profile_picture = undefined
			item.user.is_favorite = undefined
			item.user.is_private = undefined
			item.user.is_unpublished = undefined
			item.user.is_verified = undefined
			item.user.pk = undefined
			item.user.profile_pic_id = undefined
			item.user.latest_reel_media = undefined

			const candidates_length = item.image_versions2 !== undefined ? item.image_versions2.candidates.length : 0
			for (let x = 0; x < candidates_length; ++x) {
				const iv = item.image_versions2.candidates[x]
				iv.estimated_scans_sizes = undefined
			}
		}

		return data
	}

	/**
	 * Compares an old dataset with a new dataset and merges accordingly. If a match has been found, the new data set is always preferred.
	 * n := old dataset length
	 * m := new datset length
	 *
	 * Runs from min(n, m) until 0 and compares all items from the new dataset with the current item `i` from the new.
	 * Then replaces all items from the old dataset, that are lower than the found `match` number.
	 *
	 * This has one caveat: We can't replace older items and thus there might be deleted items still left. We can not delete them.
	 *
	 * @param {object} items
	 * @return {Bool} True if a match has been found
	 */
	mergeItems(items) {
		const length_ = items.length - 1
		const oldItems = this.items,
			oldLength = oldItems.length - 1,
			optimizedLen = Math.min(length_, oldLength)

		let match = -1
		outer: for (let i = optimizedLen; i >= 0; --i) {
			for (let x = length_; x >= 0; --x) {
				// compare every new item to `i` old item
				if (oldItems[i].id !== items[x].id) continue
				match = i
				break outer
			}
		}

		// no match
		if (match === -1) {
			this.items = items
			return false
		}

		this.items = items.concat(oldItems.splice(match + 1)) // add new items to the start
		return true
	}

	setData(data) {
		if (this.firstRun) this.mergeItems(data.items)
		else this.items = this.items.concat(data.items)
		this.firstRun = false

		return data
	}

	storeItems(data) {
		window.IG_Storage.set(this.endpoint, {
			items: this.items,
			nextMaxId: this.nextMaxId,
		})

		return data
	}

	add(id) {
		let node = this.action
		if (node === 'like') node += 's'

		return fetchFromBackground('public', `${node}/${id}/${this.action}/`)
	}

	remove(id) {
		let node = this.action
		if (node === 'like') node += 's'

		return fetchFromBackground('public', `${node}/${id}/un${this.action}/`)
	}
}
