/**
 *
 */
export function logAndReturn(e) {
	console.warn(e)
	return e
}

export function checkStatus(response) {
	if (response.ok) return response

	const error = new Error(response.statusText)
	error.status = response.status
	error.response = response
	throw error
}

export function parseJSON(response) {
	return response.json()
}

export class XHR {
	static checkStatus = checkStatus

	static parseJSON = parseJSON

	static fetch(url, options) {
		return window.fetch(url, options).then(checkStatus).then(parseJSON).catch(logAndReturn)
	}
}

export const fetch = XHR.fetch

// @TODO: https://github.com/domenic/async-local-storage/blob/master/README.md
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
			if (chrome.storage[this.STORAGE] === undefined) return reject('') // @TODO: Don't emit on SSR

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
const storage = new Storage('local')
const storageSync = new Storage('sync')
export { storage as Storage, storageSync as StorageSync }

export class Chrome {
	static send(action, additional = {}) {
		const search = document.location.search.replace('?', '').split('='),
			index = search.indexOf('tabid')
		if (index !== -1) {
			console.log('sending req', action, additional)
			chrome.tabs.sendMessage(+search[index + 1], { action, ...additional }, null)
			return true
		}
		return false
	}

	static i18n(key) {
		return chrome.i18n.getMessage(key) || `i18n::${key}`
	}
}

export const i18n = Chrome.i18n

//const regex = /-fr[atx]\d-\d/
/**
 *
 */
export function updateCDN(url) {
	return url
	// return url.replace(regex, '-frt3-1') // 10.08.2017
}

/**
 *
 */
export function shallowDiffers(a, b) {
	for (const key in a) if (a[key] !== b[key]) return true
	for (const key in b) if (!(key in a)) return true
	return false
}

export const webWorkerScript = `const postMsg = (url, response) => self.postMessage(url)
function checkStatus(response) {
	if (response.ok) return response
	throw response
}
const opts = {headers: {accept: 'image/webp,image/apng,image/*,*/*;q=0.8'}, redirect: 'follow', referrerPolicy: 'no-referrer', mode: 'cors'}
self.addEventListener('message', event => {
	const url = event.data,
		bound = postMsg.bind(undefined, url)
	self.fetch(url, opts).then(checkStatus).then(bound).catch(e => console.error(e) && bound())
})
`

/**
 *
 */
export function documentReady() {
	return new Promise((resolve, reject) => {
		if (document.readyState === 'interactive' || document.readyState === 'complete') resolve()
		else document.addEventListener('DOMContentLoaded', resolve)
	})
}

let workerBlob
/**
 *
 */
export async function getWorkerBlob() {
	await documentReady() // creating a blob is synchronous and takes around 120ms on a powerful machine
	if (workerBlob === undefined) workerBlob = URL.createObjectURL(new Blob([webWorkerScript], { type: 'application/javascript' }))
	return workerBlob
}

// based on https://code.lengstorf.com/get-form-values-as-json/
const formReducer = (data, element) => {
	const type = element.type
	if (type === undefined) data.push(element.value)
	else if (type === 'checkbox')
		// option
		data[element.name] = element.checked
	else if (type.indexOf('select') !== -1) data[element.name] = [].reduce.call(element.options, formReducer, [])
	else if (type === 'button' || element.name.indexOf('_add') !== -1 || type === 'submit') undefined
	else if (type === 'number') data[element.name] = +element.value
	else data[element.name] = element.value // number, text, etc

	return data
}
export const formToJSON = elements => [].reduce.call(elements, formReducer, {})

/**
 * Leading call, trailing call for each period.
 *
 * @param   {[type]}  callback  [callback description]
 * @param   {[type]}  wait      [wait description]
 *
 * @return  {[type]}
 */
export function throttle(fn, wait = 100) {
	let time
	let lastFunc

	return function throttle(...args) {
		if (time === undefined) {
			fn.apply(this, args)
			time = Date.now()
		} else {
			clearTimeout(lastFunc)
			lastFunc = setTimeout(() => {
				if (Date.now() - time >= wait) {
					fn.apply(this, args)
					time = Date.now()
				}
			}, wait - (Date.now() - time))
		}
	}
}

/**
 * Delayed trailing call for each period.
 *
 * @param   {[type]}  fn     [fn description]
 * @param   {[type]}  delay  [delay description]
 *
 * @return  {[type]}
 */
export function debounce(fn, delay) {
	let inDebounce
	return function debounce(...args) {
		clearTimeout(inDebounce)
		inDebounce = setTimeout(() => fn.apply(this, args), delay)
	}
}

/**
 *
 */
export function markAtsAndHashtags(text, replacer) {
	const arr = ['']
	let prevOffset = 0
	text.replace(/(^|[^\w])([#@])([-_\d\p{L}]+)/gu, (match, whitespace, tag, name, offset, string) => {
		arr.push(text.slice(prevOffset, offset), whitespace, replacer(tag, name))
		prevOffset = offset + match.length

		return match
	})

	if (arr.length === 1) arr.push(text) // no matches

	return arr
}

export function fetchFromBackground(which, path, options) {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({ action: 'fetch', options, path, which }, text => {
			if (text === undefined && chrome.runtime.lastError) return reject(chrome.runtime.lastError.message)

			return resolve(text)
		})
	})
}

export function promiseReq(req) {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
}
