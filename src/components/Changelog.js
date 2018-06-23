import { Component, createElement } from 'nervjs'
import { logAndReturn } from './Utils'

export default class Changelog extends Component {
	state = {
		data: null,
	}

	componentDidMount() {
		if (this.state.data === null)
			window
				.fetch('CHANGELOG.md')
				.then(e => e.text())
				.then(text => {
					this.setState((prevState, props) => ({ data: text }))
					return text
				})
				.catch(logAndReturn)
	}

	render() {
		const { data } = this.state
		return data !== null ? (
			<div>
				<pre>{data}</pre>
			</div>
		) : null
	}
}
