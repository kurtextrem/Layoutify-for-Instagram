import { CardDeck } from 'reactstrap'
import { Chrome, Storage } from './Utils'
import { Component, h } from 'preact' // eslint-disable-line no-unused-vars

import Loading from './Loading'
import Post from './Post'
import Sentinel from './Sentinel'

const loading = <Loading />
const Posts = (posts, renderPost) => posts.map(post => renderPost(post))

export default class PostsContainer extends Component {
	constructor(props) {
		super(props)

		if (props.id === '') throw new Error('Children must have an id set')

		this.state = {
			data: null,
			timeout: 0,
		}
		this.error = <div>No data available (have you tried clicking the three dots on top of Instagram.com?)</div>

		window.setTimeout(() => this.setTimeout(200), 200)
	}

	addStorageListener = () => {
		chrome.storage.onChanged.addListener(this.storageListener)
	}

	storageListener = (changes, area) => {
		const id = this.props.id
		if (changes[id] !== undefined && changes[id].newValue !== undefined) {
			console.log('new data', changes)
			this.populateData()
		}
	}

	removeStorageListener = () => {
		chrome.storage.onChanged.removeListener(this.storageListener)
	}

	populateData = () => {
		return Storage.get(this.props.id, []).then(this.handleData)
	}

	handleData = data => {
		this.setState((prevState, props) => ({ data, timeout: 400 }))
		return data
	}

	setTimeout = timeout => {
		if (this.state.data === null) {
			this.setState((prevState, props) => ({ timeout }))
			window.setTimeout(() => this.setTimeout(400), 400)
		}
	}

	handleScroll = () => {
		Chrome.send('load', { which: this.props.id })
	}

	renderPost = post => {
		const { id, defaultClass, toggleClass } = this.props
		return <Post key={post.id} data={post} parent={id} defaultClass={defaultClass} toggleClass={toggleClass} />
	}

	componentDidMount() {
		this.addStorageListener()

		if (this.state.data === null) {
			this.populateData()
		}
	}

	componentWillUnmount() {
		this.removeStorageListener()
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { timeout, data } = this.state
		console.log(nextProps.id !== this.props.id, timeout !== nextState.timeout, data !== null && nextState.data.length !== data.length, nextState, data)
		return nextProps.id !== this.props.id || timeout !== nextState.timeout || (data === null && nextState.data !== null) || nextState.data.length !== data.length
	}

	render(props, state) {
		const { data, timeout } = state

		if (timeout === 200) return loading
		if (data === null) return null
		if (timeout === 400 && (data.items === undefined || data.items.length === 0)) {
			return this.error
		}

		return (
			<CardDeck>
				{Posts(data.items, this.renderPost) // https://github.com/developit/preact/issues/45
				}
				<Sentinel onVisible={this.handleScroll} />
			</CardDeck>
		)
	}
}
