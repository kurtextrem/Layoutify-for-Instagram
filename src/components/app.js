import About from './about'
import Header from './header'
import Liked from './liked'
import Saved from './saved'
import bind from 'autobind-decorator'
import { Component, createElement } from 'nervjs'
import { HashRouter, Route } from './HashRouter'

export default class App extends Component {
	constructor(props) {
		super(props)

		this.state = {
			location: window.location.hash.replace('#/', ''),
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

	componentShouldUpdate(nextProps, nextState) {
		return nextState.location !== this.state.location
	}

	render() {
		return (
			<div id="app">
				<Header location={this.state.location} />

				<main className="d-flex justify-content-center">
					<HashRouter onLocationChanged={this.handleLocationChanged}>
						<Route key="liked" hash="#/">
							{Liked}
						</Route>
						<Route key="saved" hash="#/saved">
							{Saved}
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
