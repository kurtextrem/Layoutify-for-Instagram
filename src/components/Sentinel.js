import bind from 'autobind-decorator'
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

	@bind
	setRef(ref) {
		this.ref = ref
	}

	@bind
	onUpdate(entries) {
		const entry = entries[0]
		if (entry.isIntersecting) this.onVisible()
		else this.onHide()
	}

	componentDidMount() {
		this.io = new IntersectionObserver(this.onUpdate)
		this.io.observe(this.ref)
	}

	shouldComponentUpdate() {
		return false
	}

	componentWillUnmount() {
		this.io.disconnect()
	}

	render() {
		return <div ref={this.setRef} className="sentinel" />
	}
}
