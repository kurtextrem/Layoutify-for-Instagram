import { Component, createElement } from 'nervjs'

// could use props.width and props.height
export default class Loading extends Component {
	shouldComponentUpdate() {
		return false
	}

	render() {
		return (
			<div className="ball-pulse-sync">
				<div />
				<div />
				<div />
			</div>
		)
	}
}
