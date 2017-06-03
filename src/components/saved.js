import PostsContainer from './PostsContainer'

export default class Saved extends PostsContainer {
	static get id() { return 'saved' }
	static get defaultClass() { return 'turned_in' }
	static get toggleClass() { return 'turned_in_not' }

	constructor(props) {
		super(props, Saved.id, Saved.defaultClass, Saved.toggleClass)
	}
}
