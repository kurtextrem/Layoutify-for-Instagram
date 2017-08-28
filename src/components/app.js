import About from './About'
import Header from './Header'
import Liked from './Liked'
import Saved from './Saved'
import { Component } from 'preact'
import { Router } from 'preact-router'
import { createHashHistory } from 'history'

const hashHistory = createHashHistory()

export default class App extends Component {
	render() {
		return (
			<div id="app">
				<Header />

				<main className="d-flex justify-content-center">
					<Router history={hashHistory}>
						<Liked path="/" default />
						<Saved path="/saved" />
						<About path="/about" />
					</Router>
				</main>
			</div>
		)
	}
}
