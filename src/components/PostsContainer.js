import Loading from './Loading'
import Post from './Post'
import PostDummy from './PostDummy'
import Posts from './Posts'
import PropTypes from 'prop-types'
import Sentinel from './Sentinel'
import bind from 'autobind-decorator'
import { CardDeck } from 'reactstrap'
import { Chrome, Storage, logAndReturn } from './Utils'
import { Component, h } from 'preact'

const TIME_STATE = {
	LOADING: 900,
	ERROR: 2000,
}

export default class PostsContainer extends Component {
	static loading = (<Loading />)

	static error = (
		<div>
			No data available (have you tried clicking the three dots on top of{' '}
			<a href="https://www.instagram.com" _target="blank" rel="noopener">
				Instagram.com
			</a>
			)? Please leave the Instagram tab open.
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

	constructor(properties) {
		super(properties)

		this.initial = 0
		this.postCount = 0
		this.preloadCounter = 0

		this.populateData()
			.then(data => {
				if (properties.preload > 0) this.preload()
				return data
			})
			.catch(logAndReturn)

		window.setTimeout(
			() => this.setTimeout(TIME_STATE.LOADING),
			TIME_STATE.LOADING
		)
	}

	state = {
		items: null,
		timeout: 0,
	}

	setTimeout(timeout) {
		this.setState((previousState, properties) => ({ timeout }))
		if (timeout !== TIME_STATE.ERROR)
			window.setTimeout(
				() => this.setTimeout(TIME_STATE.ERROR),
				TIME_STATE.ERROR
			)
	}

	@bind
	preload() {
		const { preload, id } = this.props
		if (
			++this.preloadCounter > preload ||
			this.postCount / 20 /* 20 posts per page */ > 2 * preload
		)
			return

		console.log('preloading')
		Chrome.send('load', { which: id })
		window.setTimeout(this.preload, this.preloadCounter * 1000)
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

	populateData() {
		console.log('populating data')

		return Storage.get(this.props.id, null)
			.then(this.handleData)
			.catch(logAndReturn)
	}

	@bind
	handleData(data) {
		++this.initial
		if (data !== null)
			this.setState((previousState, properties) => ({
				items: data.items,
				//nextMaxId: data.nextMaxId,
				timeout: previousState.timeout,
			}))

		return data
	}

	loadData() {
		Chrome.send('load', { which: this.props.id })
	}

	@bind
	handleScroll() {
		this.loadData()
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

	shouldComponentUpdate(nextProperties, nextState) {
		const { timeout, items } = this.state
		const nextItems = nextState.items
		/*console.log(
			nextProps.id !== this.props.id,
			nextState.timeout !== timeout,
			items === null && nextState.items !== null,
			nextState.items,
			items
		)*/

		return (
			nextProperties.id !== this.props.id ||
			(nextState.timeout !== timeout &&
				(nextItems === null || nextItems.length === 0)) ||
			(items === null && nextItems !== null) || // first items
			(items !== null &&
				nextItems !== null &&
				nextItems.length !== items.length)
		)
	}

	componentWillUnmount() {
		this.removeStorageListener()
	}

	@bind
	renderPost(post) {
		if (!post || !post.id) return console.warn('faulty post', post)

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
		const { hasCategories } = this.props
		const { items, timeout } = this.state

		if (items !== null && items.length !== 0)
			return (
				<div className="position-relative">
					<CardDeck className="justify-content-center">
						{Posts(items, this.renderPost, hasCategories)}
					</CardDeck>
					<Sentinel onVisible={this.handleScroll} />
				</div>
			)

		if (timeout === TIME_STATE.LOADING) return PostsContainer.loading
		if (timeout === TIME_STATE.ERROR) return PostsContainer.error

		return PostsContainer.dummy // first paint & items === null
	}
}

PostsContainer.propTypes = {
	id: PropTypes.string.isRequired,
	defaultClass: PropTypes.string.isRequired,
	toggleClass: PropTypes.string.isRequired,
	hasCategories: PropTypes.bool.isRequired,
	preload: PropTypes.bool.isRequired,
}
