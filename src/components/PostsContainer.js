import Loading from './Loading'
import Post from './Post'
import PostDummy from './PostDummy'
import PropTypes from 'prop-types'
import Sentinel from './Sentinel'
import bind from 'autobind-decorator'
import { CardDeck } from 'reactstrap'
import { Chrome, Storage, logAndReturn } from './Utils'
import { Component, createElement } from 'nervjs'

const Posts = (items = {}, renderPost) => items.map(renderPost) // @TODO: Implement paging system to prevent 1000+ posts getting rendered on page load

export default class PostsContainer extends Component {
	static loading = <Loading />

	static error = (
		<div>
			No data available (have you tried clicking the three dots on top of{' '}
			<a href="https://www.instagram.com" _target="blank" rel="noopener">
				Instagram.com
			</a>
			?)
		</div>
	)

	static dummy = (
		<div className="position-relative">
			<CardDeck className="justify-content-center">
				<PostDummy />
				<PostDummy />
				<PostDummy />
				<PostDummy />
			</CardDeck>
			{''}
		</div>
	)

	constructor(props) {
		super(props)

		this.initial = 0
		this.postCount = 0

		this.populateData()
		window.setTimeout(() => this.setTimeout(200), 200)
	}

	state = {
		items: null,
		nextMaxId: '',
		timeout: 0,
	}

	setTimeout(timeout) {
		if (!this.state.items) {
			this.setState((prevState, props) => ({ timeout }))
			window.setTimeout(() => this.setTimeout(1000), 1000)
		}
	}

	@bind
	storageListener(changes, area) {
		const id = this.props.id,
			change = changes[id]
		if (change !== undefined && change.newValue !== undefined) {
			console.log('new data', changes)
			this.handleData(change.newValue)
		}
	}

	@bind
	populateData() {
		return Storage.get(this.props.id, null)
			.then(this.handleData)
			.catch(logAndReturn)
	}

	@bind
	handleData(data) {
		++this.initial
		if (data !== null) this.setState((prevState, props) => ({ items: data.items, nextMaxId: data.nextMaxId, timeout: 400 }))
		return data
	}

	@bind
	handleScroll() {
		Chrome.send('load', { which: this.props.id })
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
		++this.postCount
		const { id, defaultClass, toggleClass } = this.props
		return (
			<Post
				key={post.id}
				data={post}
				parent={id}
				defaultClass={defaultClass}
				toggleClass={toggleClass}
				initial={this.initial === 1 && this.postCount < 12}
			/>
		)
	}

	// @TODO: Implement https://github.com/valdrinkoshi/virtual-list
	render() {
		const { items, timeout } = this.state

		if (items)
			return (
				<div className="position-relative">
					<CardDeck className="justify-content-center">{Posts(items, this.renderPost)}</CardDeck>
					<Sentinel onVisible={this.handleScroll} />
				</div>
			)

		if (timeout === 200) return PostsContainer.loading
		if (timeout === 1000 && (!items || items.length === 0)) return PostsContainer.error
		return PostsContainer.dummy // first paint & items === null
	}
}

PostsContainer.propTypes = {
	id: PropTypes.string.isRequired,
	defaultClass: PropTypes.string.isRequired,
	toggleClass: PropTypes.string.isRequired,
}
