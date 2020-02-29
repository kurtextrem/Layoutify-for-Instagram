import { Component, h } from 'preact'

export class EventComponent extends Component {
	handleEvent(e) {
		this[e.type](e)
	}
}
