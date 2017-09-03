import { Component, h } from 'preact'

export default class Sentinel extends Component {
	constructor(props) {
		super(props)

		this.onVisible = props.onVisible
		if (props.onVisible === undefined) {
			this.onVisible = function onVisible() {}
		}
		this.onHide = props.onHide
		if (props.onHide === undefined) {
			this.onHide = function onHide() {}
		}

		this.io = null
		this.ref = null
	}

	onUpdate = entries => {
		const entry = entries[0]
		if (entry.isIntersecting) this.onVisible()
		else this.onHide()
	}

	setRef = ref => (this.ref = ref)

	shouldComponentUpdate() {
		return false
	}

	componentDidMount() {
		this.io = new IntersectionObserver(this.onUpdate)
		this.io.observe(this.ref)
	}

	componentWillUnmount() {
		this.io.disconnect()
	}

	render() {
		return <div ref={this.setRef} className="sentinel" />
	}
}
