import Feed from './components/feed/Feed'
import './components/feed/feed.css'
import { h, render } from 'preact'

const ready = () => render(h(Feed), document.getElementById('ige_feed')) // @todo: https://css-tricks.com/render-caching-for-react/

if (module.hot) {
	import('preact/debug')
	const { registerObserver } = require('react-perf-devtool')
	//const { whyDidYouRender } = require('@welldone-software/why-did-you-render')

	registerObserver()
	//whyDidYouRender(Preact)
	// @todo: Add preact-perf-profiler

	module.hot.accept('./components/feed/Feed', () => requestAnimationFrame(ready))
}

if (location.href.indexOf('instagram.com') !== -1 || location.pathname === '/feed.html') ready()
