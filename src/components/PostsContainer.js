import Loading from './Loading'
import Post from './Post'
import Sentinel from './Sentinel'
import { CardDeck } from 'reactstrap'
import { Chrome, Storage } from './Utils'
import { Component, h } from 'preact'

const loading = <Loading />
const Posts = (items, renderPost) => items.map(renderPost) // @TODO: Implement paging system to prevent 1000+ posts getting rendered on page load

export default class PostsContainer extends Component {
	constructor(props) {
		super(props)

		if (!props.id) throw new Error('Children must have an id set')

		this.state = {
			items: null,
			nextMaxId: '',
			timeout: 0,
		}
		this.error = (
			<div>
				No data available (have you tried clicking the three dots on top of{' '}
				<a href="https://www.instagram.com" _target="blank" rel="noopener">
					Instagram.com
				</a>?)
			</div>
		)

		window.setTimeout(() => this.setTimeout(200), 200)
	}

	handleScroll = () => {
		Chrome.send('load', { which: this.props.id })
	}

	handleData = data => {
		this.setState((prevState, props) => ({ items: data.items, nextMaxId: data.nextMaxId, timeout: 400 }))
		return data
	}

	populateData = () => {
		return Storage.get(this.props.id, []).then(this.handleData)
	}

	storageListener = (changes, area) => {
		const id = this.props.id
		if (changes[id] !== undefined && changes[id].newValue !== undefined) {
			console.log('new data', changes)
			this.populateData()
		}
	}

	renderPost = post => {
		const { id, defaultClass, toggleClass } = this.props
		return <Post key={post.id} data={post} parent={id} defaultClass={defaultClass} toggleClass={toggleClass} />
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

		if (this.state.items === null) {
			this.populateData()
		}
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
			(items !== null && nextState.items !== null && nextState.items.length !== items.length)
		)
	}

	render(props, state) {
		const { items, timeout } = state

		if (timeout === 200) return loading
		if (timeout === 400 && (!items || items.length === 0)) {
			return this.error
		}
		if (items === null) return null // first paint

		return (
			<CardDeck className="justify-content-center">
				{Posts(items, this.renderPost) // https://github.com/developit/preact/issues/45
				}
				<Sentinel onVisible={this.handleScroll} />
			</CardDeck>
		)
	}
}
