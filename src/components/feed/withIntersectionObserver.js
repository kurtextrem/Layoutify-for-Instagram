import bind from 'autobind-decorator'
import { Component, createRef, h } from 'preact'

/**
 *
 */
export default function withIntersectionObserver(WrappedComponent, options) {
	return class extends Component {
		ref = createRef()

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
		}

		@bind
		onUpdate(entries) {
			console.log(entries)

			const entry = entries[0]
			if (entry.isIntersecting) this.onVisible()
			else this.onHide()
		}

		componentDidMount() {
			this.io = new IntersectionObserver(this.onUpdate, options)
			this.io.observe(this.ref.current.base) // @FIXME I think .base is a Preact only hack to access the DOM node
		}

		shouldComponentUpdate() {
			return false
		}

		componentWillUnmount() {
			this.io.disconnect()
		}

		render() {
			// eslint-disable-next-line react/jsx-props-no-spreading
			return <WrappedComponent ref={this.ref} {...this.props} />
		}
	}
}
