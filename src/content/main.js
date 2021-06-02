;(function (window) {
	function logAndReject(e) {
		console.error(e)
		return Promise.reject(e)
	}

	class Storage {
		constructor(storage) {
			this.STORAGE = storage

			this.promise = this.promise.bind(this)
			this.set = this.set.bind(this)
			this.get = this.get.bind(this)
			this.remove = this.remove.bind(this)
		}

		promise(callback) {
			return new Promise((resolve, reject) => {
				if (chrome.storage[this.STORAGE] === undefined) reject(new Error('Chrome storage not available'))

				try {
					callback(resolve, reject)
				} catch (e) {
					reject(e)
				}
			})
		}

		set(key, value) {
			return this.promise((resolve, reject) =>
				chrome.storage[this.STORAGE].set({ [key]: value }, data => Storage.check(data, resolve, reject))
			)
		}

		setObj(object) {
			return this.promise((resolve, reject) => chrome.storage[this.STORAGE].set(object, data => Storage.check(data, resolve, reject)))
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

	const IG_Storage = new Storage('local')
	const IG_Storage_Sync = new Storage('sync')

	const documentElement = document.documentElement,
		$ = e => {
			return document.querySelector(e)
		},
		WIDTH = window.innerWidth

	/** Stores the current options */
	let OPTIONS = {}

	/**
	 *
	 */
	function injectCSS(file) {
		const style = document.createElement('link')

		style.id = 'ige_style'
		style.rel = 'stylesheet'
		style.href = chrome.extension.getURL(`content/${file}.css`)
		document.head.append(style) // inserted css is always non-blocking
	}
	injectCSS('content') // inject as early as possible

	// block middle mouse button
	window.addEventListener(
		'click',
		e => {
			return e.button > 0 ? e.stopPropagation() : undefined
		},
		true
	)

	// prevent vid restart
	window.addEventListener(
		'blur',
		e => {
			return e.stopPropagation()
		},
		true
	)
	window.addEventListener(
		'visibilitychange',
		e => {
			return e.stopPropagation()
		},
		true
	)

	/**
	 * Creates a new observer, starts observing and returns the observer.
	 *
	 * @param {Node} element Element to observe
	 * @param {MutationCallback} fn Mutation Callback
	 * @param {MutationOptions} options Options
	 * @return {MutationObserver} Callback
	 */
	function observe(element, fn, options) {
		const observer = new MutationObserver(fn)

		if (element) observer.observe(element, options)

		return {
			disconnect() {
				observer.disconnect()
			},
			observe(element) {
				observer.observe(element, options) // MutationObservers have no unobserve, so we just return an observe function.
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
			for (const mutation of mutations) {
				const added = mutation.addedNodes

				for (const element of added) {
					Promise.resolve().then(handleNode.bind(undefined, element, mutation)).catch(logAndReject)
				}
			}
		},
		{ childList: true, subtree: true }
	)

	const handleNodeFns = {
		ARTICLE(node) {
			handleNodeFns.DIV(node)

			window.requestIdleCallback(() => handleNodeFns.DIV(node)) // in case any img still slips through
		},
		DIV(node) {
			node.querySelectorAll('img').forEach(fullPhoto)
			node.querySelectorAll('video').forEach(addControls)
		},

		IMG: fullPhoto,
		SECTION(node) {
			handleNodeFns.DIV(node)
		},

		VIDEO: addControls,
	}

	let OPTS_LOADED = false

	/**
	 *
	 */
	function handleStories() {
		if (OPTS_LOADED && currentClass === 'home' && !OPTIONS.only3Dot && $('.ige_movedStories') === null) {
			let $div
			if (($div = $('.home main > section > div > div:first-child[class] > div')) !== null) {
				moveStories($div)
			}
		}
	}

	/**
	 *
	 */
	function handleSidebar() {
		if (OPTS_LOADED && currentClass === 'home' && !OPTIONS.only3Dot && $('.ige_sidebar') === null) {
			let $div
			if (($div = $('.main > section > div:first-child:not(#rcr-anchor) ~ div:last-child')) !== null) {
				const $stories = $('.ige_movedStories')
				if ($stories === null) return

				$div.classList.add('ige_sidebar')
				$div.addEventlistener('mouseenter', function () {
					$stories.classList.add('hover')
				})
				$div.addEventlistener('mouseout', function () {
					$stories.classList.remove('hover')
				})
			}
		}
	}

	/**
	 *
	 */
	function handleNode(node, mutation) {
		const nodeName = node.nodeName

		addExtendedButton()
		handleStories()
		handleSidebar()

		if (mutation.target === root && nodeName === 'SECTION') onChange()
		handleNodeFns[nodeName] !== undefined && handleNodeFns[nodeName](node)
	}

	let hasNavigated = false,
		previousUrl = location.href,
		currentClass = ''

	/**
	 * Checks the URL for changes.
	 */
	function checkURL() {
		if (location.href !== previousUrl) {
			hasNavigated = true
			onNavigate()
			previousUrl = location.href
		}
	}

	/**
	 * Sets the correct currentClass.
	 *
	 * .home on the main homepage
	 * .profile on user profiles
	 * .post share when clicked the share icon from the feed
	 * .post like tbd when user cicks the likes amount
	 * .post when a single post is open (also as modal)
	 * .explore if the explore tab is open
	 * .stories when stories are open
	 * .tv IG TV pages
	 * .twoFA when logging in
	 */
	function decideClass() {
		const pathname = location.pathname

		if (
			(hasNavigated && (location.search.indexOf('tagged') !== -1 || location.search.indexOf('taken-by=') !== -1)) ||
			$('body > div > div[role="dialog"]') !== null
		)
			return (currentClass = '')

		// home page
		if (pathname === '/') return (currentClass = 'home')

		// stories
		if (location.hash === '#story') return (currentClass = 'stories story')
		if (pathname.indexOf('/stories/') !== -1) return (currentClass = 'stories')

		// single post
		if (location.hash === '#share') return (currentClass = 'post share')
		if (location.hash === '#likes') return (currentClass = 'post likes')
		if (pathname.indexOf('/p/') !== -1) return (currentClass = 'post')

		// search results
		if (pathname.indexOf('/explore/') !== -1) return (currentClass = 'explore')

		// insta TV
		if (pathname.indexOf('/tv/') !== -1) return (currentClass = 'post tv')

		// reels
		if (pathname.indexOf('/reels/') !== -1) return (currentClass = 'post reels')

		// reel
		if (pathname.indexOf('/reel/') !== -1) return (currentClass = 'post reel')

		// login -> 2FA screen
		if (pathname.indexOf('/accounts/login/two_factor') === 0) return (currentClass = 'twoFA')

		// direct msgs
		if (pathname.indexOf('/direct/') !== -1) return (currentClass = 'dms')

		// live
		if (pathname.indexOf('/live/') !== -1) return (currentClass = 'profile live')

		// profile page
		return (currentClass = 'profile')
	}

	/**
	 *
	 */
	function addClass() {
		if (currentClass === '' || root.classList.contains(currentClass)) return

		// @TODO what if we use data-class for this instead?
		root.classList.remove('home', 'profile', 'post', 'explore', 'stories', 'tv', 'twoFA', 'dms', 'live', 'share', 'likes')
		root.classList.add(...currentClass.split(' '))
	}

	/**
	 *
	 */
	function addExtendedButton() {
		if ($('.extended--btn') !== null) return

		let $anchor = document.querySelectorAll('nav div > a:only-child')

		if ($anchor.length === 0) {
			console.warn('Nav Selector outdated')
			return
		}

		$anchor = $anchor[$anchor.length - 1].parentElement
		const element = $anchor.cloneNode(true),
			a = element.firstChild

		a.className = ''
		a.classList.add('extended--btn')

		let clickedExtendedButton = true

		if (window.localStorage.clickedExtendedBtn === undefined) {
			a.classList.add('extended--btn__new')
			clickedExtendedButton = false
		}

		a.href = '#'
		a.nodeValue = '' // clear content
		a.textContent = '⋯'
		a.title = 'Improved Layout for Instagram'
		a.addEventListener('click', function (e) {
			e.preventDefault()
			chrome.runtime.sendMessage(null, { action: 'click' })
			if (!clickedExtendedButton) window.localStorage.clickedExtendedBtn = true
		})

		$anchor.parentNode.append(element)
	}

	const get = (path, object) => path.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), object)

	function getFromIGData(key) {
		const path = [key]
		let get1 = get(path, window._cached_shared_Data)
		if (get1 !== null) return get1

		get1 = get(path, window._sharedData)
		if (get1 !== null) return get1

		get1 = get(['data', key], window.__initialData)
		if (get1 !== null) return get1

		return '<unknown>'
	}

	/**
	 *
	 */
	function addChromeListener() {
		//chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {})
		chrome.runtime.sendMessage({ action: 'ig-claim', path: sessionStorage['www-claim-v2'] || localStorage['www-claim-v2'] })
		chrome.runtime.sendMessage({ action: 'rollout-hash', path: getFromIGData('rollout_hash') })
	}

	const connection = navigator.connection.type || '',
		speed = navigator.connection.downlink,
		fullSizeCondition = document.hidden || (connection.indexOf('cell') === -1 && speed > 1.9),
		fullsizeObserver = observe(
			undefined,
			mutations => {
				for (const i in mutations) {
					const mutation = mutations[i].target

					if (mutation.srcset.indexOf('480w') === -1 && mutation.src !== '') mutation.srcset = ''
					// stories only have 320w in their srcset, so we don't wan't to use this.
					else if (mutation.sizes !== '1080px') mutation.sizes = '1080px'
				}
			},
			{ attributeFilter: ['sizes'], attributes: true }
		)

	/**
	 * Free observers to prevent memory leaks.
	 */
	function disconnectObservers() {
		fullsizeObserver.disconnect()
	}

	/**
	 *
	 * @param {HTMLImageElement} element Image
	 */
	function fullPhoto(element) {
		if (!element) return

		element.decoding = 'async'
		if (fullSizeCondition) {
			if (element.srcset.indexOf('480w') === -1 && element.src !== '') element.srcset = ''
			// stories only have 320w in their srcset, so we don't wan't to use this.
			else if (element.sizes !== '1080px') element.sizes = '1080px'

			fullsizeObserver.observe(element)
		}
	}

	/**
	 * Adds controls to videos and preloads if needed.
	 *
	 * @param {HTMLVideoElement} element Video
	 */
	function addControls(element) {
		if (!element) return

		element.controls = 'true'
		if (fullSizeCondition && element.getAttribute('preload') === null) element.preload = 'auto'
	}

	/**
	 *
	 */
	function setBoxWidth(i) {
		documentElement.style.setProperty('--boxWidth', `${i}vw`)
	}

	/**
	 *
	 */
	function toggleWatchlist(user) {
		if (!OPTIONS.watchPosts) OPTIONS.watchPosts = [user]
		else {
			const i = OPTIONS.watchPosts.indexOf(user)

			i === -1 ? OPTIONS.watchPosts.push(user) : OPTIONS.watchPosts.splice(i, 1)
		}
		if (!OPTIONS.watchStories) OPTIONS.watchStories = [user]
		else {
			const i = OPTIONS.watchStories.indexOf(user)

			i === -1 ? OPTIONS.watchStories.push(user) : OPTIONS.watchStories.splice(i, 1)
		}

		IG_Storage_Sync.set('options', OPTIONS).catch(logAndReject)
	}

	/**
	 * Add a 'watched' label and whether if posts or stories are watched
	 */
	function addWatched() {
		const user = location.pathname.split('/')[1]

		let $node = $('header div h2')

		if ($node === null || $node.textContent !== user) {
			console.warn('User Selector outdated')
			return
		}

		$node = $node.parentElement.parentElement

		let cls = false,
			text = ''

		if (OPTIONS.watchPosts && OPTIONS.watchPosts.indexOf(user) !== -1) {
			text += 'Posts '
			cls = true
		}
		if (OPTIONS.watchStories && OPTIONS.watchStories.indexOf(user) !== -1) {
			text += 'Stories '
			cls = true
		}

		if (cls) {
			$node.dataset.igeWatched = text
			$node.classList.add('ige_watched')
		} else $node.classList.add('ige_watch')

		$node.addEventListener(
			'click',
			e => {
				const target = e.target

				if (target.nodeName !== 'SECTION') return

				const list = target.classList

				list.toggle('ige_watch')
				list.toggle('ige_watched')

				toggleWatchlist(user)
			},
			false
		)
	}

	/**
	 * Options
	 */

	/** Options handlers */
	const OPTS_MODE = {
		//highlightOP(arg) {},
		_boxWidth(i) {},
		boxWidth(i) {
			if (OPTIONS.rows === 2 && i > 25 && i !== 49) setBoxWidth(i)
			else if (OPTIONS.rows === 4 && i < 25 && i !== 23) setBoxWidth(i)
			else if (OPTIONS.rows === 1) {
				const $style = $('#ige_style')
				if ($style !== null) $style.remove()
			}
		},
		klass(cls) {
			if (!root.classList.contains(cls)) root.classList.add(cls)
		},

		// boolean toggles
		night(argument) {
			const hour = new Date().getHours()

			if (
				(hour >= OPTIONS.nightModeStart && hour > OPTIONS.nightModeEnd) ||
				(hour < OPTIONS.nightModeStart && hour < OPTIONS.nightModeEnd) ||
				OPTIONS.nightModeStart === OPTIONS.nightModeEnd ||
				(OPTIONS.nightSystem && window.matchMedia('(prefers-color-scheme:dark)').matches)
			)
				injectCSS('night')
		},
		notify(argument) {
			chrome.runtime.sendMessage(null, { action: 'watchNow' })
		},
		only3Dot(argument) {
			$('#ige_style').remove()
			$('#ige_feed').style.display = 'none'
			$(
				'#react-root:not(.profile):not(.tv):not(.stories):not(.explore):not(.post):not(.twoFA) main > section > div:not(#rcr-anchor) > div:not([class])'
			).style.display = 'flex'
			$('#ige_feedCSS').remove()
		},
		rows(i) {
			if (i !== 4) setBoxWidth(Math.ceil(100 / (i + 1)))
		},
	}

	/**
	 * Options mapper.
	 */
	const OPTS = {
		hideRecommended: OPTS_MODE.klass,
		hideStories: OPTS_MODE.klass,
		highlightOP: OPTS_MODE.highlightOP,
		night: OPTS_MODE.night,
		nightModeEnd: undefined,
		nightModeStart: undefined,
		noSpaceBetweenPosts: OPTS_MODE.klass,
		only3Dot: OPTS_MODE.only3Dot,
		picturesOnly: OPTS_MODE.klass,
		rows: OPTS_MODE.rows,
		rowsFourBoxWidth: OPTS_MODE.boxWidth,
		rowsTwoBoxWidth: OPTS_MODE.boxWidth,

		watchInBackground: OPTS_MODE.notify,
		watchPosts: undefined,
		watchStories: undefined, // Check for updates when opening IG
		// indicateFollowing: true
	}

	/**
	 *
	 */
	function handleOptions(options) {
		if (options === null) return options
		OPTIONS = options
		OPTS_LOADED = true

		for (const optName in options) {
			const oFn = OPTS[optName]

			if (oFn === undefined) continue

			const optValue = options[optName]

			if (typeof optValue === 'boolean') optValue && oFn(`ige_${optName}`)
			else oFn(optValue)
		}

		return options
	}

	/**
	 *
	 */
	function updateStorage(changes, area) {
		if (changes.options !== undefined) {
			console.log('new options', changes)
			handleOptions(changes.options.newValue)
		}
	}

	/**
	 *
	 */
	function loadOptions() {
		IG_Storage_Sync.get('options', null).then(handleOptions).catch(logAndReject)

		chrome.storage.onChanged.addListener(updateStorage)
	}

	OPTS_MODE.rows(WIDTH < 1367 ? 2 : 4)

	/**
	 *
	 */
	function addFeedDiv() {
		const div = document.createElement('div')
		div.id = 'ige_feed'
		root.after(div)
	}

	/**
	 *
	 */
	function clickShare(tries) {
		const $elem = $('article section > span:nth-of-type(3n) button')
		if ($elem === null) {
			console.error('Share selector outdated', tries)

			if (tries < 30) {
				const $a = $('a > time')
				if ($a !== null) $a.parentElement.click() // somehow fixes the hidden share button
				window.setTimeout(() => clickShare(tries + 1), tries * 100)
			} else root.style.display = 'flex !important'
		} else $elem.click()
	}

	/**
	 *
	 */
	function storiesMutationHandler(mutations) {
		let counterAdded = 0
		let counterRemoved = 0

		console.log('stories', mutations)

		for (const mutation of mutations) {
			if (mutation.target.nodeName !== 'UL') continue

			const removed = mutation.removedNodes, // "left"
				added = mutation.addedNodes // "right"

			if (added.length > 0) counterAdded += added.length
			if (removed.length > 0) counterRemoved += removed.length
		}

		console.log({ counterAdded, counterRemoved })

		if (counterAdded > 5) return

		const amountDummyNodes = 2 // the dummy nodes <li>
		counterAdded += amountDummyNodes
		counterRemoved += amountDummyNodes
		const $stories = $('.ige_movedStories ul')
		if ($stories === null) console.warn('empty stories ul', $stories)

		const storyChildren = $stories.children,
			len = storyChildren.length

		if (len === 11) {
			// page 0
			for (let i = amountDummyNodes; i < len; ++i) {
				storyChildren[i].style.display = 'list-item'
			} // 4 -> 4 -> 4
			return
		}

		for (let i = amountDummyNodes; i < counterAdded; ++i) {
			if (storyChildren[i].style.display === 'none') ++counterAdded
			else storyChildren[i].style.display = 'none'
		} // 4 -> 4 -> 4

		for (let i = 2 + counterAdded; i < counterRemoved; ++i) {
			//if (storyChildren[i].style.display === 'none') ++counterRemoved
			//else
			storyChildren[i].style.display = 'list-item'
			if (i + 1 < len && storyChildren[i + 1].style.display === 'none') ++counterRemoved
		} // 0 -> 2 -> 4
	}

	/**
	 *
	 */
	function moveStories(el) {
		el.classList.add('ige_movedStories')

		observe(el, storiesMutationHandler, { childList: true, subtree: true })
	}

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

		window.requestAnimationFrame(() => {
			addClass()

			document.body.querySelectorAll('video').forEach(addControls)
			document.body.querySelectorAll('img').forEach(fullPhoto)

			if (currentClass === 'profile') addWatched()
		})
	}

	/**
	 * Callback when DOM is ready.
	 */
	function onReady() {
		loadOptions()
		onNavigate()

		if (location.hash === '#share') window.requestAnimationFrame(() => clickShare(0))
		else if (location.hash !== '#story') addFeedDiv()

		addChromeListener()
	}

	if (document.readyState === 'interactive' || document.readyState === 'complete') onReady()
	else document.addEventListener('DOMContentLoaded', onReady)
})(window)
