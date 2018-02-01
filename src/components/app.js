import About from './About'
import Header from './Header'
import Liked from './Liked'
import Saved from './Saved'
import { Component, createElement } from 'nervjs'
import { HashRouter, Route } from './HashRouter'
import { bind } from 'decko'

export default class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
			location: location.hash.replace('#/', ''),
		}
	}

	@bind
	handleLocationChanged(childKey, params, cb) {
		switch (childKey) {
			case 'liked':
				this.setState(prevState => ({ location: 'liked' }))
				cb()
				break
			case 'saved':
				this.setState(prevState => ({ location: 'saved' }))
				cb()
				break
			case 'about':
				this.setState(prevState => ({ location: 'about' }))
				cb()
				break
			default:
				this.setState(prevState => ({ location: 'liked' }))
				cb()
				break
		}
	}

	render() {
		return (
			<div id="app">
				<Header location={this.state.location} />

				<main className="d-flex justify-content-center">
					<HashRouter onLocationChanged={this.handleLocationChanged}>
						<Route key="liked" hash="#/">
							<Liked />
						</Route>
						<Route key="saved" hash="#/saved">
							<Saved />
						</Route>
						<Route key="about" hash="#/about">
							<About />
						</Route>
					</HashRouter>
				</main>
				<a href="#" id="backToTop">
					<i className="material-icons">keyboard_arrow_up</i>
				</a>
			</div>
		)
	}
}
