;(function main(window) {
	'use strict'

	const document = window.document,
		location = document.location,
		documentElement = document.documentElement

	// block middle mouse button
	window.addEventListener(
		'click',
		function(e) {
			if (e.button > 0) e.stopPropagation()
		},
		true
	)

	// prevent vid restart
	window.addEventListener(
		'blur',
		function(e) {
			e.stopPropagation()
		},
		true
	)
	window.addEventListener(
		'visibilitychange',
		function(e) {
			e.stopPropagation()
		},
		true
	)

	let observer = null
	function observe(elem, fn) {
		if (!elem) return

		observer = new MutationObserver(fn)
		observer.observe(elem, { childList: true, subtree: true })
	}

	/**
	 * Observe for node changes and add video controls if needed.
	 */
	const root = document.getElementById('react-root')
	observe(root, function observation(mutations) {
		for (let i = 0; i < mutations.length; ++i) {
			const mutation = mutations[i].addedNodes

			if (mutation.length === 1 && mutation[0].nodeName === 'VIDEO') {
				mutation[0].controls = 'true'
			}
		}

		window.requestIdleCallback(onChange)
	})

	/**
	 * Callback when nodes are removed/inserted.
	 */
	function onChange() {
		addControls()

		checkURL()
	}

	/**
	 * Add controls to all videos.
	 */
	function addControls() {
		let addAuto = false
		if (location.pathname.indexOf('/p/') !== -1) addAuto = true

		const elems = root.querySelectorAll('video')
		for (let i = 0; i < elems.length; ++i) {
			const elem = elems[i]

			elem.controls = true

			if (addAuto) elem.preload = 'auto'
		}
	}

	let url = location.href
	function checkURL() {
		if (location.href !== url) {
			console.log('url change', url, location.href)
			url = location.href

			addClass()
		}
	}

	/**
	 * Adds the correct class to the react root node.
	 */
	function addClass() {
		const main = document.querySelector('#react-root')

		if (location.pathname.indexOf('/liked_by/') !== -1) return // nothing to do

		if (location.pathname === '/') {
			// home page
			main.classList.add('home')
			main.classList.remove('profile', 'post')
		} else if (
			location.pathname.indexOf('/p/') !== -1 &&
			((location.search.indexOf('-by=') === -1 && location.search.indexOf('explore') === -1) || window.history.length === 1)
		) {
			// single post
			main.classList.add('post')
			main.classList.remove('profile', 'home')
		} else {
			// profile page
			main.classList.add('profile')
			main.classList.remove('post', 'home')
		}
	}

	const Instagram = {
		liked: new window.getInstagram('liked'),
		saved: new window.getInstagram('saved'),
	}
	console.log((window.Instagram = Instagram)) // for debugging

	function addExtendedButton() {
		let anchor = document.getElementsByClassName('coreSpriteDesktopNavProfile')
		if (!anchor.length) anchor = document.querySelector('header > div > button')

		anchor = anchor[0].parentNode
		const el = anchor.cloneNode(true),
			a = el.firstChild

		a.className = ''
		a.classList.add('coreSpriteOptionsEllipsis', 'extended--btn')

		let clickedExtendedBtn = true
		if (window.localStorage.clickedExtendedBtn === undefined) {
			a.classList.add('extended--btn__new')
			clickedExtendedBtn = false
		}

		a.href = '#'
		a.nodeValue = '' // clear content
		a.textContent = ''
		a.title = 'Improved Layout for Instagram'
		a.onclick = function(e) {
			e.preventDefault()

			Instagram.liked.start().then(Instagram.liked.fetch)
			Instagram.saved.start().then(Instagram.saved.fetch)

			chrome.runtime.sendMessage(null, { action: 'click' })
			if (!clickedExtendedBtn) window.localStorage.clickedExtendedBtn = true
		}
		el.style.transform = 'translateY(4px) scale(1.2)'
		anchor.after(el)
	}

	const listenerActions = {
		load(request) {
			return Instagram[request.which].fetch()
		},

		_action(request) {
			return Instagram[request.which][request.action] !== undefined && Instagram[request.which][request.action](request.id)
		},

		add(request) {
			return this._action(request)
		},

		remove(request) {
			return this._action(request)
		},
	}

	function addListener() {
		chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
			if (listenerActions[request.action] !== undefined && Instagram[request.which] !== undefined) {
				listenerActions[request.action](request)
			}
		})
	}

	function injectNight() {
		const date = new Date()
		if (date.getHours() >= 20) {
			injectCSS('night')
		}
	}

	function injectCSS(file) {
		let style = document.createElement('link')
		style.rel = 'stylesheet'
		style.href = chrome.extension.getURL('content/' + file + '.css')
		document.body.appendChild(style)
		style = null
	}
	injectCSS('content') // inject as early as possible

	/**
	 * Callback when DOM is ready.
	 */
	function onReady() {
		addControls()

		const elem = document.querySelector('div > article')
		if (elem !== null) documentElement.style.setProperty('--boxHeight', elem.offsetHeight + 'px') // give boxes equal height

		addClass()

		addExtendedButton()
		addListener()

		injectNight()
	}

	if (document.readyState === 'interactive' || document.readyState === 'complete') {
		window.requestIdleCallback(onReady)
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			window.requestIdleCallback(onReady)
		})
	}
})(window)
