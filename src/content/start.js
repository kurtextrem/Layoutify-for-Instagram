/**
 * Chrome Extensions don't have access to `window` props when not being in the page scope.
 * So we inject the main functions into the page in order to have access to 'onYouTubePlayerReady'
 *
 * @author 	Jacob Groß
 * @date   	2016-03-01
 */
;(function inject(document) {
	'use strict'

	const scripts = [
		'content/InstagramFeed.js',
		'runtime.bundle.js',
		'vendors.bundle.js',
		'commons.bundle.js',
		'feed.bundle.js',
	]

	scripts.forEach((v) => {
		const s = document.createElement('script')
		s.src = chrome.extension.getURL(v)
		document.documentElement.appendChild(s)
	})
})(window.document)
