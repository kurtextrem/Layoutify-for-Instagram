/**
 * Created by AntonioGiordano, partially rewritten by Jacob "Kurtextrem" Groß on 06/07/16.
 */

import PropTypes from 'prop-types'
import bind from 'autobind-decorator'
import { Children, Component, createElement } from 'nervjs'

export class HashRouter extends Component {
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

	@bind
	getMatchedPage() {
		const hash = window.location !== undefined ? window.location.hash : '#/'

		const locArray = hash.split('/'),
			locArrayLen = locArray.length
		if (locArrayLen !== 0 && locArray[0] === '#') locArray.shift()

		const locations = this.locations.slice(0)
		const scores = this.scores.slice(0)
		const children = this.children.slice(0)
		const params = this.params.slice(0)

		let i
		for (i = 0; i < locations.length; ++i) {
			if (locations[i].length !== locArrayLen) {
				locations.splice(i, 1)
				scores.splice(i, 1)
				children.splice(i, 1)
				params.splice(i, 1)
				i--
			}
		}

		const regexParam = /^{(.*)}$/
		for (const l in locArray) {
			for (i = 0; i < locations.length; ++i) {
				const location = locations[i][l]
				if (locArray[l] === location) {
					scores[i] += 100
				} else if (location.match(regexParam, '$1') !== null) {
					scores[i] += 1
					params[i][location.match(regexParam, '$1')[1]] = locArray[l]
				} else {
					locations.splice(i, 1)
					scores.splice(i, 1)
					children.splice(i, 1)
					params.splice(i, 1)
					i--
				}
			}
		}

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

	@bind
	clearArrays() {
		this.locations.length = 0
		this.scores.length = 0
		this.children.length = 0
		this.params.length = 0
	}

	@bind
	calcChildren(props) {
		Children.forEach(props.children, child => {
			const childArray = child.props.hash.split('/')
			if (childArray.length !== 0) childArray.shift()

			this.locations.push(childArray)
			this.scores.push(0)
			this.children.push(child)
			this.params.push({})
		})
	}

	@bind
	onHashChange() {
		const render = this.getMatchedPage()
		if (render === null) return

		this.props.onLocationChanged(this.childKey, this.currentParams, () => {
			this.setState((prevState, props) => ({ render }))
		})
	}

	componentDidMount() {
		this.onHashChange()
		window.addEventListener('hashchange', this.onHashChange)
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
		window.removeEventListener('hashchange', this.onHashChange)
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
	key: PropTypes.string.isRequired,
	hash: PropTypes.string.isRequired,
}
