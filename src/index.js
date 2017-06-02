import { h, options, render } from 'preact' // eslint-disable-line no-unused-vars

options.syncComponentUpdates = false

const interopDefault = m => m && m.default || m

let app = interopDefault(require('./components/app'))

if (typeof app === 'function') {
	let root = document.body

	const init = () => {
		app = interopDefault(require('./components/app'))
		root = render(h(app), document.body, root)
	}

	if (module.hot) {
		require('preact/devtools')
		module.hot.accept('./components/app', () => requestAnimationFrame(init))
	}

	init()
}
