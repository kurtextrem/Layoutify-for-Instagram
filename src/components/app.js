import About from './About'
import Header from './Header'
import Liked from './Liked'
import Saved from './Saved'
import { Component, createElement } from 'nervjs'
import { HashRouter, Route } from './HashRouter'

export default class App extends Component {
	handleLocationChanged(childKey, params, cb) {
		switch (childKey) {
			case 'liked':
				cb()
				break
			case 'saved':
				cb()
				break
			case 'about':
				cb()
				break
			default:
				cb()
				break
		}
	}

	render() {
		return (
			<div id="app">
				<Header />

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
