;(function main(window) {
	'use strict'

	const document = window.document,
		location = document.location,
		docEl = document.documentElement,
		$ = e => document.querySelector(e),
		WIDTH = window.innerWidth

	function injectCSS(file) {
		let style = document.createElement('link')
		style.id = 'ige_style'
		style.rel = 'stylesheet'
		style.href = chrome.extension.getURL(`content/${file}.css`)
		document.head.appendChild(style) // we don't need to append it to the body to prevent blocking rendering, as it requires a (huge) reflow anyway
		style = null
	}
	injectCSS('content') // inject as early as possible

	// block middle mouse button
	window.addEventListener('click', e => (e.button > 0 ? e.stopPropagation() : undefined), true)

	// prevent vid restart
	window.addEventListener('blur', e => e.stopPropagation(), true)
	window.addEventListener('visibilitychange', e => e.stopPropagation(), true)

	/**
	 * Creates a new observer, starts observing and returns the observer.
	 *
	 * @param {Node} elem Element to observe
	 * @param {MutationCallback} fn Mutation Callback
	 * @param {MutationOptions} options Options
	 * @return {MutationObserver} Callback
	 */
	function observe(elem, fn, options) {
		const observer = new MutationObserver(fn)
		if (elem) observer.observe(elem, options)

		return {
			observe(el) {
				observer.observe(el, options) // MutationObservers have no unobserve, so we just return an observe function.
			},
			disconnect() {
				observer.disconnect()
			},
		}
	}

	/**
	 * Observe for node changes and add video controls if needed.
	 */
	const root = document.getElementById('react-root')
	observe(
		document.body,
		mutations => {
			for (const i in mutations) {
				const mutation = mutations[i],
					added = mutation.addedNodes

				for (var x in added) {
					const el = added[x]
					Promise.resolve()
						.then(handleNode.bind(undefined, el, mutation))
						.catch(console.error)
				}
			}
		},
		{ childList: true, subtree: true }
	)

	const handleNodeFns = {
		DIV(node) {
			node.querySelectorAll('img').forEach(fullPhoto)
			node.querySelectorAll('video').forEach(addControls)
		},
		ARTICLE(node) {
			handleNodeFns.DIV(node)
		},

		VIDEO: addControls,
		IMG: fullPhoto,

		SECTION(node) {
			handleNodeFns.DIV(node)
		},
	}

	function handleNode(node, mutation) {
		const nodeName = node.nodeName
		if (mutation.target.id === 'react-root' && nodeName === 'SECTION') onChange()
		handleNodeFns[nodeName] !== undefined && handleNodeFns[nodeName](node)
	}

	let hasNavigated = false,
		prevUrl = location.href,
		currentClass = ''

	/**
	 * Checks the URL for changes.
	 */
	function checkURL() {
		if (location.href !== prevUrl) {
			prevUrl = location.href
			hasNavigated = true
			onNavigate()
		}
	}

	/**
	 * Sets the correct currentClass.
	 *
	 * .home on the main homepage
	 * .profile on user profiles
	 * .post when a single post is open (also as modal)
	 * .explore if the explore tab is open
	 * .stories when stories are open
	 */
	function decideClass() {
		const pathname = location.pathname

		if (
			(hasNavigated && (location.search.indexOf('tagged') !== -1 || location.search.indexOf('taken-by=') !== -1)) ||
			$('div[role="dialog"]') !== null
		)
			return (currentClass = '')

		// home page
		if (pathname === '/') return (currentClass = 'home')

		// stories
		if (pathname.indexOf('/stories/') !== -1) return (currentClass = 'stories')

		// single post
		if (pathname.indexOf('/p/') !== -1) return (currentClass = 'post')

		// search results
		if (pathname.indexOf('/explore/') !== -1) return (currentClass = 'explore')

		// profile page
		return (currentClass = 'profile')
	}

	function addClass() {
		if (currentClass === '' || root.classList.contains(currentClass)) return

		root.classList.remove('home', 'profile', 'post', 'explore', 'stories')
		root.classList.add(currentClass)
	}

	const Instagram = {
		liked: new window.getInstagram('liked'),
		saved: new window.getInstagram('saved'),
	}
	console.log((window.Instagram = Instagram)) // for debugging

	function addExtendedButton() {
		let anchor = document.getElementsByClassName('coreSpriteDesktopNavProfile')
		if (!anchor.length) anchor = $('header > div > button')

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

			Instagram.liked
				.start()
				.then(Instagram.liked.fetch)
				.catch(console.error)
			Instagram.saved
				.start()
				.then(Instagram.saved.fetch)
				.catch(console.error)

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

	function addNamesToStories() {
		const list = document.querySelectorAll(
			'main > section > div:first-child:not(#rcr-anchor) ~ div:last-child > hr:first-of-type + div + div > div > div > a > div > div > span'
		)

		const regex = /\./g
		for (let i = 0; i < list.length; ++i) {
			const elem = list[i]
			elem.parentElement.parentElement.parentElement.parentElement.id = `igs_${elem.firstChild.data.replace(regex, 'dot')}` // faster than .textContent
		}
	}

	let paddingLeft = 0,
		paddingRight = 0,
		paddingTop = 0,
		paddingBottom = 0

	/**
	 * Switches bottom/top padding to right/left padding in order to fix horizontal endless scrolling in virtual lists.
	 *
	 * @param {HTMLDivElement} target elem
	 */
	function switchPadding(target) {
		const bottom = +target.style.paddingBottom.replace('px', '')
		const top = +target.style.paddingTop.replace('px', '')

		if (bottom > paddingBottom) paddingRight -= paddingRight - bottom
		else paddingRight += bottom - paddingRight
		if (top > paddingTop) paddingLeft -= paddingLeft - top
		else paddingLeft += top - paddingLeft
		if (top <= 0 && bottom <= WIDTH) {
			target.style.paddingTop = '0px'
			target.style.paddingBottom = `${WIDTH}px`
			paddingLeft = 0
			paddingRight = WIDTH
		}

		// Can't set paddingBottom to 0, as it breaks the VL mechanism
		target.style.paddingRight = `${paddingRight}px`
		target.style.paddingLeft = `${paddingLeft}px`
		paddingTop = top
		paddingBottom = bottom
	}

	const switchPaddingThrottled = throttle(target => {
		switchPadding(target)
		window.requestIdleCallback(addNamesToStories)
	}, 10)

	const vlObserver = observe(
		undefined,
		mutations => {
			if (mutations.length === 0) return

			const target = mutations[0].target
			console.log(target.style.paddingTop, target.style.paddingBottom)

			if (paddingRight === 0 || paddingLeft === 0) {
				// initial value
				paddingRight = +target.style.paddingBottom.replace('px', '')
				paddingLeft = +target.style.paddingTop.replace('px', '')
				paddingBottom = paddingRight
				paddingTop = paddingLeft
			}
			switchPaddingThrottled(target)
		},
		{ attributes: true, attributeFilter: ['style'] }
	)
	function fixVirtualList() {
		const $el = $('main > section > div:first-child:not(#rcr-anchor) ~ div:last-child > hr:first-of-type + div + div > div > div')
		if ($el !== null) vlObserver.observe($el) // virtual stories list
	}

	function throttle(callback, wait) {
		let time = Date.now()

		return function throttle(arg) {
			if (time + wait - Date.now() < 0) {
				callback(arg)
				time = Date.now()
			}
		}
	}

	const connection = navigator.connection.type,
		speed = navigator.connection.downlink,
		fullsizeObserver = observe(
			undefined,
			mutations => {
				for (const i in mutations) {
					const mutation = mutations[i].target

					if (mutation.sizes !== '1080px') mutation.sizes = '1080px'
				}
			},
			{ attributes: true, attributeFilter: ['sizes'] }
		)

	/**
	 * Free observers to prevent memory leaks.
	 */
	function disconnectObservers() {
		fullsizeObserver.disconnect()
		vlObserver.disconnect()
	}

	/**
	 *
	 * @param {HTMLImageElement} el Image
	 */
	function fullPhoto(el) {
		if (!el) return

		el.decoding = 'async'
		if (connection === 'wifi' && speed > 3.0) {
			el.sizes = '1080px'
			fullsizeObserver.observe(el)
		}
	}

	/**
	 * Adds controls to videos and preloads if needed.
	 * @param {HTMLVideoElement} el Video
	 */
	function addControls(el) {
		if (!el) return

		el.controls = 'true'
		if (connection === 'wifi' && speed > 3.0) el.preload = 'auto'
	}

	function setBoxWidth(i) {
		docEl.style.setProperty('--boxWidth', `${i}vw`)
	}

	let OPTIONS = null
	const OPTS_MODE = {
		blockStories(value) {
			for (const i in value) {
				document.getElementById(`igs_${value[i]}`).style.display = 'none'
			}
		},
		//highlightOP(arg) {},
		_boxWidth(i) {},
		rows(i) {
			if (i !== 4) setBoxWidth(100 / i - 1)
		},
		boxWidth(i) {
			if (OPTIONS.rows === 2 && i > 25 && i !== 49) setBoxWidth(i)
			if (OPTIONS.rows === 4 && i < 25 && i !== 23) setBoxWidth(i)
		},

		// boolean toggles
		klass(cls) {
			root.classList.add(cls)
		},
		night(arg) {
			const hour = new Date().getHours()
			if ((hour >= OPTIONS.nightModeStart && hour < OPTIONS.nightModeEnd) || OPTIONS.nightModeStart === OPTIONS.nightModeEnd)
				injectCSS('night')
		},
		only3Dot(arg) {
			$('#ige_style').remove()
		},
	}
	const OPTS = {
		// blockPosts: null, // []
		blockStories: OPTS_MODE.blockStories, // []
		night: OPTS_MODE.night,
		nightModeStart: undefined,
		nightModeEnd: undefined,
		picturesOnly: OPTS_MODE.klass,
		hideStories: OPTS_MODE.klass,
		noSpaceBetweenPosts: OPTS_MODE.klass,
		hideRecommended: OPTS_MODE.klass,
		highlightOP: OPTS_MODE.highlightOP,
		only3Dot: OPTS_MODE.only3Dot,
		rows: OPTS_MODE.rows,
		rowsFourBoxWidth: OPTS_MODE.boxWidth,
		rowsTwoBoxWidth: OPTS_MODE.boxWidth,
		// indicateFollowing: true
	}

	function loadOptions() {
		window.IG_Storage.get('options', null)
			.then(function cb(options) {
				if (options === null) return options
				OPTIONS = options

				for (const optName in options) {
					const oFn = OPTS[optName]
					if (oFn === undefined) continue

					const optValue = options[optName]
					if (typeof optValue === 'boolean') optValue && oFn(`ige_${optName}`)
					else oFn(optValue)
				}
				return options
			})
			.catch(console.error)
	}

	OPTS_MODE.rows(WIDTH < 1367 ? 2 : 4)

	/**
	 * Callback when nodes are removed/inserted.
	 */
	function onChange() {
		checkURL()
	}

	/**
	 * Callback when an url navigation has happened.
	 */
	function onNavigate() {
		disconnectObservers()
		decideClass()
		window.requestIdleCallback(() =>
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => {
					addClass()
					if (currentClass === 'home') fixVirtualList()
				})
			})
		) // double-rAF
	}

	/**
	 * Callback when DOM is ready.
	 */
	function onReady() {
		const $elem = $('div > article')
		if ($elem !== null) docEl.style.setProperty('--boxHeight', `${$elem.offsetHeight}px`) // give boxes equal height

		decideClass()
		addClass()
		loadOptions()
		onNavigate()
		window.requestIdleCallback(() =>
			window.requestAnimationFrame(() => {
				window.requestAnimationFrame(() => {
					document.body.querySelectorAll('video').forEach(addControls)
					document.body.querySelectorAll('img').forEach(fullPhoto)
					if (currentClass === 'home') fixVirtualList()
				})
			})
		) // double-rAF

		addExtendedButton()
		addListener()
	}

	if (document.readyState === 'interactive' || document.readyState === 'complete') onReady()
	else document.addEventListener('DOMContentLoaded', onReady)
})(window)
