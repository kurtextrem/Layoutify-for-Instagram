import Loading from './Loading'
import Post from './Post'
import PropTypes from 'prop-types'
import Sentinel from './Sentinel'
import bind from 'autobind-decorator'
import { CardDeck } from 'reactstrap'
import { Chrome, Storage } from './Utils'
import { Component, createElement } from 'nervjs'

let initiated = false,
	loading,
	Posts,
	error

/* @TODO: Convert to static props, to free memory when unmounted  */
function init() {
	if (initiated) return

	initiated = true
	loading = <Loading />
	Posts = (items, renderPost) => items.map(renderPost) // @TODO: Implement paging system to prevent 1000+ posts getting rendered on page load
	error = (
		<div>
			No data available (have you tried clicking the three dots on top of{' '}
			<a href="https://www.instagram.com" _target="blank" rel="noopener">
				Instagram.com
			</a>?)
		</div>
	)
}

export default class PostsContainer extends Component {
	constructor(props) {
		super(props)

		this.state = {
			items: null,
			nextMaxId: '',
			timeout: 0,
		}
		this.initial = 0
		init()

		this.populateData()
		window.setTimeout(() => this.setTimeout(200), 200)
	}

	@bind
	handleScroll() {
		Chrome.send('load', { which: this.props.id })
	}

	@bind
	handleData(data) {
		++this.initial
		this.setState((prevState, props) => ({ items: data.items, nextMaxId: data.nextMaxId, timeout: 400 }))
		return data
	}

	@bind
	async populateData() {
		return this.handleData(await Storage.get(this.props.id, []))
	}

	@bind
	storageListener(changes, area) {
		const id = this.props.id
		if (changes[id] !== undefined && changes[id].newValue !== undefined) {
			console.log('new data', changes)
			this.populateData()
		}
	}

	@bind
	renderPost(post) {
		const { id, defaultClass, toggleClass } = this.props
		return <Post key={post.id} data={post} parent={id} defaultClass={defaultClass} toggleClass={toggleClass} initial={this.initial < 2} />
	}

	setTimeout(timeout) {
		if (this.state.items === null) {
			this.setState((prevState, props) => ({ timeout }))
			window.setTimeout(() => this.setTimeout(400), 400)
		}
	}

	addStorageListener() {
		chrome.storage.onChanged.addListener(this.storageListener)
	}

	removeStorageListener() {
		chrome.storage.onChanged.removeListener(this.storageListener)
	}

	componentDidMount() {
		this.addStorageListener()
	}

	componentWillUnmount() {
		this.removeStorageListener()
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { timeout, items } = this.state
		/*console.log(
			nextProps.id !== this.props.id,
			nextState.timeout !== timeout,
			items === null && nextState.items !== null,
			nextState.items,
			items
		)*/

		return (
			nextProps.id !== this.props.id ||
			nextState.timeout !== timeout ||
			(items === null && nextState.items !== null) || // first items
			(items && nextState.items && nextState.items.length !== items.length)
		)
	}

	render() {
		const { items, timeout } = this.state

		if (items !== null)
			return (
				<CardDeck className="justify-content-center">
					{Posts(items, this.renderPost)}
					<Sentinel onVisible={this.handleScroll} />
				</CardDeck>
			)

		if (timeout === 200) return loading
		if (timeout === 400 && (!items || items.length === 0)) return error
		return null // first paint & items === null
	}
}

PostsContainer.propTypes = {
	id: PropTypes.string.isRequired,
}
