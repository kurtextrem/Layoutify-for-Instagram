/**
 * Chrome Extensions don't have access to `window` props when not being in the page scope.
 * So we inject the main functions into the page in order to get access.
 */
;(function inject() {
	'use strict'

	if (location.pathname.indexOf('/embed/') > 0) return // do not do stuff on embeds, > 0, because a user could be called embed.

	const scripts = ['runtime.bundle.js', 'commons.bundle.js', 'feed.bundle.js', 'content/igdata.js']

	for (let i = 0; i < scripts.length; ++i) {
		const s = document.createElement('script')
		s.src = chrome.runtime.getURL(scripts[i])
		document.body.appendChild(s)
	}

	const c = document.createElement('link')
	c.href = chrome.runtime.getURL('feed.css')
	c.rel = 'stylesheet'
	c.id = 'ige_feedCSS'
	document.body.appendChild(c)
})()
