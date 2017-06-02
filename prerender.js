const { resolve } = require('path')

module.exports = function prerender(outputDir, params) {
	params = params || {}

	let entry = resolve(outputDir, './ssr-build/ssr-bundle.js'),
		url = params.url || '/'

	global.window = { document: { createElement() { return {} }, location: { href: url, pathname: url, replace() { } } }, history: {}, navigator: { userAgent: '' }, pushState: {} }
	global.window.location = global.window.document.location
	global.history = global.window.history
	global.document = global.window.document
	global.location = global.window.location

	let m = require(entry),
		app = m && m.default || m

	if (typeof app !== 'function') {
		// eslint-disable-next-line no-console
		console.warn('Entry does not export a Component function/class, aborting prerendering.')
		return ''
	}

	let preact = require('preact'),
		renderToString = require('preact-render-to-string')

	const html = renderToString(preact.h(app, {}))

	return html
}
