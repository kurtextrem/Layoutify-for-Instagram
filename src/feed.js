import Feed from './components/Feed'
import { h, hydrate, render } from 'preact'

console.log('test')

const init = (fn, app, container) => fn(h(app), container)
const ready = () =>
	init(module.hot ? render : hydrate, Feed, document.getElementById('ige_feed')) // @todo: https://css-tricks.com/render-caching-for-react/

if (location.href.indexOf('instagram.com') !== -1) ready()
