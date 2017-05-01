(function(window) {
	'use strict'

	const API = 'https://i.instagram.com/api/v1/'
	const fetchOptions = {
		accept: 'application/json',
		credentials: 'include'
	}

	function fetch(url) {
		return window.fetch(API + url, fetchOptions)
			.then(checkStatus)
			.then(parseJSON)
	}

	function checkStatus(response) {
		if (response.status >= 200 && response.status < 300) {
			return response
		}

		const error = new Error(`HTTP Error ${response.statusText}`)
		error.status = response.statusText
		error.response = response
		console.log(error)
		throw error
	}

	function parseJSON(response) {
		return response.json()
	}

	class storage {
		constructor() {
			this.STORAGE = 'local'
		}

		set(key, value) {
			return new Promise((resolve, reject) => {
				chrome.storage[this.STORAGE].set({
					[key]: value
				}, (data) => this.check(data, resolve, reject))
			})
		}


		get(key, defaultValue) {
			return new Promise((resolve, reject) => {
				chrome.storage[this.STORAGE].get({
					[key]: defaultValue
				}, (data) => this.check(data[key], resolve, reject))
			})
		}

		remove(key) {
			return new Promise((resolve, reject) => {
				chrome.storage[this.STORAGE].remove(key, (data) => this.check(data, resolve, reject))
			})
		}

		check(data, resolve, reject) {
			if (chrome.runtime.lastError) {
				console.error(chrome.runtime.lastError)
				return reject(chrome.runtime.lastError)
			}

			return resolve(data)
		}
	}

	var Storage = new storage()

	/**
	 * 0 -> posts + set next max id -> max id -> posts + set next max id -> repeat from 1.
	 *
	 * @class Instagram
	 */
	class Instagram {
		constructor(endpoint) {
			this.endpoint = endpoint
			this.opt = {}
			if (this.endpoint === 'saved')
				this.opt.method = 'POST'

			this.firstNextMaxId = ''
			this.firstRun = true
			this.nextMaxId = null
			this.items = []

			this.start = () => {
				if (this.firstNextMaxId === '')
					return Storage.get(this.endpoint, { items: [], nextMaxId: '' })
						.then((data) => {
							this.firstNextMaxId = data.nextMaxId
							this.items = data.items
							return data
						})
				return this.items
			}
		}

		storeNext(data) {
			console.log(data)
			this.nextMaxId = data.next_max_id !== undefined ? String(data.next_max_id) : ''

			return data
		}

		fetch() {
			if (this.nextMaxId === '') return Promise.resolve(this.data) // nothing more to fetch

			return fetch('feed/' + this.endpoint + '/' + (this.nextMaxId ? '?max_id=' + this.nextMaxId : ''), this.opt)
				.then(this.storeNext.bind(this))
				.then(this.normalize.bind(this))
				.then(this.storeData.bind(this))
		}

		normalize(data) {
			if (Array.isArray(data.items) && data.items[0].media !== undefined) { // we need to normalize
				data.items = data.items.map((item) => item.media)
			}
			return data
		}

		/**
		 * The intention: Compare the first `len` elements of the old item data set with the new data set
		 * To do this, we compare the last elem's id of the new data set with `len` elems of the old.
		 *
		 * @param {object} data will modify object
		 * @return {boolean} Whether the function found a matching item or not
		 */
		compareData(data) {
			var len = data.items.length,
				last = data.items[len - 1],
				lastId = last.media !== undefined ? last.media.id : last.id,
				maxLen = Math.min(len, this.items.length), // don't exceed either array len
				match = false
			for (var i = 0; i < maxLen; ++i) {
				var this_id = this.items[i].media !== undefined ? this.items[i].media.id : this.items[i].id

				if (lastId === this_id) { // next elements are older
					match = true
					data.items.push(...this.items.slice(i + 1))
					this.items = data.items
					break
				}
			}

			return match
		}

		storeData(data) {
			console.log('before', this.items)
			console.log('before2', data.items)
			const match = this.compareData(data)
			console.log('after', this.items)
			console.log('after2', data.items)

			// If this was first run and we found no matches that means our data is too old
			if (this.firstRun && !match && this.firstNextMaxId !== this.nextMaxId) {
				this.items = []
			}
			this.firstRun = false

			// Add (older) items
			if (!match)
				this.items.push(...data.items)

			Storage.set(this.endpoint, { items: this.items, nextMaxId: this.nextMaxId })

			return this.items
		}

			// else we don't want to save anything new
			return false
		}
	}

	window.getInstagram = Instagram
}(window))
