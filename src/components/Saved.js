import PostsContainer from './PostsContainer'
import { h } from 'preact'

// https://github.com/adrifkat/instagram-api/blob/master/src/Request/Collection.php
// $this->ig->request('collections/list/')->addParam('collection_types', '["ALL_MEDIA_AUTO_COLLECTION","MEDIA","PRODUCT_AUTO_COLLECTION"]');
// @TODO for collection names
export default (
	<PostsContainer
		id="saved"
		defaultClass="turned_in"
		toggleClass="turned_in_not"
		hasCategories
		preload={10}
	/>
)
