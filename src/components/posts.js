import { h, render, Component } from 'preact'
import { CardDeck } from 'reactstrap'
import { XHR, Storage } from './utils'
import Loading from './loading'
import Post from './post'


export default class Posts extends Component {
	constructor(props) {
		super(props)

		if (this.id === '')
			throw new Error('Children must have an id set')

		this.state = {
			data: null
		}
		this.loading = <Loading />
	}

	handleData = (data) => {
		this.setState((prevState, props) => ({ data }))
		return data
	}

	addStorageListener = () => {
		chrome.storage.onChanged.addListener((changes, area) => {
			if (changes[this.id] !== undefined) {
				this.populateData()
			}
		})
	}

	populateData = () => {
		return Storage.get(this.id)
			.then(this.handleData)
			.then((data) => Storage.shiftData(this.id, data))
	}

	componentDidMount() {
		if (this.state.data === null) {
			if (chrome.storage !== undefined) {
				this.populateData()
				this.addStorageListener()
			} else {
				XHR.fetch(`../test/${this.id}.json`)
					.then(this.handleData)
			}
		}
	}

	render() {
		const { data } = this.state
		if (data === null)
			return this.loading

		return (
			<CardDeck>
				{data.map((post) => (
					<Post data={post} />
				))}
			</CardDeck>
		)
	}
}
