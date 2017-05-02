(function(window) {
	'use strict'

	const API = 'https://i.instagram.com/api/v1/'
	const fetchOptions = {
		accept: 'application/json',
		credentials: 'include'
	}
	const headers = new Headers()
	headers.append('X-IG-Capabilities', '3boBAA==')
	headers.append('X-IG-Connection-Type', 'WIFI')
	headers.append('X-IG-Connection-Speed', '3700kbps')
	headers.append('X-FB-HTTP-Engine', 'Liger')

	function fetch(url, options) {
		var opts = fetchOptions
		if (options !== undefined)
			opts = { ...fetchOptions, ...options }
		opts.headers = headers

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

	function getCookies(wanted) {
		var cookies = document.cookie.split('; '), result = {}

		for (var i = 0; i < cookies.length; ++i) {
			var cookie = cookies[i].split('='),
				index = wanted.indexOf(cookie[0])
			if (index !== -1) {
				result[wanted[index]] = cookie[1]
			}
		}

		return result
	}

	/**
	 * 0 -> posts + set next max id -> max id -> posts + set next max id -> repeat from 1.
	 *
	 * @class Instagram
	 */
	class Instagram {
		constructor(endpoint) {
			this.endpoint = endpoint // e.g. liked
			this.action = endpoint.slice(0, -1) // e.g. like
			this.uuid = ''

			this.firstNextMaxId = undefined
			this.firstRun = true

			this.nextMaxId = null
			this.items = []

			this.start = () => {
				if (this.firstNextMaxId === undefined) {
					this.uuid = 'android-' + SparkMD5.hash(document.getElementsByClassName('coreSpriteDesktopNavProfile')[0].href.split('/')[3]).slice(0, 16)
					this.uid = getCookies(['ds_user_id']).ds_user_id

					return Storage.get(this.endpoint, { items: [], nextMaxId: '' })
						.then((data) => {
							this.firstNextMaxId = data.nextMaxId
							this.items = data.items
							return data
						})
				}
				return Promise.resolve(this.items)
			}
		}

		fetch() {
			if (this.nextMaxId === '') return Promise.resolve(this.data) // nothing more to fetch

			return fetch('feed/' + this.endpoint + '/?' + (this.nextMaxId ? 'max_id=' + this.nextMaxId + '&' : '')) // maxId means "show everything before X"
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
		// https://github.com/mgp25/Instagram-API/
		remove(id) {
			var params = new URLSearchParams(),
				cookies = getCookies(['csrftoken'])
			params.append('_uuid', this.uuid)
			params.append('_uid', this.uid)
			params.append('_csrftoken', cookies.csrftoken)
			params.append('media_id', id)

			return fetch(`media/${id}/un${this.action}/`, {
				method: 'POST',
				body: params
			})
		}

		add(id) {
			var params = new URLSearchParams(),
				cookies = getCookies(['csrftoken'])
			params.append('_uuid', this.uuid)
			params.append('_uid', this.uid)
			params.append('_csrftoken', cookies.csrftoken)
			params.append('media_id', id)

			return fetch(`media/${id}/${this.action}/`, {
				method: 'POST',
				body: params
			})
		}
	}

	window.getInstagram = Instagram
}(window))
