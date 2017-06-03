import PostsContainer from './PostsContainer'

export default class Liked extends PostsContainer {
	static get id() { return 'liked' }
	static get defaultClass() { return 'favorite' }
	static get toggleClass() { return 'favorite_border' }

	constructor(props) {
		super(props, Liked.id, Liked.defaultClass, Liked.toggleClass)
	}
}
