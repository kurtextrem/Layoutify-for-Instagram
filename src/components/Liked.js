import PostsContainer from './PostsContainer'
import { h } from 'preact'

export default (
	<PostsContainer
		id="liked"
		defaultClass="favorite"
		toggleClass="favorite_border"
		hasCategories={false}
		preload={5}
	/>
)
