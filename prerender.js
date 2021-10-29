const { resolve } = require('path')

/**
 * @param outputDirectory
 * @param params
 */
module.exports = function prerender(outputDirectory, params) {
	params = params || {}

	const entry = `./${outputDirectory}/ssr-bundle.js`,
		url = params.url || '/'

	global.window = {
		addEventListener() {},
		document: {
			createElement() {
				return {}
			},
			location: {
				hash: `#${url}`,
				href: url,
				pathname: url,
				replace() {},
				search: '',
			},
		},
		history: {},
		navigator: { userAgent: '' },
		pushState: {},
		removeEventListener() {},
		requestIdleCallback() {},
		setTimeout() {},
	}
	global.navigator = global.window.navigator
	global.window.location = global.window.document.location
	global.history = global.window.history
	global.document = global.window.document
	global.location = global.window.location
	global.chrome = {
		runtime: {
			sendMessage() {},
		},
		storage: {
			local: {
				get() {},
			},
			onChanged: {
				addListener() {},
			},
			sync: {
				get() {},
			},
		},
	}
	window.IntersectionObserver = class {}
	window.ResizeObserver = class {}

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

	const preact = require('preact')
	const renderToString = require(`preact-render-to-string`)

	return renderToString(preact.h(app))
}

//console.log(prerender('dist'))
