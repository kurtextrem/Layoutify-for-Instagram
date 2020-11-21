import App from './components/App'
//import Preact, { h, hydrate, render } from 'preact'
import { documentReady, logAndReturn } from './components/Utils'
import { h, options, render } from 'preact'
/* eslint-disable */
import './components/main.css'
import 'bootstrap/dist/css/bootstrap.min.css'
/* eslint-enable */

if (module.hot) {
	import('preact/debug')
	const { registerObserver } = require('react-perf-devtool')
	//const { whyDidYouRender } = require('@welldone-software/why-did-you-render')

	registerObserver()
	//whyDidYouRender(Preact)
	// @todo: Add preact-perf-profiler

	module.hot.accept('./components/App', () =>
		requestAnimationFrame(() => {
			init(render, App, document.body.children[2])
		})
	)

	const Perfume = require('perfume.js').default
	new Perfume({
		logging: true,
		logPrefix: '⚡️',
		resourceTiming: false,
	})

	new PerformanceObserver((list, observer) => {
		for (const entry of list.getEntries()) {
			const time = Math.round(entry.startTime + entry.duration)
			console.info('⚡', entry.name !== '' ? entry.name : entry.entryType, time, entry)
		}
	}).observe({
		entryTypes: [
			'element',
			'first-input',
			'largest-contentful-paint',
			'layout-shift',
			'longtask',
			'mark',
			'measure',
			'navigation',
			'paint',
		], // PerformanceObserver.supportedEntryTypes
	}) // resource, paint,
}

options.debounceRendering = requestIdleCallback

const init = (fn, app, container) => fn(h(app), container)
const ready = () => init(module.hot ? render : render, App, document.body.children[0]) // @todo: https://css-tricks.com/render-caching-for-react/ @todo: hydrate breaks reload.

documentReady().then(ready).catch(logAndReturn)
