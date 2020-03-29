import Feed from './components/feed/Feed'
import './components/feed/feed.css'
import { h, hydrate, render } from 'preact'

const init = (fn, app, container) => fn(h(app), container)
const ready = () => init(module.hot ? render : hydrate, Feed, document.getElementById('ige_feed')) // @todo: https://css-tricks.com/render-caching-for-react/

if (location.href.indexOf('instagram.com') !== -1 || location.pathname === '/feed.html') ready()
