import App from './components/app'
//import Nerv, { createElement, hydrate, render } from 'nervjs'
import { createElement, hydrate, render } from 'nervjs'
/* eslint-disable */
import 'bootstrap/dist/css/bootstrap.min.css'
import './components/main.css'
/* eslint-enable */

const init = (fn, app, container) => fn(createElement(app), container)

if (module.hot) {
	require('nerv-devtools')
	const { registerObserver } = require('react-perf-devtool')

	registerObserver()
	//const { whyDidYouUpdate } = require('why-did-you-update')
	//whyDidYouUpdate(Nerv)

	module.hot.accept('./components/App', () =>
		requestAnimationFrame(() => {
			init(render, App, document.body.firstElementChild)
		})
	)
}

//if (document.body.firstElementChild === undefined) init(render, App, document.body)
//else
init(hydrate, App, document.body.firstElementChild)
