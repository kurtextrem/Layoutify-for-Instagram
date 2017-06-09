import { Component, h, render } from 'preact' // eslint-disable-line no-unused-vars

export default class Dots extends Component {
	renderDot = i => {
		return <span key={i} className={'dots--dot m-1 ' + (i === this.props.index ? 'active' : '')} />
	}

	shouldComponentUpdate(nextProps, nextState) {
		return nextProps.index !== this.props.index
	}

	render(props) {
		const dots = new Array(props.len)
		dots[0] = this.renderDot(0)
		for (let i = 1; i < props.len; ++i) {
			dots.push(this.renderDot(i))
		}

		return (
			<div className="dots d-flex justify-content-center">
				{dots}
			</div>
		)
	}
}
