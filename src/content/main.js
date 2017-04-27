(function(window) {
	'use strict'

	var document = window.document

	// block middle mouse button
	window.addEventListener('click', function(e) { if (e.button > 0) e.stopPropagation() }, true)

	// prevent vid restart
	window.addEventListener('blur', function(e) { e.stopPropagation() }, true)
	window.addEventListener('visibilitychange', function(e) { e.stopPropagation() }, true)

	var observer = null
	function observe(elem, fn) {
		if (!elem) return

		observer = new MutationObserver(fn)
		observer.observe(elem, { childList: true, subtree: true })
	}

	var root = document.getElementById('react-root')
	observe(root, function(mutations) {
		for (var i = 0; i < mutations.length; i++) {
			var mutation = mutations[i].addedNodes

			if (mutation.length === 1 && mutation[0].nodeName === 'VIDEO') {
				mutation[0].controls = 'true'
			}
		}

		window.requestIdleCallback(onChange)
	})

	if (document.readyState === 'interactive' || document.readyState === 'complete') {
		window.requestIdleCallback(onReady)
	} else {
		document.addEventListener('DOMContentLoaded', function() {
			window.requestIdleCallback(onReady)
		})
	}

	var documentElement = document.documentElement
	function onReady() {
		addControls()

		documentElement.style.setProperty('--boxHeight', document.querySelector('div > article').offsetHeight + 'px') // give boxes equal height

		setSpriteVars()

		addExtendedButton()
		addListener()
	}

	function onChange() {
		addControls()

		checkURL()
	}

	var url = document.location.href, regex = /\/.+/
	function checkURL() {
		if (document.location.href !== url) {
			console.log('url change', url, document.location.href)
			url = document.location.href

			var section = document.querySelector('#react-root > section')
			if (regex.test(url) && url.indexOf('/p/') === -1) { // profile page
				section.classList.add('profile')
			} else if (regex.test(url)) { // post page
				section.classList.add('post')
			} else {
				section.classList.remove('profile')
				section.classList.remove('post')
			}
		}
	}

	function setSpriteVars() {
		var el = document.createElement('div')
		el.classList.add('coreSpriteVideoIconSmall')
		document.body.appendChild(el)

		var computed = window.getComputedStyle(el)
		documentElement.style.setProperty('--spriteUrl', computed.backgroundImage) // set correct sprite url
		documentElement.style.setProperty('--spritePosition', computed.backgroundPosition) // set correct sprite url
		document.body.removeChild(el)
		el = undefined
	}


	var liked = new window.getInstagram('liked'),
		saved = new window.getInstagram('saved')
	function addExtendedButton() {
		var anchor = document.getElementsByClassName('coreSpriteDesktopNavProfile')[0].parentNode
		var el = anchor.cloneNode(true), a = el.childNodes[0]
		a.classList.add('coreSpriteEllipsis')
		a.classList.remove('coreSpriteDesktopNavProfile')
		a.href = '#'
		a.title = 'Improved Layout for Instagram'
		a.onclick = function(e) {
			e.preventDefault()

			liked.start().then(liked.fetch())
			saved.start().then(saved.fetch())
			chrome.runtime.sendMessage(null, { action: 'click' })
		}
		el.style.top = '-8px'
		anchor.after(el)
	}

	function addListener() {
		chrome.runtime.onMessage.addListener(
			function(request, sender, sendResponse) {
				if (request.action === 'load')
					if (request.which === 'liked')
						liked.fetch()
					else
						saved.fetch()
			}
		)
	}

	function addControls() {
		var addAuto = false
		if (location.pathname.indexOf('/p/') !== -1)
			addAuto = true

		var elems = root.querySelectorAll('video')
		for (var i = 0; i < elems.length; i++) {
			var elem = elems[i]

			elem.controls = 'true'

			if (addAuto)
				elem.preload = 'auto'
		}
	}
}(window))
