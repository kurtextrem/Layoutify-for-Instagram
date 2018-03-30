import bind from 'autobind-decorator'
import { Button, Col, Container, Form, FormGroup, Input, Label } from 'reactstrap'
import { Component, createElement } from 'nervjs'
import { Storage, formToJSON, i18n } from './Utils'

const Options = (items, render) => Object.keys(items).map(render)
const OPTS = {
	blockPosts: null, // []
	blockStories: null, // []
	night: false,
	picturesOnly: false,
	hideStories: false,
	hideRecommended: false,
	highlightOP: true,
	only3Dot: false,
	rows: window.innerWidth < 1367 ? 2 : 4,
	// indicateFollowing: true
}

export default class About extends Component {
	constructor(props) {
		super(props)

		Storage.get('options', OPTS)
			.then(data => {
				this.setState((prevState, props) => ({ options: data }))
				return data
			})
			.catch(console.error)
	}

	state = {
		options: OPTS,
	}

	save(e) {
		console.log(formToJSON(e.currentTarget.elements))
		Storage.set('options', formToJSON(e.currentTarget.elements)).catch(console.error)
	}

	shouldComponentUpdate() {
		return false
	}

	@bind
	renderOptions(id) {
		const value = this.state.options[id]
		if (typeof value === 'boolean')
			return (
				<FormGroup key={id} row>
					<Label for={id} sm={3}>
						{i18n(id)}
					</Label>
					<Col sm={9}>
						<Input type="checkbox" name={id} id={id} checked={value ? true : undefined} />
					</Col>
				</FormGroup>
			)
		if (Array.isArray(value) || value === null)
			return (
				<FormGroup key={id} row>
					<Label for={id} sm={3}>
						{i18n(id)}
					</Label>
					<Col sm={9}>
						<Input type="select" name={id} multiple>
							{value !== null && value.map(v => <value key={v} value={v} />)}
						</Input>
						<input type="text" name={`${id}_add`} placeholder="Username" />
						<Button type="button">Add</Button>
					</Col>
				</FormGroup>
			)
		if (Number.isInteger(value))
			return (
				<FormGroup key={id} row>
					<Label for={id} sm={3}>
						{i18n(id)}
					</Label>
					<Col sm={9}>
						<Input type="number" name={id} min="2" max="6" step="2" value={value} />
					</Col>
				</FormGroup>
			)
		return null
	}

	render() {
		const { options } = this.state
		return (
			<Container>
				<Form onChange={this.save}>{Options(options || {}, this.renderOptions)}</Form>
			</Container>
		)
	}
}
