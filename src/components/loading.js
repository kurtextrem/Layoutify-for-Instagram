import { Component } from 'preact'

export default class Loading extends Component {
	constructor(props) {
		super(props)

		// could use props.width and props.height
	}

	shouldComponentUpdate() {
		return false
	}

	render() {
		return (
			<div class="ball-pulse-sync">
				<div />
				<div />
				<div />
			</div>
		)
	}
}
