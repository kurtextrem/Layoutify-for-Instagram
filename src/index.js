import { h, render } from 'preact'

// this holds our rendered root element so we can re-render in response to HMR updates.
let root
function init() {
	let App = require('./components/app').default
	root = render(<App />, document.body, root)
}

// in development, set up HMR:
if (module.hot) {
	require('preact/devtools') // turn this on if you want to enable React DevTools!
	module.hot.accept('./components/app', () => requestAnimationFrame(init))
}

// initial render!
init()
