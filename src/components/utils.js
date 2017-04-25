class XHR {
	static parseJSON = (response) => response.json()

	static fetch(url, options) {
		return window.fetch(url, options)
			.then(this.checkStatus)
			.then(this.parseJSON)
	}

	static checkStatus(response) {
		if (response.status >= 200 && response.status < 300) {
			return response
		}

		const error = new Error(`HTTP Error ${response.statusText}`)
		error.status = response.statusText
		error.response = response
		console.log(error)
		throw error
	}
}

class Storage {
	static STORAGE = 'local'

	static get = (key) => new Promise((resolve, reject) => {
		chrome.storage[this.STORAGE].get({ [key]: [] }, (data) => this.check(data, resolve, reject))
	})

	static remove = (key) => new Promise((resolve, reject) => {
		chrome.storage[this.STORAGE].remove(key, (data) => this.check(data, resolve, reject))
	})

	static check(data, resolve, reject) {
		if (chrome.runtime.lastError) {
			console.error(chrome.runtime.lastError)
			return reject(chrome.runtime.lastError)
		}

		return resolve(data)
	}

	static shiftData(key, data) {
		this.remove(key)

		var arr = window.localStorage[key] || []
		window.localStorage[key] = data.push(...arr) // new keys first

		return data
	}
}


export {
	XHR, Storage
}
