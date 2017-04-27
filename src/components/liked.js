import { h, render, Component } from 'preact'
import Posts from './posts'

export default class Liked extends Posts {
	static get id() { return 'liked' }

	constructor(props) {
		super(props, Liked.id)
	}
}
