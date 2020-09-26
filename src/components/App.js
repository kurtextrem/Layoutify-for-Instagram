import About from './About'
import Liked from './Liked'
import Nav from './Nav'
import NavPortal from './NavPortal'
import Options from './Options'
import Saved, { renderCollection } from './Saved'
import bind from 'autobind-decorator'
import { Component, h } from 'preact'
import { HashRouter, Route } from './HashRouter'
import { Storage, shallowDiffers } from './Utils'
// @todo: Lazy-load router and routes for faster TTI

class App extends Component {
	state = {
		items: null,
		location: window.location.hash,
	}

	@bind
	handleLocationChanged(childKey, params, cb) {
		this.setState({ location: childKey })
		cb()
	}

	shouldComponentUpdate(nextProps, nextState) {
		return shallowDiffers(this.state, nextState)
	}

	async componentDidMount() {
		const items = await Storage.get('collections', null)
		console.log('loading items', items)
		this.setState({ items })
	}

	render() {
		const { location, items } = this.state
		return (
			<div id="app">
				<Nav location={location} />

				<main class="d-flex justify-content-center">
					<HashRouter onLocationChanged={this.handleLocationChanged}>
						<Route key="liked" hash="#/">
							{Liked}
						</Route>
						<Route key="saved" hash="#/saved">
							<Saved />
						</Route>
						<Route key="collection" hash="#/collection">
							<Saved id={() => window.location.hash.split('/')[2]} />
						</Route>
						<Route key="options" hash="#/options">
							<Options />
						</Route>
						<Route key="about" hash="#/about">
							<About />
						</Route>
					</HashRouter>
					{items !== null ? <NavPortal>{renderCollection(items.items, 'nav')}</NavPortal> : null}
				</main>
				<a href="#" id="backToTop">
					↑️
				</a>
			</div>
		)
	}
}

// __optimizeReactComponentTree is only known to Prepack
// so we wrap it in a conditional so the code still works
// for local development testing without Prpeack
if (typeof __optimizeReactComponentTree !== 'undefined') {
	__optimizeReactComponentTree(App)
}

export default App
