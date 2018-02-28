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

	/**
	 * Creates a new observer, starts observing and returns the observer.
	 *
	 * @param {Node} elem Element to observe
	 * @param {MutationCallback} fn Mutation Callback
	 * @return {MutationObserver}
	 */
	function observe(elem, fn, options) {
		if (!elem) return

		const observer = new MutationObserver(fn)
		observer.observe(elem, options)

		return observer
	}

	/**
	 * Observe for node changes and add video controls if needed.
	 */
	const root = document.getElementById('react-root')
	observe(
		root,
		mutations => {
			for (let i = 0; i < mutations.length; ++i) {
				var mutation = mutations[i].addedNodes

				if (mutation.length === 1) {
					var node = mutation[0],
						nodeName = mutation[0].nodeName

					//console.log(mutations[i])
					if (nodeName === 'VIDEO') node.controls = 'true'
					else if (nodeName === 'DIV' || nodeName === 'ARTICLE') {
						var img = node.querySelector('img')
						if (img !== null) img.decoding = 'async'
					} else if (nodeName === 'IMG') {
						node.decoding = 'async'
					}
				}
			}

			window.requestAnimationFrame(onChange)
		},
		{ childList: true, subtree: true }
	)

	/**
	 * Callback when nodes are removed/inserted.
	 */
	function onChange() {
		window.requestAnimationFrame(checkURL) // chained rAF
		window.requestIdleCallback(addControls)
	}

	/**
	 * Add controls to all videos.
	 */
	function addControls() {
		let addAuto = false
		if (location.pathname.indexOf('/p/') !== -1) addAuto = true // preload on single posts

		const elems = root.querySelectorAll('video')
		for (let i = 0; i < elems.length; ++i) {
			const elem = elems[i]

			elem.controls = true

			if (addAuto) elem.preload = 'auto'
		}
	}

	let prevUrl = location.href
	function checkURL() {
		if (location.href !== prevUrl) {
			console.log('url change', prevUrl, location.href)
			prevUrl = location.href

			addClass()
			if (prevUrl.indexOf('/stories/')) fixVirtualList()
		}
	}

	/**
	 * Adds the correct class to the react root node.
	 *
	 * .home on the main homepage
	 * .profile on user profiles
	 * .post when a single post is open (also as modal)
	 * .explore if the explore tab is open
	 */
	function addClass() {
		const pathname = location.pathname

		if (location.pathname.indexOf('/stories/') !== -1) return
		if (window.history.length !== 1 && location.search.indexOf('-by=') !== -1 && document.querySelector('div[role="dialog"]') === null)
			return

		const main = document.querySelector('#react-root')
		if (pathname === '/') {
			// home page
			main.classList.add('home')
			main.classList.remove('profile', 'post', 'explore')
		} else if (pathname.indexOf('/p/') !== -1) {
			// single post
			main.classList.add('post')
			main.classList.remove('profile', 'home', 'explore')
		} else if (pathname.indexOf('/explore/') !== -1) {
			// search results
			main.classList.add('explore')
			main.classList.remove('profile', 'home', 'post')
		} else {
			// profile page
			main.classList.add('profile')
			main.classList.remove('post', 'home', 'explore')
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
		a.addEventListener('click', function(e) {
			e.preventDefault()

			Instagram.liked.start().then(Instagram.liked.fetch)
			Instagram.saved.start().then(Instagram.saved.fetch)

			chrome.runtime.sendMessage(null, { action: 'click' })
			if (!clickedExtendedBtn) window.localStorage.clickedExtendedBtn = true
		})
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

	function addNamesToStories() {
		const list = document.querySelectorAll(
			'main > section > div:first-child:not(#rcr-anchor) ~ div:last-child > hr:first-of-type + div + div > div > div > a > div > div > span'
		)

		var regex = /\./g
		for (let i = 0; i < list.length; ++i) {
			var elem = list[i]
			elem.parentElement.parentElement.parentElement.parentElement.id = 'igs_' + elem.innerText.replace(regex, 'dot')
		}
	}

	function changeStyle(target) {
		const bottom = target.style.paddingBottom,
			top = target.style.paddingTop === '0px' && bottom === '0px' ? '100px' : target.style.paddingTop

		console.log(top, bottom)
		target.style.paddingLeft = top
		target.style.paddingRight = bottom
	}

	let vl
	function fixVirtualList() {
		if (vl !== undefined) vl.disconnect()

		vl = observe(
			document.querySelector('main > section > div:first-child:not(#rcr-anchor) ~ div:last-child > hr:first-of-type + div + div > div'), // virtual stories list
			mutations => {
				if (!mutations.length) return

				window.requestIdleCallback(changeStyle.bind(undefined, mutations[0].target))
				window.requestIdleCallback(addNamesToStories)
			},
			{ childList: true, subtree: true }
		)
	}

	/**
	 * Callback when DOM is ready.
	 */
	function onReady() {
		addControls()

		const elem = document.querySelector('div > article')
		if (elem !== null) documentElement.style.setProperty('--boxHeight', elem.offsetHeight + 'px') // give boxes equal height

		addClass()
		fixVirtualList()

		addExtendedButton()
		addListener()

		injectNight()
	}

	if (document.readyState === 'interactive' || document.readyState === 'complete') {
		window.requestAnimationFrame(onReady)
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			window.requestAnimationFrame(onReady)
		})
	}
})(window)
