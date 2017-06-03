import { Component, h, render } from 'preact' // eslint-disable-line no-unused-vars

import { Router } from 'preact-router'
import { createHashHistory } from 'history'
import About from './About'
import Header from './Header'
import Liked from './Liked'
import Saved from './Saved'

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
