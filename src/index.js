import { h, options, render } from 'preact' // eslint-disable-line no-unused-vars

options.syncComponentUpdates = false

const interopDefault = m => m && m.default || m

let app = interopDefault(require('./components/App'))

if (typeof app === 'function') {
	let root = document.body.firstChild

	const init = () => {
		app = interopDefault(require('./components/App'))
		root = render(h(app), document.body, root)
	}

	if (module.hot) {
		require('preact/devtools')
		module.hot.accept('./components/App', () => requestAnimationFrame(init))
	}

	init()
}
