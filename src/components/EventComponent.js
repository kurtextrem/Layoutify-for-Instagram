import { Component, createElement } from 'nervjs'

export class EventComponent extends Component {
	handleEvent(e) {
		this['on' + e.type](e)
	}
}
