/**
 *
 */
export function logAndReturn(e) {
	console.warn(e)
	return e
}

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

	getBytes() {
		return this.promise((resolve, reject) => chrome.storage[this.STORAGE].getBytesInUse(null, resolve))
	}

	static check(data, resolve, reject) {
		if (chrome.runtime.lastError) {
			console.error(chrome.runtime.lastError.message)
			if (chrome.runtime.lastError.message.indexOf('QUOTA_BYTES') !== 0) {
				alert('Because you have a lot of likes / collections, please go to "About" and clear old data.')
			}
			return reject(chrome.runtime.lastError.message)
		}

		return resolve(data)
	}
}
const storage = new Storage('local')
const storageSync = new Storage('sync')
export { storage as Storage, storageSync as StorageSync }

export function i18n(key) {
	return chrome.i18n.getMessage(key) || `i18n::${key}`
}

/**
 *
 */
export function shallowDiffers(a, b) {
	for (const key in a) if (a[key] !== b[key]) return true
	for (const key in b) if (!(key in a)) return true
	return false
}

/**
 *
 */
export function documentReady() {
	return new Promise((resolve, reject) => {
		if (document.readyState === 'interactive' || document.readyState === 'complete') resolve()
		else document.addEventListener('DOMContentLoaded', resolve)
	})
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

/**
 *
 */
export function isHome(iframe) {
	return iframe.contentWindow && iframe.contentWindow.location.href === 'https://www.instagram.com/'
}

// this is bad code, but only one modal can be open at the same time, so we can just use it as microptimization.
let iframeTimer = null
export function closeIframe(isOpen, closeModal, node) {
	clearTimeout(iframeTimer)
	iframeTimer = null

	if (node !== null && isOpen) {
		if (isHome(node)) closeModal()
		else iframeTimer = setTimeout(closeIframe, 100)
	}
}

let modalTimer = null
export function openModalDelayed(setRenderModal, event) {
	modalTimer = setTimeout(() => {
		setRenderModal(true)
		setTimeout(setRenderModal.bind(null, false), 10000) // unload after 5 sec again
	}, 150)
}

export function cancelOpenModalDelayed(event) {
	clearTimeout(modalTimer)
	modalTimer = null
}
