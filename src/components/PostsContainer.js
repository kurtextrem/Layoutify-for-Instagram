import Loading from './Loading'
import Post from './Post'
import PostDummy from './PostDummy'
import PropTypes from 'prop-types'
import Sentinel from './Sentinel'
import bind from 'autobind-decorator'
import { CardDeck } from 'reactstrap'
import { Chrome, Storage } from './Utils'
import { Component, createElement } from 'nervjs'

let initiated = false,
	loading,
	error

const Posts = (items, renderPost) => items.map(renderPost) // @TODO: Implement paging system to prevent 1000+ posts getting rendered on page load

/* @TODO: Convert to static props, to free memory when unmounted  */
function init() {
	if (initiated) return

	initiated = true
	loading = <Loading />
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

		this.initial = 0
		init()

		this.populateData()
		window.setTimeout(() => this.setTimeout(200), 200)
	}

	state = {
		items: null,
		nextMaxId: '',
		timeout: 0,
	}

	setTimeout(timeout) {
		if (this.state.items === null) {
			this.setState((prevState, props) => ({ timeout }))
			window.setTimeout(() => this.setTimeout(400), 400)
		}
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
	populateData() {
		return Storage.get(this.props.id, [])
			.then(this.handleData)
			.catch(console.error)
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

	addStorageListener() {
		chrome.storage.onChanged.addListener(this.storageListener)
	}

	removeStorageListener() {
		chrome.storage.onChanged.removeListener(this.storageListener)
	}

	componentDidMount() {
		this.addStorageListener()
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

	componentWillUnmount() {
		this.removeStorageListener()
	}

	@bind
	renderPost(post) {
		const { id, defaultClass, toggleClass } = this.props
		return <Post key={post.id} data={post} parent={id} defaultClass={defaultClass} toggleClass={toggleClass} initial={this.initial < 2} />
	}

	render() {
		const { items, timeout } = this.state

		if (items !== null)
			return (
				<div className="position-relative">
					<CardDeck className="justify-content-center">{Posts(items, this.renderPost)}</CardDeck>
					<Sentinel onVisible={this.handleScroll} />
				</div>
			)

		if (timeout === 200) return loading
		if (timeout === 400 && (!items || items.length === 0)) return error
		return (
			<div className="position-relative">
				<CardDeck className="justify-content-center">
					<PostDummy />
					<PostDummy />
					<PostDummy />
					<PostDummy />
				</CardDeck>
				{''}
			</div>
		) // first paint & items === null
	}
}

PostsContainer.propTypes = {
	id: PropTypes.string.isRequired,
	defaultClass: PropTypes.string.isRequired,
	toggleClass: PropTypes.string.isRequired,
}
