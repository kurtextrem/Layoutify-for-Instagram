import { h, render } from 'preact' // eslint-disable-line no-unused-vars
import Posts from './posts'

export default class Liked extends Posts {
	static get id() { return 'liked' }
	static get defaultClass() { return 'favorite' }
	static get toggleClass() { return 'favorite_border' }

	constructor(props) {
		super(props, Liked.id, Liked.defaultClass, Liked.toggleClass)
	}
}
