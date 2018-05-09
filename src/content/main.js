;(function main(window) {
	'use strict'

	const document = window.document,
		location = document.location,
		documentElement = document.documentElement,
		$ = e => document.querySelector(e)

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
	 * @return {MutationObserver}
	 */
	function observe(elem, fn, options) {
		if (elem === null) return

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

			window.requestIdleCallback(onChange)
		},
		{ childList: true, subtree: true }
	)

	/**
	 * Callback when nodes are removed/inserted.
	 */
	function onChange() {
		checkURL()
		addControls()
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
			window.requestIdleCallback(onNavigate)
		}
	}

	/**
	 * Callback when an url navigation has happened.
	 */
	function onNavigate() {
		window.requestAnimationFrame(() => window.requestAnimationFrame(addClass)) // double-rAF
		if (currentClass === 'stories') fixVirtualList()
		// always force highest quality
		// if (currentClass === 'profile') fullPhoto($('canvas + span > img')) // @TODO: A day after I've released this feature, they denie access to higher quality photos. Coincidence?!
		if (currentClass === 'post') {
			const el = document.querySelectorAll('div > img')
			fullPhoto(el[el.length - 1])
		}
		addControls()
	}

	/**
	 * Adds the correct class to the react root node.
	 *
	 * .home on the main homepage
	 * .profile on user profiles
	 * .post when a single post is open (also as modal)
	 * .explore if the explore tab is open
	 * `stories` when stories are open
	 */
	function addClass() {
		const pathname = location.pathname

		if (
			(hasNavigated && (location.search.indexOf('tagged') !== -1 || location.search.indexOf('taken-by=') !== -1)) ||
			$('div[role="dialog"]') !== null
		)
			return (currentClass = '')

		const $main = $('#react-root')

		// home page
		if (pathname === '/') {
			$main.classList.add('home')
			$main.classList.remove('profile', 'post', 'explore', 'stories')
			return (currentClass = 'home')
		}

		if (pathname.indexOf('/stories/') !== -1) {
			$main.classList.add('stories')
			return (currentClass = 'stories')
		}

		// single post
		if (pathname.indexOf('/p/') !== -1) {
			$main.classList.add('post')
			$main.classList.remove('profile', 'home', 'explore', 'stories')
			return (currentClass = 'post')
		}

		// search results
		if (pathname.indexOf('/explore/') !== -1) {
			$main.classList.add('explore')
			$main.classList.remove('profile', 'home', 'post', 'stories')
			return (currentClass = 'explore')
		}

		// profile page
		$main.classList.add('profile')
		$main.classList.remove('post', 'home', 'explore', 'stories')
		return (currentClass = 'profile')
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

		var regex = /\./g
		for (let i = 0; i < list.length; ++i) {
			var elem = list[i]
			elem.parentElement.parentElement.parentElement.parentElement.id = `igs_${elem.innerText.replace(regex, 'dot')}`
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
			$('main > section > div:first-child:not(#rcr-anchor) ~ div:last-child > hr:first-of-type + div + div > div'), // virtual stories list
			mutations => {
				if (!mutations.length) return

				window.requestIdleCallback(changeStyle.bind(undefined, mutations[0].target))
				window.requestIdleCallback(addNamesToStories)
			},
			{ childList: true, subtree: true }
		)
	}

	const connection = navigator.connection.type,
		speed = navigator.connection.downlink,
		fullRegex = / \d+w/
	function fullPhoto(el) {
		if (!el) return

		el.decoding = 'async'
		if (el.srcset !== '' && connection === 'wifi' && speed > 3.0) {
			const split = el.srcset.split(',')
			el.src = split[split.length - 1].replace(fullRegex, '')
		}
	}

	function setBoxWidth(i) {
		documentElement.style.setProperty('--boxWidth', `${i}vw`)
	}

	let OPTIONS = null
	const OPTS_MODE = {
		blockStories(value) {
			for (let i = 0; i < value.length; ++i) {
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

	OPTS_MODE.rows(window.innerWidth < 1367 ? 2 : 4)

	/**
	 * Callback when DOM is ready.
	 */
	function onReady() {
		const $elem = $('div > article')
		if ($elem !== null) documentElement.style.setProperty('--boxHeight', `${$elem.offsetHeight}px`) // give boxes equal height

		onNavigate()
		loadOptions()

		addExtendedButton()
		addListener()
	}

	if (document.readyState === 'interactive' || document.readyState === 'complete') onReady()
	else document.addEventListener('DOMContentLoaded', onReady)
})(window)
