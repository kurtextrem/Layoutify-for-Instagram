(function(window) {
	'use strict'

	const API = 'https://i.instagram.com/api/v1/'
	const fetchOptions = {
		accept: 'application/json',
		credentials: 'include'
	}

	function fetch(url, options) {
		var opts = fetchOptions
		if (options !== undefined)
			opts = { ...fetchOptions, ...options }

		return window.fetch(API + url, opts)
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

		fetch() {
			if (this.nextMaxId === '') return Promise.resolve(this.data) // nothing more to fetch

			return fetch('feed/' + this.endpoint + '/' + (this.nextMaxId ? '?max_id=' + this.nextMaxId : '')) // maxId means "show everything before X"
				.then(this.storeNext.bind(this))
				.then(this.normalize.bind(this))
				.then(this.storeData.bind(this))
		}

		storeNext(data) {
			console.log(data)
			this.nextMaxId = data.next_max_id !== undefined ? String(data.next_max_id) : ''

			return data
		}

		normalize(data) {
			if (data.items !== undefined && data.items.length && data.items[0].media !== undefined) { // we need to normalize "saved"
				data.items = data.items.map((item) => item.media)
			}
			return data
		}

		/**
		 * Compare the first `len` elements of the old item data set with the new data set
		 * To do this, we compare the last elem's id of the new data set with `len` elems of the old.
		 *
		 * @param 	{@object} 	data
		 * @return 	{boolean} 	Whether the function found a matching item or not
		 */
		// !! wenn nicht geht -> komplett sessionStorage
		compareData(data) {
			var len = data.items.length,
				lastId = data.items[len - 1].id,
				maxLen = Math.min(len, this.items.length), // don't exceed either array len
				match = false
			for (var i = 0; i < maxLen; ++i) {
				if (lastId === this.items[i].id) { // next elements are older
					match = true
					data.items.push(...this.items.slice(i + 1))
					this.items = data.items
					break
				}
			}

			return match
		}

		storeData(data) {
			const match = this.compareData(data)

			// If this was first run and we found no matches that means our data is too old (e.g. items got removed by user, or a lot added)
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

		// https://github.com/huttarichard/instagram-private-api
		remove(id) {
			var formData = new FormData()
			formData.set('media_id', id)
			formData.set('src', 'profile')

			return fetch(`media/${id}/un${this.endpoint}/`, {
				method: 'POST',
				body: formData
			})
		}

		add(id) {
			var formData = new FormData()
			formData.set('media_id', id)
			formData.set('src', 'profile')

			return fetch(`media/${id}/${this.endpoint}/`, {
				method: 'POST',
				body: formData
			})
		}
	}

	window.getInstagram = Instagram
}(window))
