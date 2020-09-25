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
			delete item.preview_comments // we don't want to store too much
			delete item.organic_tracking_token
			delete item.max_num_visible_preview_comments
			delete item.location // @todo
			delete item.lng // @todo
			delete item.lat // @todo
			delete item.inline_composer_display_condition
			delete item.has_viewer_saved
			delete item.has_more_comments
			delete item.filter_type
			delete item.device_timestamp // @todo
			delete item.client_cache_key // @todo
			delete item.caption_is_edited // @todo
			delete item.can_viewer_save
			delete item.can_viewer_reshare
			delete item.can_view_more_preview_comments
			delete item.comment_count // @todo
			delete item.comment_likes_enabled // @todo
			delete item.comment_threading_enabled
			delete item.photo_of_you // @todo
			delete item.pk
			delete item.original_height
			delete item.original_width
			delete item.user.friendship_status // @todo is_bestie
			delete item.user.has_anonymous_profile_picture
			delete item.user.is_favorite
			delete item.user.is_private
			delete item.user.is_unpublished
			delete item.user.is_verified
			delete item.user.pk
			delete item.user.profile_pic_id
			delete item.user.latest_reel_media
			delete item.can_see_insights_as_brand
			delete item.inline_composer_imp_trigger_time
			if (item.caption) {
				delete item.caption.bit_flags
				delete item.caption.content_type
				delete item.caption.did_report_as_spam
				delete item.caption.share_enabled
				delete item.caption.user
				delete item.caption.type
				delete item.caption.pk
			}
			delete item.video_dash_manifest
			delete item.video_duration
			delete item.video_codec
			delete item.is_dash_eligible

			const candidates_length = item.image_versions2 !== undefined ? item.image_versions2.candidates.length : 0
			for (let x = 0; x < candidates_length; ++x) {
				const iv = item.image_versions2.candidates[x]
				delete iv.estimated_scans_sizes
			}
		}

		return data
	}

	/**
	 * Simple merging algorithm: Checks the first items of each set, if they match, replace n items of the old set, with n := length items of the new set.
	 *
	 * This has one caveat: We can't replace older items and thus there might be deleted items still left. We can not delete them.
	 *
	 * @param {object} items
	 * @return {object} items
	 */
	mergeItems(items) {
		if (!items || items.length === 0) return this.items
		if (this.items.length === 0 || items[0].id !== this.items[0].id) {
			this.items = items
			return this.items
		}

		// remove items.length items from this.items
		this.items.splice(0, items.length - 1, ...this.items)
		return this.items
	}

	setData(data) {
		if (this.firstRun) {
			this.mergeItems(data.items)
			this.firstRun = false
		} else this.items = this.items.concat(data.items)

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
