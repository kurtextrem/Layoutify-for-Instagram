import App from './components/App'
//import Nerv, { createElement, hydrate, render } from 'nervjs'
import { createElement, hydrate, render } from 'nervjs'
import { documentReady, logAndReturn } from './components/Utils'
/* eslint-disable */
import 'bootstrap/dist/css/bootstrap.min.css'
import './components/main.css'
/* eslint-enable */

if (module.hot) {
	import('nerv-devtools')
	const { registerObserver } = require('react-perf-devtool')
	//const { whyDidYouUpdate } = require('why-did-you-update')

	registerObserver()
	//whyDidYouUpdate(Nerv)
	// @todo: Add preact-perf-profiler

	module.hot.accept('./components/App', () =>
		requestAnimationFrame(() => {
			init(render, App, document.body.children[2])
		})
	)

	const Perfume = require('perfume.js').default
	window.perf = new Perfume({
		firstPaint: true,
		firstContentfulPaint: true,
		firstInputDelay: true,
		logging: true,
		logPrefix: '⚡️',
		timeToInteractive: true,
	})

	new PerformanceObserver((list, observer) => {
		for (const entry of list.getEntries()) {
			// const time = Math.round(entry.startTime + entry.duration)
			window.perf.log(entry.name, entry.duration)
		}
	}).observe({ entryTypes: ['event', 'measure', 'mark', 'navigation', 'longtask'] }) // resource, paint,
}

const init = (fn, app, container) => fn(createElement(app), container)
const ready = () => init(module.hot ? render : hydrate, App, document.body.children[2]) // @todo: https://css-tricks.com/render-caching-for-react/

documentReady()
	.then(ready)
	.catch(logAndReturn)
