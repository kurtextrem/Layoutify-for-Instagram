const { resolve } = require('path')

module.exports = function prerender(outputDir, params) {
	params = params || {}

	const entry = resolve(outputDir, './ssr-bundle.js'),
		url = params.url || '/'

	global.window = {
		document: {
			createElement() {
				return {}
			},
			location: { href: url, pathname: url, replace() {} },
		},
		history: {},
		navigator: { userAgent: '' },
		pushState: {},
		setTimeout() {},
	}
	global.window.location = global.window.document.location
	global.history = global.window.history
	global.document = global.window.document
	global.location = global.window.location
	global.chrome = {
		storage: {
			onChanged: {
				addListener() {},
			},
		},
	}

	let m
	try {
		m = require(entry)
	} catch (e) {
		console.warn("Couldn't find", entry)
		return
	}

	const app = (m && m.default) || m
	if (typeof app !== 'function') {
		console.warn('Entry does not export a Component function/class, aborting prerendering.')
		return ''
	}

	const preact = require('preact'),
		renderToString = require('preact-render-to-string')

	return renderToString(preact.h(app, {}))
}
