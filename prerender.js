const { resolve } = require('path')

/**
 *
 */
function prerender(outputDirectory, params) {
	params = params || {}

	const entry = './' + outputDirectory + '/ssr-bundle.js',
		url = params.url || '/'

	global.window = {
		document: {
			createElement() {
				return {}
			},
			location: {
				hash: '#' + url,
				href: url,
				pathname: url,
				replace() {},
				search: '',
			},
		},
		history: {},
		navigator: { userAgent: '' },
		pushState: {},
		requestIdleCallback() {},
		setTimeout() {}
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
		console.warn(
			'Entry does not export a Component function/class, aborting prerendering.'
		)
		return ''
	}

	const preact = require('preact/dist/preact.umd')
	const renderToString = require(`preact-render-to-string/dist/index`)

	return renderToString(preact.h(app))
}
module.exports = prerender

//console.log(prerender('dist'))
