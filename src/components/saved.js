import { h, render } from 'preact' // eslint-disable-line no-unused-vars
import Posts from './posts'

export default class Saved extends Posts {
	static get id() { return 'saved' }
	static get defaultClass() { return 'turned_in' }
	static get toggleClass() { return 'turned_in_not' }

	constructor(props) {
		super(props, Saved.id, Saved.defaultClass, Saved.toggleClass)
	}
}
