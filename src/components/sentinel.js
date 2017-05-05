import { h, render, Component } from 'preact' // eslint-disable-line no-unused-vars

export default class Sentinel extends Component {
	constructor(props) {
		super(props)

		this.onVisible = props.onVisible
		if (props.onVisible === undefined) {
			this.onVisible = function () { }
		}
		this.onHide = props.onHide
		if (props.onHide === undefined) {
			this.onHide = function () { }
		}

		this.io = new IntersectionObserver(this.onUpdate)
	}

	onUpdate = (entries) => {
		const entry = entries[0]
		if (entry.isIntersecting)
			this.onVisible()
		else
			this.onHide()
	}

	setNode = (ref) => {
		this.node = ref
	}

	shouldComponentUpdate() {
		return false
	}

	async componentDidMount() {
		this.io.observe(this.node)
	}

	async componentWillUnmount() {
		this.io.disconnect()
	}

	render() {
		return (
			<div className="sentinel" ref={this.setNode}></div>
		)
	}
}
