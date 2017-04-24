function fetch(url, options) {
	return window.fetch(url, options)
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

const STORAGE_LOCAL = 1
function get(key) {
	return new Promise((resolve, reject) => {
		if (STORAGE_LOCAL) {
			chrome.storage.local.get(key, (data) => checkStorage(data, resolve, reject))
		} else {
			chrome.storage.sync.get(key, (data) => checkStorage(data, resolve, reject))
		}
	})
}

function checkStorage(data, resolve, reject) {
	if (chrome.runtime.lastError) {
		console.error(chrome.runtime.lastError)
		return reject(chrome.runtime.lastError)
	}

	return resolve(data)
}

function shiftStorage(key, data) {
	chrome.storage.local.remove(key)

	var arr = window.localStorage[key] || []
	window.localStorage[key] = arr.push(...data)

	return data
}

export {
	fetch, checkStatus, parseJSON, get, shiftStorage
}
