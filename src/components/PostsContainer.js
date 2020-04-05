import Loading from './Loading'
import Post from './Post'
import PostDummy from './PostDummy'
import Posts from './Posts'
import PropTypes from 'prop-types'
import bind from 'autobind-decorator'
import { Button, CardDeck } from 'reactstrap'
import { Chrome, Storage, logAndReturn } from './Utils'
import { Component, h } from 'preact'

export default class PostsContainer extends Component {
	static TIME_STATE = {
		ERROR: 2000,
		LOADING: 900,
	}

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
		<div class="position-relative">
			<CardDeck class="justify-content-center">
				<PostDummy />
				<PostDummy />
				<PostDummy />
				<PostDummy />
			</CardDeck>
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

		window.setTimeout(() => this.setTimeout(PostsContainer.TIME_STATE.LOADING), PostsContainer.TIME_STATE.LOADING)
	}

	state = {
		items: null,
		timeout: 0,
	}

	setTimeout(timeout) {
		this.setState((previousState, properties) => ({ timeout }))
		if (timeout !== PostsContainer.TIME_STATE.ERROR)
			window.setTimeout(() => this.setTimeout(PostsContainer.TIME_STATE.ERROR), PostsContainer.TIME_STATE.ERROR)
	}

	@bind
	preload() {
		const { preload, id } = this.props
		if (++this.preloadCounter > preload || this.postCount / 20 /* 20 posts per page */ > 2 * preload) return

		console.log('preloading', id)
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

		return Storage.get(this.props.id, null).then(this.handleData).catch(logAndReturn)
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
	handleBtnClick(event) {
		event.target.disabled = true
		this.loadData()

		window.setTimeout(() => {
			event.target.disabled = false
		}, 15000) // let user retry if nothing has happened after 15 sec
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
			(nextState.timeout !== timeout && (nextItems === null || nextItems.length === 0)) ||
			(items === null && nextItems !== null) || // first items
			(items !== null && nextItems !== null && nextItems.length !== items.length)
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
				isCarousel={post.media_type === 8}
			/>
		)
	}

	render() {
		const { hasCategories } = this.props
		const { items, timeout } = this.state

		if (items !== null && items.length !== 0)
			return (
				<div class="position-relative">
					<CardDeck class="justify-content-center">{Posts(items, this.renderPost, hasCategories)}</CardDeck>
					<div class="text-center">
						<Button onClick={this.handleBtnClick} disabled={false}>
							Load more
						</Button>
					</div>
				</div>
			)

		if (timeout === PostsContainer.TIME_STATE.LOADING) return PostsContainer.loading
		if (timeout === PostsContainer.TIME_STATE.ERROR) return PostsContainer.error

		return PostsContainer.dummy // first paint & items === null
	}
}

PostsContainer.propTypes = {
	defaultClass: PropTypes.string.isRequired,
	hasCategories: PropTypes.bool.isRequired,
	id: PropTypes.string.isRequired,
	preload: PropTypes.number.isRequired,
	toggleClass: PropTypes.string.isRequired,
}
