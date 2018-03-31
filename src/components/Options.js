import bind from 'autobind-decorator'
import { Button, Col, Container, Form, FormGroup, Input, Label } from 'reactstrap'
import { Component, createElement } from 'nervjs'
import { Storage, formToJSON, i18n } from './Utils'

const Options = (items, render) => Object.keys(items).map(render)
const OPTS = {
	// blockPosts: null, // [] // @TODO: This probably breaks the VL
	blockStories: null, // []
	//night: false,  // @TODO: Night mode not yet ready
	picturesOnly: false,
	hideStories: false,
	//hideRecommended: false, // @TODO: Implement
	//highlightOP: true, // @TODO: Implement
	only3Dot: false,
	rows: window.innerWidth < 1367 ? 2 : 4,
	// indicateFollowing: true // @TODO: Implement
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

		this.ref = null
	}

	state = {
		options: OPTS,
	}

	@bind
	setRef(ref) {
		return (this.ref = ref)
	}

	save(e) {
		const target = e.currentTarget !== undefined ? e.currentTarget : e
		console.log(formToJSON(target.elements))
		Storage.set('options', formToJSON(target.elements)).catch(console.error)
	}

	@bind
	add(e) {
		if (e.keyCode !== undefined && e.keyCode !== 13) return

		let input

		input = e.currentTarget
		if (input.tagName !== 'INPUT') input = e.currentTarget.previousSibling

		const select = input.previousSibling,
			opt = document.createElement('option')
		opt.value = input.value
		opt.textContent = input.value
		opt.title = 'Right click to remove'
		opt.addEventListener('dblclick', this.remove)
		opt.addEventListener('contextmenu', this.remove)

		select.appendChild(opt)
		input.value = ''
		this.save(this.ref.children[0])
	}

	@bind
	remove(e) {
		e.preventDefault()
		e.currentTarget.remove()
		this.save(this.ref.children[0])
	}

	shouldComponentUpdate(nextProps, nextState) {
		return nextState !== this.state
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
							{value !== null &&
								value.map(v => (
									<option key={v} value={v} onDoubleClick={this.remove} onContextMenu={this.remove}>
										{v}
									</option>
								))}
						</Input>
						<Input type="text" name={`${id}_add`} placeholder="Instagrame Username" onKeyUp={this.add} />
						<Button type="button" onClick={this.add}>
							Add
						</Button>
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
			<Container ref={this.setRef}>
				<Form onChange={this.save}>{Options(options || {}, this.renderOptions)}</Form>
			</Container>
		)
	}
}
