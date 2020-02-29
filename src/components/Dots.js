import { Component, h } from 'preact'

export default class Dots extends Component {
	shouldComponentUpdate(nextProperties, nextState) {
		return nextProperties.index !== this.props.index
	}

	renderDot(i) {
		return (
			<span
				key={`${i}`}
				className={`dots--dot m-1${i === this.props.index ? ' active' : ''}`}
			/>
		)
	}

	render() {
		const { len } = this.props,
			dots = [] // faster read

		dots.length = len
		dots[0] = this.renderDot(0)
		for (let i = 1; i < len; ++i) {
			dots[i] = this.renderDot(i)
		}

		return <div className="dots d-flex justify-content-center">{dots}</div>
	}
}
