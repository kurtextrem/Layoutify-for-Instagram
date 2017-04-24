import { h, render, Component } from 'preact'
import { Router } from 'preact-router'

export default class About extends Component {
	shouldComponentUpdate() {
		return false
	}

	render() {
		return (
			<span>Abc</span>
		)
	}
}
