import { h, render, Component } from 'preact' // eslint-disable-line no-unused-vars
import Posts from './posts'

export default class Liked extends Posts {
	static get id() { return 'liked' }

	constructor(props) {
		super(props, Liked.id)
	}
}
