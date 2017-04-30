import { h, render, Component } from 'preact' // eslint-disable-line no-unused-vars
import { CardDeck } from 'reactstrap'
import { Storage } from './utils'
import Loading from './loading'
import Post from './post'


export default class Posts extends Component {
	constructor(props, id) {
		super(props)

		this.id = id

		console.log(this.id)

		if (this.id === '')
			throw new Error('Children must have an id set')

		this.state = {
			data: null,
			loading: false
		}
		this.loading = <Loading />

		window.setTimeout(() => this.showLoading(), 200)

		this.addStorageListener()
	}

	handleData = (data) => {
		this.setState((prevState, props) => ({ data, loading: false }))
		return data
	}

	addStorageListener = () => {
		chrome.storage.onChanged.addListener((changes, area) => {
			if (changes[this.id] !== undefined && changes[this.id].newValue !== undefined) {
				console.log('new data', changes)
				this.populateData()
			}
		})
	}

	populateData = () => {
		return Storage.get(this.id, [])
			.then(this.handleData)
	}

	showLoading = () => {
		if (this.state.data === null) {
			this.setState((prevState, props) => ({ loading: true }))
		}
	}

	componentDidMount() {
		if (this.state.data === null) {
			this.populateData()
		}
	}

	/**
	 * @todo: Implement
	 *
	 *
	 * @memberOf Posts
	 */
	onScroll = () => {
		// https://developers.google.com/web/updates/2016/04/intersectionobserver
		chrome.tabs.sendMessage(document.location.search.split('=')[1], { action: 'load', which: this.id }, null, function() { })
	}

	render() {
		const { data, loading } = this.state
		if (loading)
			return this.loading
		if (data === null)
			return null
		if (data.items === undefined || data.items.length === 0) {
			return <span>No Data Available</span>
		}

		// @todo: On scroll, ask for more posts
		return (
			<CardDeck>
				{data.items.map((post) => (
					<Post data={post.media !== undefined ? post.media : post} key={post.media !== undefined ? post.media.id : post.id} />
				))}
			</CardDeck>
		)
	}
}
