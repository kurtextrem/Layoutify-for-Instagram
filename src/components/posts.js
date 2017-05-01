import { h, render, Component } from 'preact' // eslint-disable-line no-unused-vars
import { CardDeck } from 'reactstrap'
import { Storage } from './utils'
import Loading from './loading'
import Post from './post'
import Sentinel from './sentinel'


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

	storageListener = (changes, area) => {
		if (changes[this.id] !== undefined && changes[this.id].newValue !== undefined) {
			console.log('new data', changes)
			this.populateData()
		}
	}

	addStorageListener = () => {
		chrome.storage.onChanged.addListener(this.storageListener)
	}

	removeStorageListener = () => {
		chrome.storage.onChanged.removeListener(this.storageListener)
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

	onScroll = () => {
		chrome.tabs.sendMessage(Number(document.location.search.split('=')[1]), { action: 'load', which: this.id }, null, function() {})
	}

	componentDidMount() {
		if (this.state.data === null) {
			this.populateData()
		}
	}

	componentWillUnmount() {
		this.removeStorageListener()
	}

	render() {
		const { data, loading } = this.state
		if (loading)
			return this.loading
		if (data === null)
			return null
		if (data.items === undefined || data.items.length === 0) {
			return <div>No Data Available (have you tried clicking the three dots on top of Instagram.com?)</div>
		}

		return (
			<CardDeck>
				{data.items.map((post) => (
					<Post data={post} key={post.id} />
				))}
				<Sentinel onVisible={this.onScroll} />
			</CardDeck>
		)
	}
}
