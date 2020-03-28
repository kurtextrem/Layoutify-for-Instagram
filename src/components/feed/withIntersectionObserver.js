import bind from 'autobind-decorator'
import { Component, h } from 'preact'

/**
 *
 */
export default function withIntersectionObserver(WrappedComponent, options) {
	return class extends Component {
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
			this.ref = ref.base // @FIXME this is a preact only hack
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
			this.io.observe(this.ref)
		}

		shouldComponentUpdate() {
			return false
		}

		componentWillUnmount() {
			this.io.disconnect()
		}

		render() {
			// eslint-disable-next-line react/jsx-props-no-spreading
			return <WrappedComponent ref={this.setRef} {...this.props} />
		}
	}
}
