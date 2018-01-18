import App from './components/App'
//import Nerv, { options, render } from 'nervjs'
import { createElement, hydrate, render } from 'nervjs'
import 'bootstrap/dist/css/bootstrap.min.css'
import './components/main.css'

const init = (fn, app, container) => fn(createElement(app), container)

if (module.hot) {
	require('nerv-devtools')
	//	const { whyDidYouUpdate } = require('why-did-you-update')
	//	whyDidYouUpdate(Nerv)

	module.hot.accept('./components/App', () =>
		requestAnimationFrame(() => {
			init(render, App, document.body.firstElementChild)
		})
	)
}

//if (document.body.firstElementChild === undefined) init(render, App, document.body)
//else
init(hydrate, App, document.body.firstElementChild)
