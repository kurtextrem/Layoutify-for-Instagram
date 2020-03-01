import App from './components/App'
//import Preact, { h, hydrate, render } from 'preact'
import { h, hydrate, render } from 'preact'
import { documentReady, logAndReturn } from './components/Utils'
/* eslint-disable */
import 'bootstrap/dist/css/bootstrap.min.css'
import './components/main.css'
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
	window.perf = new Perfume({
		resourceTiming: true,
		logging: true,
		logPrefix: '⚡️',
	})

	new PerformanceObserver((list, observer) => {
		for (const entry of list.getEntries()) {
			// const time = Math.round(entry.startTime + entry.duration)
			window.perf.log(entry.name, entry.duration)
		}
	}).observe({
		entryTypes:
			PerformanceObserver.supportedEntryTypes !== undefined
				? PerformanceObserver.supportedEntryTypes
				: ['event', 'measure', 'mark', 'navigation', 'longtask', 'paint'],
	}) // resource, paint,
}

const init = (fn, app, container) => fn(h(app), container)
const ready = () =>
	init(module.hot ? render : hydrate, App, document.body.children[2]) // @todo: https://css-tricks.com/render-caching-for-react/

documentReady()
	.then(ready)
	.catch(logAndReturn)
