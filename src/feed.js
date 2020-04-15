import Feed from './components/feed/Feed'
import './components/feed/feed.css'
import { h, options, render } from 'preact'

options.debounceRendering = requestIdleCallback

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
	if (location.pathname === '/' && window._sharedData.config.viewer !== null)
		// logged
		ready()
	else {
		const observer = new MutationObserver(function (mutations) {
			for (const i in mutations) {
				const mutation = mutations[i]
				if (mutation.target.classList.contains('home') && window._sharedData.config.viewer !== null) {
					ready()
					return
				}
			}
		})
		observer.observe(document.getElementById('react-root'), { attributeFilter: ['class'], attributes: true })
	}
}
