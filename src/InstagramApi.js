(function (window) {
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
		} else {
			const error = new Error(`HTTP Error ${response.statusText}`)
			error.status = response.statusText
			error.response = response
			console.log(error)
			throw error
		}
	}

	function parseJSON(response) {
		return response.json()
	}

	class Instagram {
		constructor(endpoint) {
			this.maxId = ''
			this.endpoint = endpoint

			return fetch(this.endpoint, this.maxId)
				.then(this.storeNext)
		}

		storeNext(data) {
			if (data.more_available) {
				this.maxId = data.next_max_id !== undefined && ('' + data.next_max_id)
			}

			return data
		}
	}

	window.getInstagram = Instagram
}(window));
