import { Component } from 'preact'

export default class EventComponent extends Component {
	handleEvent(e) {
		this[e.type](e)
	}
}
