import { CardDeck } from 'reactstrap'
import { Chrome, Storage } from './Utils'
import { Component, h, render } from 'preact' // eslint-disable-line no-unused-vars

import { DelegateContainer, DelegateElement } from 'preact-delegate'
import Loading from './Loading'
import Post from './Post'
import Posts from './Posts'
import Sentinel from './Sentinel'

export default class PostsContainer extends Component {
	constructor(props, ...rest) {
		super(props)

		const [id, defaultClass, toggleClass] = rest

		this.id = id
		this.toggleClass = toggleClass
		this.defaultClass = defaultClass

		if (this.id === '')
			throw new Error('Children must have an id set')

		this.state = {
			data: null,
			timeout: 0
		}
		this.loading = <Loading />
		this.error = <div>No Data Available (have you tried clicking the three dots on top of Instagram.com?)</div>

		window.setTimeout(() => this.setTimeout(200), 200)

		this.addStorageListener()
	}

	addStorageListener = () => {
		chrome.storage.onChanged.addListener(this.storageListener)
	}

	storageListener = (changes, area) => {
		if (changes[this.id] !== undefined && changes[this.id].newValue !== undefined) {
			console.log('new data', changes)
			this.populateData()
		}
	}

	removeStorageListener = () => {
		chrome.storage.onChanged.removeListener(this.storageListener)
	}

	populateData = () => {
		return Storage.get(this.id, [])
			.then(this.handleData)
	}

	handleData = data => {
		this.setState((prevState, props) => ({ data, timeout: 400 }))
		return data
	}

	setTimeout = timeout => {
		if (this.state.data === null) {
			this.setState((prevState, props) => ({ timeout }))
			window.setTimeout(() => this.setTimeout(400), 200)
		}
	}

	handleScroll = () => {
		Chrome.send('load', { which: this.id })
	}

	onClick = e => {
		e.stopPropagation()

		var elem = e.target
		if (elem.classList.contains('action--btn')) {
			if (elem.classList.contains('active')) { // @todo: Modify our data
				Chrome.send('remove', { which: this.id, id: elem.dataset.id })
				elem.classList.remove('active')
				elem.classList.add('inactive')
				elem.textContent = this.toggleClass
			} else {
				Chrome.send('add', { which: this.id, id: elem.dataset.id })
				elem.classList.remove('inactive')
				elem.classList.add('active')
				elem.textContent = this.defaultClass
			}
		}

		if (elem.classList.contains('carousel--btn')) { // @todo: Emit event that the carousel should slide (using a re-render)

		}

		return true
	}

	renderPost = post => {
		return (
			<DelegateElement key={post.id} click={this.onClick}>
				<Post key={post.id} data={post} parent={this.id} data-defaultClass={this.defaultClass} data-toggleClass={this.toggleClass} />
			</DelegateElement>
		)
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
		const { data, timeout } = this.state
		if (timeout === 200)
			return this.loading
		if (data === null)
			return null
		if (timeout === 400 && (data.items === undefined || data.items.length === 0)) {
			return this.error
		}

		return (
			<DelegateContainer>
				<CardDeck>
					{
						Posts(data.items, this.renderPost) // https://github.com/developit/preact/issues/45
					}
					<Sentinel onVisible={this.handleScroll} />
				</CardDeck>
			</DelegateContainer>
		)
	}
}
