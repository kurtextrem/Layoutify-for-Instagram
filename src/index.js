import App from './components/App'
import Preact, { h, options, render } from 'preact'

options.syncComponentUpdates = false

const interopDefault = m => (m && m.default) || m

let app = interopDefault(App)

if (typeof app === 'function') {
	let root = document.body.firstChild

	const init = () => {
		app = interopDefault(require('./components/App'))
		root = render(h(app), document.body, root)
	}

	if (module.hot) {
		require('preact/devtools')
		const { whyDidYouUpdate } = require('why-did-you-update')
		whyDidYouUpdate(Preact)
		module.hot.accept('./components/App', () => requestAnimationFrame(init))
	}

	init()
}
