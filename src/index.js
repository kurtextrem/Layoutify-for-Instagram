import { h, options, render } from 'preact' // eslint-disable-line no-unused-vars

options.syncComponentUpdates = false

let root
function init() {
	const App = require('./components/app').default
	root = render(<App />, document.body, root)
}

if (module.hot) {
	require('preact/devtools')
	module.hot.accept('./components/app', () => requestAnimationFrame(init))
}

init()
