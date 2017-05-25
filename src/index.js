import { h, render } from 'preact'

// this holds our rendered root element so we can re-render in response to HMR updates.
let root = document.body.firstElementChild
function init() {
	const App = require('./components/app').default
	root = render(<App />, document.body, root)
}

if (module.hot) {
	require('preact/devtools')
	module.hot.accept('./components/app', () => requestAnimationFrame(init))
}

init()
