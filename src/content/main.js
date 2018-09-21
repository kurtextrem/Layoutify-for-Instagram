const docEl = document.documentElement,
	$ = e => document.querySelector(e),
	WIDTH = window.innerWidth

/** Stores the current options */
let OPTIONS

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

			for (const x in added) {
				const el = added[x]
				Promise.resolve()
					.then(handleNode.bind(undefined, el, mutation))
					.catch(window.logAndReturn)
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
		$('body > div > div[role="dialog"]') !== null
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
	liked: new InstagramAPI('liked'),
	saved: new InstagramAPI('saved'),
}

function addExtendedButton() {
	if ($('.extended--btn') !== null) return

	let $anchor = document.querySelectorAll('nav div > a:only-child')
	if ($anchor.length === 0) return

	$anchor = $anchor[$anchor.length - 1].parentNode
	const el = $anchor.cloneNode(true),
		a = el.firstChild

	a.className = ''
	a.classList.add('extended--btn')

	let clickedExtendedBtn = true
	if (window.localStorage.clickedExtendedBtn === undefined) {
		a.classList.add('extended--btn__new')
		clickedExtendedBtn = false
	}

	a.href = '#'
	a.nodeValue = '' // clear content
	a.textContent = '⋯'
	a.title = 'Improved Layout for Instagram'
	a.addEventListener('click', function(e) {
		e.preventDefault()

		Instagram.liked
			.start()
			.then(Instagram.liked.fetch)
			.catch(window.logAndReturn)
		Instagram.saved
			.start()
			.then(Instagram.saved.fetch)
			.catch(window.logAndReturn)

		chrome.runtime.sendMessage(null, { action: 'click' })
		if (!clickedExtendedBtn) window.localStorage.clickedExtendedBtn = true
	})
	$anchor.after(el)
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

	if (paddingRight === 0 || paddingLeft === 0) {
		// initial value
		paddingRight = +target.style.paddingBottom.replace('px', '')
		paddingLeft = +target.style.paddingTop.replace('px', '')
		paddingBottom = paddingRight
		paddingTop = paddingLeft
	}

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

		switchPaddingThrottled(target)
	},
	{ attributes: true, attributeFilter: ['style'] }
)
function fixVirtualList() {
	const $el = $('main > section > div:first-child:not(#rcr-anchor) ~ div:last-child > hr:first-of-type + div + div > div > div') // virtual stories list
	if ($el !== null) {
		switchPadding($el)
		vlObserver.observe($el)
	}
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
	fullSizeCondition = connection === 'wifi' && speed > 1.54,
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
	if (fullSizeCondition) {
		// @todo: Make sure this also happens on first time load on a profile
		el.sizes = '1080px'
		fullsizeObserver.observe(el)
	}
}

/**
 * Adds controls to videos and preloads if needed.
 *
 * @param {HTMLVideoElement} el Video
 */
function addControls(el) {
	if (!el) return

	el.controls = 'true'
	if (fullSizeCondition) el.preload = 'auto'
}

function setBoxWidth(i) {
	docEl.style.setProperty('--boxWidth', `${i}vw`)
}

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

	window.IG_Storage_Sync.set('options', OPTIONS).catch(window.logAndReturn)
}

/**
 * Add a 'watched' label and whether if posts or stories are watched
 */
function addWatched() {
	const user = location.pathname.split('/')[1]

	let $node = $(`h1[title="${user}"]`)
	if ($node === null) return
	$node = $node.parentElement.parentElement

	let text = '',
		cls = false
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
		if (!root.classList.contains(cls)) root.classList.add(cls)
	},
	night(arg) {
		const hour = new Date().getHours()
		if ((hour >= OPTIONS.nightModeStart && hour < OPTIONS.nightModeEnd) || OPTIONS.nightModeStart === OPTIONS.nightModeEnd)
			injectCSS('night')
	},
	only3Dot(arg) {
		$('#ige_style').remove()
	},
	notify(arg) {
		const now = Date.now(),
			last = window.sessionStorage.ige_lastFetch !== undefined ? +window.sessionStorage.ige_lastFetch : 0
		if (now - last > 60000) {
			window.sessionStorage.ige_lastFetch = now
			chrome.runtime.sendMessage(null, { action: 'watchNow' })
		}
	},
}

/**
 * Options mapper.
 */
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

	watchPosts: undefined,
	watchStories: undefined,
	watchInBackground: OPTS_MODE.notify, // Check for updates when opening IG
	// indicateFollowing: true
}

function handleOptions(options) {
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
}

function updateStorage(changes, area) {
	if (changes.options !== undefined) {
		console.log('new options', changes)
		handleOptions(changes.options.newValue)
	}
}

function loadOptions() {
	window.IG_Storage_Sync.get('options', null)
		.then(handleOptions)
		.catch(window.logAndReturn)

	chrome.storage.onChanged.addListener(updateStorage)
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
				if (currentClass === 'profile') addWatched()
				addExtendedButton()
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
