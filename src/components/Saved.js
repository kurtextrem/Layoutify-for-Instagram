import PostsContainer from './PostsContainer'
import { h } from 'preact'

export default (
	<PostsContainer
		id="saved"
		defaultClass="turned_in"
		toggleClass="turned_in_not"
		hasCategories
		preload={10}
	/>
)
