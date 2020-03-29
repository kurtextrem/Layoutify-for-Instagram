import Feed from './components/feed/Feed'
import './components/feed/feed.css'
import { h, render } from 'preact'

const ready = () => render(h(Feed), document.getElementById('ige_feed')) // @todo: https://css-tricks.com/render-caching-for-react/

if (location.href.indexOf('instagram.com') !== -1 || location.pathname === '/feed.html') ready()
