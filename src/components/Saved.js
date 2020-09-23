import PostsContainer from './PostsContainer'
import bind from 'autobind-decorator'
import { Component, h } from 'preact'
import { fetchFromBackground } from './Utils'

export default class Saved extends Component {
	state = { collections: [] }

	async componentDidMount() {
		// @TODO Implement more_available
		// @TODO Prio: Add caching for like 10min? --> localStorage?
		//fetchFromBackground('private_web', 'collections/list/').then(this.setCollections)
		const req = await fetch('../collectionList.json')
		const json = await req.json()
		this.setCollections(json)
	}

	@bind
	setCollections(collections) {
		this.setState({ collections: collections.items })
	}

	shouldComponentUpdate(nextProps, nextState) {
		const id = this.props.id
		if (nextState.collections.length !== this.state.collections.length) return true
		if (id === nextProps.id) return false
		return (nextProps.id === undefined && id !== undefined) || (nextProps.id !== undefined && id === undefined) || nextProps.id() !== id()
	}

	render() {
		const id = this.props.id
		if (id === undefined)
			return (
				<div class="d-flex w-100 justify-content-center flex-wrap">
					{this.state.collections.map(item => (
						<a key={item.collection_id} href={`#/collection/${item.collection_id}`} class="collection">
							<div class="collection--image">
								<img src={item.cover_media?.image_versions2?.candidates?.[0].url} />
							</div>
							<div class="collection--title">{item.collection_name}</div>
							<div class="collection--footer">{item.collection_media_count}</div>
						</a>
					))}
					<i class="w-100 text-center">(middle- or right-click to open a collection in a new tab)</i>
					<PostsContainer id="saved" defaultClass="turned_in" toggleClass="turned_in_not" preload={0} />
				</div>
			)

		return <PostsContainer id={'collection/' + id()} defaultClass="turned_in" toggleClass="turned_in_not" preload={5} />
	}
}
