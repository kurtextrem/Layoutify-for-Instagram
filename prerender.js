const { resolve } = require('path')

function prerender(outputDir, params) {
	params = params || {}

	const entry = './' + outputDir + '/ssr-bundle.js',
		url = params.url || '/'

	global.window = {
		document: {
			createElement() {
				return {}
			},
			location: { href: url, pathname: url, replace() {}, hash: '#' + url },
		},
		history: {},
		navigator: { userAgent: '' },
		pushState: {},
		setTimeout() {},
	}
	global.navigator = global.window.navigator
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
		console.error(e)
	}

	const app = (m && m.default) || m
	if (typeof app !== 'function') {
		console.warn('Entry does not export a Component function/class, aborting prerendering.')
		return ''
	}

	const nerv = require('nervjs'),
		dom = require('nerv-server')

	return dom.renderToString(nerv.createElement(app))
}
module.exports = prerender

//console.log(prerender('dist'))
