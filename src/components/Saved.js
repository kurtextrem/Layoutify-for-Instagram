import PostsContainer from './PostsContainer'
import { Component, Fragment, h } from 'preact'
import { fetchFromBackground } from './Utils'

// https://github.com/adrifkat/instagram-api/blob/master/src/Request/Collection.php
// $this->ig->request('collections/list/')->addParam('collection_types', '["ALL_MEDIA_AUTO_COLLECTION","MEDIA","PRODUCT_AUTO_COLLECTION"]');
// @TODO for collection names
export default class Saved extends Component {
	state = { collections: [] }

	componentDidMount() {
		fetchFromBackground('private_web', 'collections/list/')
	}

	render() {
		return (
		<>
			{this.state.collections.join(', ')}
			<PostsContainer id="saved" defaultClass="turned_in" toggleClass="turned_in_not" hasCategories preload={10} />
		</>
		)
	}
}
