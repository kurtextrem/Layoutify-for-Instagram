/**
 * Chrome Extensions don't have access to `window` props when not being in the page scope.
 * So we inject the main functions into the page in order to get access.
 *
 * @author 	Jacob Groß
 * @date   	2016-03-01
 */
;(function inject(document) {
	'use strict'

	const scripts = ['runtime.bundle.js', 'commons.bundle.js', 'feed.bundle.js', 'content/igdata.js']

	scripts.forEach(v => {
		const s = document.createElement('script')
		s.src = chrome.extension.getURL(v)
		document.body.appendChild(s)
	})

	const c = document.createElement('link')
	c.href = chrome.extension.getURL('feed.css')
	c.rel = 'stylesheet'
	c.id = 'ige_feedCSS'
	document.body.appendChild(c)
})(window.document)
