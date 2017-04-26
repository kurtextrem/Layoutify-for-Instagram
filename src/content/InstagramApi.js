(function(window) {
	'use strict'

	const API = 'https://i.instagram.com/api/v1/feed/'
	const fetchOptions = {
		accept: 'application/json',
		credentials: 'include'
	}

	function fetch(endpoint, maxId) {
		return window.fetch(API + endpoint + '/' + (maxId ? '?max_id=' + maxId : ''), fetchOptions)
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
		consstructor() {
			this.STORAGE = 'local'
		}

		set(key, value) {
			return new Promise((resolve, reject) => {
				chrome.storage[this.STORAGE].set({ [key]: value }, (data) => this.check(data, resolve, reject))
			})
		}


		get(key, defaultValue) {
			return new Promise((resolve, reject) => {
				chrome.storage[this.STORAGE].get({ [key]: defaultValue }, (data) => this.check(data[key], resolve, reject))
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
			this.firstMaxId = ''
			this.items = []

			this.start = () => {
				return Storage.get(endpoint, { items: [], maxId: '' })
					.then((data) => {
						this.firstMaxId = data.maxId
						this.items = data.items
						return data
					})
			}

			this.nextMaxId = ''
			this.endpoint = endpoint
		}

		storeNext(data) {
			this.nextMaxId = data.next_max_id !== undefined ? String(data.next_max_id) : null

			return data
		}

		fetch() {
			if (this.nextMaxId === null) return Promise.resolve(this.data)

			return fetch(this.endpoint, this.maxId)
				.then(this.storeNext.bind(this))
				.then(this.storeData.bind(this))
		}

		storeData(data) {
			if (this.firstMaxId !== this.nextMaxId) {
				this.items = [] // new data, get everything again
				this.items.push(...data.items)
				Storage.set(this.id, { items: this.items, maxId: this.nextMaxId })
				return this.items
			}

			// else we don't want to save anything new
			return false
		}
	}

	window.getInstagram = Instagram
}(window))
