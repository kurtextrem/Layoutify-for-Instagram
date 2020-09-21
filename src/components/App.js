import About from './About'
import EventComponent from './EventComponent'
import Liked from './Liked'
import Nav from './Nav'
import Options from './Options'
import Saved from './Saved'
import bind from 'autobind-decorator'
import { Component, h } from 'preact'
import { HashRouter, Route } from './HashRouter'
// @todo: Lazy-load router and routes for faster TTI

class App extends EventComponent {
	state = {
		location: window.location.hash,
	}

	@bind
	handleLocationChanged(childKey, params, cb) {
		this.setState((prevState, props) => ({ location: childKey }))
		cb()
	}

	shouldComponentUpdate(nextProps, nextState) {
		return nextState.location !== this.state.location
	}

	hashchange(e) {
		console.log(e)
	}

	componentDidMount() {
		window.addEventListener('hashchange', this)
	}

	render() {
		return (
			<div id="app">
				<Nav location={this.state.location} />

				<main class="d-flex justify-content-center">
					<HashRouter onLocationChanged={this.handleLocationChanged}>
						<Route key="liked" hash="#/">
							{Liked}
						</Route>
						<Route key="saved" hash="#/saved">
							<Saved />
						</Route>
						<Route key="collection" hash="#/collection">
							<Saved id={this.state.location.split('/')[2]} />
						</Route>
						<Route key="options" hash="#/options">
							<Options />
						</Route>
						<Route key="about" hash="#/about">
							<About />
						</Route>
					</HashRouter>
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
