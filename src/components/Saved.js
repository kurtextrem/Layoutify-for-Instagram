import PostsContainer from './PostsContainer'
import bind from 'autobind-decorator'
import { Component, Fragment, h } from 'preact'
import { fetchFromBackground } from './Utils'

export default class Saved extends Component {
	state = { collections: [] }

	async componentDidMount() {
		// @TODO Implement more_available
		// @TODO Prio: Add caching for like 10min?
		//fetchFromBackground('private_web', 'collections/list/').then(this.setCollections)
		const req = await fetch('../collectionList.json')
		const json = await req.json()
		this.setCollections(json)
	}

	@bind
	setCollections(collections) {
		console.log(collections)
		this.setState((prevState, props) => ({ collections: collections.items }))
	}

	render() {
		const id = this.props.id
		if (!id)
			return (
				<div class="d-flex w-100 justify-content-center flex-wrap">
					{this.state.collections.map(item => (
						<a href={`#/collection/${item.collection_id}`} class="collection">
							<div class="collection--image">
								<img src={item.cover_media?.image_versions2?.candidates?.[0].url} />
							</div>
							<div class="collection--title">{item.collection_name}</div>
							<div class="collection--footer">{item.collection_media_count}</div>
						</a>
					))}
					<i class="w-100 text-center">(middle- or right-click to open a collection in a new tab)</i>
					{/* <PostsContainer id="saved" defaultClass="turned_in" toggleClass="turned_in_not" preload={0} /> */}
				</div>
			)

		return 'yay' // <PostsContainer id={'collection/' + id} defaultClass="turned_in" toggleClass="turned_in_not" preload={5} />
	}
}
