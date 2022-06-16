import Feed from './components/feed/Feed'
// eslint-disable-next-line
import 'react-responsive-modal/styles.css'
// eslint-disable-next-line
import './components/feed/feed.css'
import { h, options, render } from 'preact'

// options.debounceRendering = requestIdleCallback

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

if (location.pathname === '/feed.html') ready()
else if (location.href.indexOf('instagram.com') !== -1) {
	// install navigation observer
	if (location.pathname === '/' && window._sharedData && window._sharedData.config.viewer !== null)
		// logged-in
		ready()
	else {
		const observer = new MutationObserver(function (mutations) {
			const el = document.querySelector('[id^="mount"]')
			if (el && el.classList.contains('home') && window._sharedData && window._sharedData.config.viewer !== null) {
				observer.disconnect()
				ready()
			}
		})
		observer.observe(document.body, { childList: true, subtree: true })
	}
}
