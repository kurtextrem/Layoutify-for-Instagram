(function (window) {
	'use strict'

	var document = window.document

	// block middle mouse button
	window.addEventListener('click', function (e) { if (e.button > 0) e.stopPropagation() }, true);

	// prevent vid restart
	window.addEventListener('blur', function (e) { e.stopPropagation() }, true)
	window.addEventListener('visibilitychange', function (e) { e.stopPropagation() }, true)

	var observer = null
	function observe(elem, fn) {
		if (!elem) return;

		observer = new MutationObserver(fn)
		observer.observe(elem, { childList: true, subtree: true })
	}

	var root = document.getElementById('react-root')
	observe(root, function (mutations) {
		for (var i = 0; i < mutations.length; i++) {
			var mutation = mutations[i].addedNodes

			if (mutation.length === 1 && mutation[0].nodeName === 'VIDEO') {
				mutation[0].controls = 'true'
			}
		}
		window.requestIdleCallback(addControls)
	})

	if (document.readyState === 'interactive' || document.readyState === 'complete') {
		addControls()
	} else {
		document.addEventListener('DOMContentLoaded', function(event) {
			addControls()
		})
	}

	function addControls() {
		var addAuto = false
		if (location.pathname.indexOf('/p/') !== -1)
			addAuto = true

		root.querySelectorAll('video').forEach(function (elem) {
			elem.controls = 'true'
			if (addAuto)
				elem.preload = 'auto'
		})
	}
} (window));