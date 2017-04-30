import { Component, h, render } from 'preact'
import { Router } from 'preact-router'
import { createHashHistory } from 'history'
import About from './about'
import Header from './header'
import Liked from './liked'
import Saved from './saved'

export default class App extends Component {
	render() {
		return (
			<div id="app">
				<Header />

				<main className="d-flex justify-content-center">
					<Router history={createHashHistory()}>
						<Liked path="/" default />
						<Saved path="/saved" id="default" />
						<Saved path="/saved/:id" />
						<About path="/about" />
					</Router>
				</main>
			</div>
		)
	}
}
