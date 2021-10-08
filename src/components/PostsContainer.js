import Loading from './Loading'
import Post from './Post'
import PostDummy from './PostDummy'
import Posts from './Posts'
import PropTypes from 'prop-types'
import bind from 'autobind-decorator'
import { Button } from 'reactstrap'
import { Component, h } from 'preact'
import { Instagram } from './InstagramAPI'
import { Storage, iObs, logAndReturn, rObs, shallowDiffers } from './Utils'

export default class PostsContainer extends Component {
	static TIME_STATE = {
		ERROR: 2_000,
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
			<div class="d-flex position-relative justify-content-center flex-wrap">
				<PostDummy />
				<PostDummy />
				<PostDummy />
				<PostDummy />
			</div>
		</div>
	)

	preloadCounter = 0

	ref = null

	state = {
		canLoadMore: true,
		items: null,
		timeout: 0,
	}

	constructor(props) {
		super(props)

		//this.iObs = iObs()
		//this.rObs = rObs()
	}

	setTimeout(timeout) {
		this.setState({ timeout })
		if (timeout !== PostsContainer.TIME_STATE.ERROR)
			window.setTimeout(() => this.setTimeout(PostsContainer.TIME_STATE.ERROR), PostsContainer.TIME_STATE.ERROR)
	}

	@bind
	setRef(ref) {
		this.ref = ref
	}

	@bind
	preload() {
		const { preload, id } = this.props
		if (++this.preloadCounter > preload || (this.state.items && this.state.items.length / 21 >= preload)) return // 21 posts per page

		console.log('preloading', id)
		this.loadData()
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
		console.log('populating data')

		return Storage.get(this.props.id, null).then(this.handleData).catch(logAndReturn)
	}

	@bind
	handleData(data) {
		if (!data) return data

		this.setState(
			(prevState, props) => ({
				canLoadMore: data.nextMaxId !== '',
				items: data.items,
				timeout: prevState.timeout,
			}),
			() => {
				window.setTimeout(this.preload, this.preloadCounter * 1_000)
			}
		)
		return data
	}

	loadData() {
		Instagram.fetch(this.props.id)
	}

	@bind
	handleBtnClick(event) {
		this.setState({ canLoadMore: false })
		this.preloadCounter -= 2 // so we load another page
		this.loadData()

		window.setTimeout(() => {
			this.setState({ canLoadMore: true })
		}, 5_000) // let user retry if nothing has happened after 5 sec
	}

	addStorageListener() {
		chrome.storage.onChanged.addListener(this.storageListener)
	}

	removeStorageListener() {
		chrome.storage.onChanged.removeListener(this.storageListener)
	}

	componentDidMount() {
		this.addStorageListener()

		// load old data
		this.populateData()
		// load new data
		this.loadData()

		window.setTimeout(() => this.setTimeout(PostsContainer.TIME_STATE.LOADING), PostsContainer.TIME_STATE.LOADING)
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return shallowDiffers(this.state, nextState) || shallowDiffers(this.props, nextProperties)
	}

	componentDidUpdate() {
		/*if (this.ref) {
			this.ref.children.forEach(el => {
				if (el.isObserved) return

				el.isObserved = true
				//this.iObs.observe(el)
				//this.rObs.observe(el)
			})
		}*/
	}

	componentWillUnmount() {
		this.removeStorageListener()
		//this.iObs.disconnect()
		//this.rObs.disconnect()
	}

	@bind
	renderPost(post) {
		if (!post || !post.id) return console.warn('faulty post', post)

		const { id, defaultClass, toggleClass } = this.props

		return (
			<Post
				key={post.id}
				data={post}
				parent={id}
				defaultClass={defaultClass}
				toggleClass={toggleClass}
				isCarousel={post.media_type === 8}
			/>
		)
	}

	render() {
		const { items, timeout, canLoadMore } = this.state

		if (items !== null && items.length !== 0)
			return (
				<div class="position-relative">
					<div class="ige_virtual_container" ref={this.setRef}>
						{Posts(items, this.renderPost)}
					</div>
					<div class="text-center">
						<Button onClick={this.handleBtnClick} disabled={!canLoadMore}>
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
	id: PropTypes.string.isRequired,
	preload: PropTypes.number.isRequired,
	toggleClass: PropTypes.string.isRequired,
}
