/**
 * Created by AntonioGiordano, partially rewritten by Jacob "Kurtextrem" Groß on 06/07/16.
 */

import EventComponent from './EventComponent'
import PropTypes from 'prop-types'
import { h, toChildArray } from 'preact'

export class HashRouter extends EventComponent {
	static defaultProps = {
		onLocationChanged: (childKey, params, cb) => cb(),
	}

	constructor(props) {
		super(props)

		this.childKey = null
		this.currentParams = null

		this.locations = []
		this.scores = []
		this.children = []
		this.params = []
		this.calcChildren(props)
		this.state = {
			render: this.getMatchedPage(),
		}
	}

	getMatchedPage() {
		const hash = window.location !== undefined ? window.location.hash : '#/'

		const locArray = hash.split('/')
		let locArrayLen = locArray.length
		if (locArrayLen !== 0 && locArray[0] === '#') {
			locArray.shift()
			--locArrayLen
		}

		const locations = this.locations.slice(0)
		const scores = this.scores.slice(0)
		const children = this.children.slice(0)
		const params = this.params.slice(0)
		const parentLocation = locArray[0]

		let i
		for (i = 0; i < locations.length; ++i) {
			const location = locations[i]
			if (location.indexOf(parentLocation) === -1) {
				// Remove elements that don't fit our location
				locations.splice(i, 1)
				scores.splice(i, 1)
				children.splice(i, 1)
				params.splice(i, 1)
				i--
			}
		}

		/* multi-routes? https://github.com/antoniogiordano/react-redux-hash-router/commit/ddc81448e13ab1a0c846fdea932404321bf1690c#diff-25d902c24283ab8cfbac54dfa101ad31
		const regexParam = /^{(.*)}$/
		for (const l in locArray) {
			for (i = 0; i < locations.length; ++i) {
				const location = locations[i][l]
				if (locArray[l] === location) {
					scores[i] += 100
				} else if (location.match(regexParam)) {
					scores[i] += 1
					params[i][location.match(regexParam, '$1')[1]] = locArray[l]
				} else {
					// Remove elements that don't fit our location
					locations.splice(i, 1)
					scores.splice(i, 1)
					children.splice(i, 1)
					params.splice(i, 1)
					i--
				}
			}
		}*/

		if (locations.length !== 0) {
			let max = 0
			let maxId = 0
			for (i = 0; i < scores.length; ++i) {
				if (scores[i] > max) {
					max = scores[i]
					maxId = i
				}
			}

			this.childKey = children[maxId].key
			this.currentParams = params[maxId]

			return children[maxId]
		}
		return null
	}

	clearArrays() {
		this.locations.length = 0
		this.scores.length = 0
		this.children.length = 0
		this.params.length = 0
	}

	calcChildren(props) {
		toChildArray(props.children).forEach(child => {
			const childArray = child.props.hash.split('/')
			if (childArray.length !== 0) childArray.shift()

			this.locations.push(childArray)
			this.scores.push(0)
			this.children.push(child)
			this.params.push({})
		})
	}

	hashchange() {
		const render = this.getMatchedPage()
		if (render === null) return

		this.props.onLocationChanged(this.childKey, this.currentParams, () => {
			this.setState({ render })
		})
	}

	componentDidMount() {
		window.addEventListener('hashchange', this)
	}

	// static getDerivedStateFromProps(nextProps, prevState)
	componentWillReceiveProps(nextProps) {
		this.clearArrays()
		this.calcChildren(nextProps)
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (nextState.render !== this.state.render) return true
		if (nextProps.onLocationChanged !== this.props.onLocationChanged) return true
		return false
	}

	componentWillUnmount() {
		this.locations = null
		this.scores = null
		this.children = null
		this.params = null
		this.childKey = null
		this.currentParams = null
		window.removeEventListener('hashchange', this)
	}

	render() {
		return this.state.render
	}
}

HashRouter.propTypes = {
	onLocationChanged: PropTypes.func,
}

export const Route = props => props.children

Route.propTypes = {
	hash: PropTypes.string.isRequired,
}
