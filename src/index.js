import App from './components/App'
//import Nerv, { createElement, hydrate, render } from 'nervjs'
import { createElement, hydrate, render } from 'nervjs'
/* eslint-disable */
import 'bootstrap/dist/css/bootstrap.min.css'
import './components/main.css'
/* eslint-enable */

const init = (fn, app, container) => fn(createElement(app), container)
const ready = () => init(hydrate, App, document.body.children[2])

if (module.hot) {
	require('nerv-devtools')
	const { registerObserver } = require('react-perf-devtool')
	const { whyDidYouUpdate } = require('why-did-you-update')
	const Perfume = require('perfume.js').default
	window.perf = new Perfume({
		firstPaint: true,
		firstContentfulPaint: true,
		logging: true,
		logPrefix: '⚡️',
		timeToInteractive: true,
	})

	registerObserver()
	//whyDidYouUpdate(Nerv)

	module.hot.accept('./components/App', () =>
		requestAnimationFrame(() => {
			init(render, App, document.body.children[2])
		})
	)
}

if (document.readyState === 'interactive' || document.readyState === 'complete') ready()
else document.addEventListener('DOMContentLoaded', ready)
