'use strict'

const { resolve } = require('path')
const babelConfig = require('./babelConfig')
const config = babelConfig(true, { modules: 'commonjs' })
config.babelrc = false
config.ignore = false

require('babel-register')

module.exports = function prerender(params) {
	params = params || {}

	const entry = require('./src/components/app'),
		url = params.url || '/'

	global.location = { href: url, pathname: url }
	global.history = {}

	const preact = require('preact'),
		renderToString = require('preact-render-to-string')

	const html = renderToString(preact.h(entry, {}))

	// restore resolution without loader stripping
	//Module._resolveFilename = oldResolve

	return html
}
