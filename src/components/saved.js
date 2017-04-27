import { h, render, Component } from 'preact'
import Posts from './posts'

export default class Saved extends Posts {
	static get id() { return 'saved' }

	constructor(props) {
		super(props, Saved.id)
	}
}
