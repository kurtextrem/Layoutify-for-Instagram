'use strict'

const { resolve } = require('path')
const babelConfig = require('./babelConfig')
const config = babelConfig(true, { modules: 'commonjs' })
require('babel-register').default(config)

module.exports = function prerender(params) {
	params = params || {}

	const entry = resolve('./src/components/app'),
		url = params.url || '/'

	global.location = { href: url, pathname: url }
	global.history = {}

	// strip webpack loaders from import names
	const { Module } = require('module')
	const oldResolve = Module._resolveFilename
	Module._resolveFilename = function(request, parent, isMain) {
		request = request.replace(/^.*\!/g, '')
		return oldResolve.call(this, request, parent, isMain)
	}

	const m = require(entry),
		app = m && m.default || m

	if (typeof app !== 'function') {
		// eslint-disable-next-line no-console
		console.warn('Entry does not export a Component function/class, aborting prerendering.')
		return ''
	}

	const preact = require('preact'),
		renderToString = require('preact-render-to-string')

	const html = renderToString(preact.h(app, { url }))

	// restore resolution without loader stripping
	Module._resolveFilename = oldResolve

	return html
}
