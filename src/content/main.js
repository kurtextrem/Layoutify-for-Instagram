/* global InstagramAPI, udomdiff */

const documentElement = document.documentElement,
	$ = (e) => {
		return document.querySelector(e)
	},
	WIDTH = window.innerWidth

/** Stores the current options */
let OPTIONS

/**
 *
 */
function injectCSS(file) {
	let style = document.createElement('link')

	style.id = 'ige_style'
	style.rel = 'stylesheet'
	style.href = chrome.extension.getURL(`content/${file}.css`)
	document.head.appendChild(style) // inserted css is always non-blocking
	style = null
}
injectCSS('content') // inject as early as possible

// block middle mouse button
window.addEventListener(
	'click',
	(e) => {
		return e.button > 0 ? e.stopPropagation() : undefined
	},
	true
)

// prevent vid restart
window.addEventListener(
	'blur',
	(e) => {
		return e.stopPropagation()
	},
	true
)
window.addEventListener(
	'visibilitychange',
	(e) => {
		return e.stopPropagation()
	},
	true
)

/**
 * Creates a new observer, starts observing and returns the observer.
 *
 * @param {Node} elem Element to observe
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
	(mutations) => {
		for (const i in mutations) {
			const mutation = mutations[i],
				added = mutation.addedNodes

			for (const x in added) {
				const element = added[x]

				Promise.resolve()
					.then(handleNode.bind(undefined, element, mutation))
					.catch(window.logAndReject)
			}
		}
	},
	{ childList: true, subtree: true }
)

const handleNodeFns = {
	ARTICLE(node) {
		handleNodeFns.DIV(node)
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

/**
 *
 */
function handleNode(node, mutation) {
	const nodeName = node.nodeName

	if (mutation.target.id === 'react-root' && nodeName === 'SECTION') onChange()
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
		previousUrl = location.href
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
		(hasNavigated &&
			(location.search.indexOf('tagged') !== -1 ||
				location.search.indexOf('taken-by=') !== -1)) ||
		$('body > div > div[role="dialog"]') !== null
	)
		return (currentClass = '')

	// home page
	if (pathname === '/') return (currentClass = 'home')

	// stories
	if (pathname.indexOf('/stories/') === 0) return (currentClass = 'stories')

	// single post
	if (pathname.indexOf('/p/') === 0) return (currentClass = 'post')

	// search results
	if (pathname.indexOf('/explore/') === 0) return (currentClass = 'explore')

	// insta TV
	if (pathname.indexOf('/tv/') === 0) return (currentClass = 'tv')

	// profile page
	return (currentClass = 'profile')
}

/**
 *
 */
function addClass() {
	if (currentClass === '' || root.classList.contains(currentClass)) return

	root.classList.remove('home', 'profile', 'post', 'explore', 'stories')
	root.classList.add(currentClass)
}

const Instagram = {
	liked: new InstagramAPI('liked'),
	saved: new InstagramAPI('saved'),
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

	$anchor = $anchor[$anchor.length - 1].parentNode
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

		Instagram.liked
			.start()
			.then(Instagram.liked.fetch)
			.catch(window.logAndReject)
		Instagram.saved
			.start()
			.then(Instagram.saved.fetch)
			.catch(window.logAndReject)

		chrome.runtime.sendMessage(null, { action: 'click' })
		if (!clickedExtendedButton) window.localStorage.clickedExtendedBtn = true
	})
	$anchor.after(element)
}

const listenerActions = {
	_action(request) {
		return (
			Instagram[request.which][request.action] !== undefined &&
			Instagram[request.which][request.action](request.id)
		)
	},

	add(request) {
		return this._action(request)
	},

	load(request) {
		return Instagram[request.which].fetch()
	},

	remove(request) {
		return this._action(request)
	},
}

/**
 *
 */
function addChromeListener() {
	chrome.runtime.onMessage.addListener(function (
		request,
		sender,
		sendResponse
	) {
		if (
			listenerActions[request.action] !== undefined &&
			Instagram[request.which] !== undefined
		) {
			listenerActions[request.action](request)
		}
	})
}

const connection = navigator.connection.type,
	speed = navigator.connection.downlink,
	fullSizeCondition = connection === 'wifi' && speed > 1.9,
	fullsizeObserver = observe(
		undefined,
		(mutations) => {
			for (const i in mutations) {
				const mutation = mutations[i].target

				if (mutation.sizes !== '1080px') mutation.sizes = '1080px'
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
 * @param {HTMLImageElement} el Image
 */
function fullPhoto(element) {
	if (!element) return

	element.decoding = 'async'
	if (fullSizeCondition) {
		// @todo: Make sure this also happens on first time load on a profile
		element.sizes = '1080px'
		fullsizeObserver.observe(element)
	}
}

/**
 * Adds controls to videos and preloads if needed.
 *
 * @param {HTMLVideoElement} el Video
 */
function addControls(element) {
	if (!element) return

	element.controls = 'true'
	if (fullSizeCondition) element.preload = 'auto'
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

		i === -1
			? OPTIONS.watchStories.push(user)
			: OPTIONS.watchStories.splice(i, 1)
	}

	window.IG_Storage_Sync.set('options', OPTIONS).catch(window.logAndReject)
}

/**
 * Add a 'watched' label and whether if posts or stories are watched
 */
function addWatched() {
	const user = location.pathname.split('/')[1]

	let $node = $('header div h1')

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
		(e) => {
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
		if (OPTIONS.rows === 2 && i > 25 && i !== 49) return setBoxWidth(i)
		if (OPTIONS.rows === 4 && i < 25 && i !== 23) return setBoxWidth(i)
		if (OPTIONS.rows === 1) {
			const style = document.getElementById('ige_style')
			if (style !== null) style.remove()
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
			OPTIONS.nightModeStart === OPTIONS.nightModeEnd
		)
			injectCSS('night')
	},
	notify(argument) {
		const now = Date.now(),
			last =
				window.sessionStorage.ige_lastFetch !== undefined
					? +window.sessionStorage.ige_lastFetch
					: 0

		if (now - last > 60000) {
			window.sessionStorage.ige_lastFetch = now
			chrome.runtime.sendMessage(null, { action: 'watchNow' })
		}
	},
	only3Dot(argument) {
		$('#ige_style').remove()
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
	window.IG_Storage_Sync.get('options', null)
		.then(handleOptions)
		.catch(window.logAndReject)

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

	window.requestIdleCallback(() => {
		return window.requestAnimationFrame(() => {
			window.requestAnimationFrame(() => {
				addClass()

				document.body.querySelectorAll('video').forEach(addControls)
				document.body.querySelectorAll('img').forEach(fullPhoto)

				scrollFix()

				if (currentClass === 'profile') addWatched()

				addExtendedButton()
			})
		})
	}) // double-rAF
}

/**
 * Callback when DOM is ready.
 */
function onReady() {
	loadOptions()
	onNavigate()

	addChromeListener()
}

if (document.readyState === 'interactive' || document.readyState === 'complete')
	onReady()
else document.addEventListener('DOMContentLoaded', onReady)

/**
 *
 */

/**
 *
 */
function createDummyNode(tagName, height) {
	const tag = document.createElement('span')
	tag.className = 'ige_dummyNode'
	tag.style.setProperty('--virtual-height', height + 'px')
	return tag
}

/**
 *
 */
function clickListener(e) {
	console.log(e)

	const target = e.target

	// VIDEO
	if (target.role === 'button') {
		const videoContainer = target.parentElement.children[0]
		const video = videoContainer.children[0].children[0].children[0]
		video.setAttribute('loop', '')
		video.play()
	}
	if (target.nodeName === 'VIDEO') {
		target.pause()
		target.removeAttribute('loop')
	}

	// TAGGED USERS
	if (
		target.nodeName === 'BUTTON' &&
		target.previousSibling?.nodeName === 'DIV' &&
		target.previousSibling?.getAttribute('style') !== ''
	) {
		const prevSib = target.previousSibling
		if (prevSib.style.transform !== '')
			prevSib.style.opacity = +prevSib.style.opacity ^ 1 // flip between 0 | 1
	}

	// MORE
	if (
		target.nodeName === 'BUTTON' &&
		target.previousSibling?.nodeValue === '... '
	) {
		// PROXY
	}

	// ARROW
	if (
		target.nodeName === 'BUTTON' &&
		target.getAttribute('tabindex') === '-1'
	) {
		// arrow
	}
}

/**
 *
 */
function scrollFix() {
	if (currentClass !== 'home') return

	document.body.classList.add('ige_hideOverflow')
	const $vlist = $('main > section > div > div > div')

	const vclone_container = document.createElement('div')
	vclone_container.id = 'ige_virtualClone'
	vclone_container.addEventListener('click', clickListener)

	const vclone = $vlist.cloneNode(true)
	vclone.style = ''
	vclone_container.appendChild(vclone)
	$('main > section').after(vclone_container)

	$vlist.children[3]?.scrollIntoView(true)

	const getNode = (o) => o

	// @TODO: Proxy clicks (e.g. nth-of-child -> nth-of-child click); observe every child for changes?
	// or implement:
	// -> like (proxy)
	// -> save (proxy)
	// -> "more" button (proxy!)
	// -> comment (proxy)
	// -> arrow clicks (own code/proxy?)

	// -> video start (own code) 							DONE
	// -> tagged users icon	(own code)				DONE

	observe(
		$vlist,
		(mutations) => {
			for (const i in mutations) {
				const mutation = mutations[i]
				console.log(mutation)

				const added = mutation.addedNodes
				if (mutation.target.className === '' && added.length !== 0) {
					const div = vclone_container.children[0]
					for (const element of added) {
						if (element.className === 'ige_dummyNode') continue

						if (element.nodeName === 'ARTICLE') {
							console.log(
								'imgs',
								element.querySelectorAll('img') === undefined
									? element
									: element.querySelectorAll('img')
							)
							//const clone = element.cloneNode(true)
							//div.appendChild(clone)

							const height = element.offsetHeight
							const dummy = createDummyNode(element.nodeName, height)
							if (mutation.nextSibling !== null)
								dummy.insertBefore(mutation.target, mutation.nextSibling)
							else mutation.previousSibling.after(dummy)

							// stories
							div.appendChild(element)
						}

						if (element.nodeName === 'DIV') {
							const height = element.offsetHeight
							const dummy = createDummyNode(element.nodeName, height)

							if (mutation.nextSibling !== null)
								dummy.insertBefore(mutation.target, mutation.nextSibling)
							else mutation.previousSibling.after(dummy)
							// stories
							div.appendChild(element)
						}
					}
				}
			}
			//vclone_container.removeChild(vclone_container.children[0])
			//const clone = $vlist.cloneNode(true)
			//clone.style = ''
			//vclone_container.appendChild(clone)
			/*udomdiff(
				vclone,
				[...vclone.childNodes], // Array of current items/nodes
				[...$vlist.childNodes], // Array of future items/nodes (returned)
				getNode // a callback to retrieve the node
				//before                // the anchored node to insertBefore
			)*/
		},
		{
			childList: true,
			subtree: true,
		}
	)
}
