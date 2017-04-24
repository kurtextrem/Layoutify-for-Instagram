import { h, render, Component } from 'preact'
import { CardDeck } from 'reactstrap'
import { fetch, get, shiftStorage } from './utils'
import Loading from './loading'
import Post from './post'


export default class Posts extends Component {
	constructor(props) {
		super(props)

		this.state = {
			data: null
		}
		this.loading = <Loading />
	}

	handleData = (data) => {
		this.setState((prevState, props) => ({ data }))
		return data
	}

	componentDidMount() {
		if (this.state.data === null) {
			if (chrome !== undefined) {
				get(this.id)
					.then(this.handleData)
					.then((data) => shiftStorage(this.id, data))
			} else {
				fetch(`../${this.id}.json`)
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
