import bind from 'autobind-decorator'
import { Button, Col, Container, Form, FormGroup, FormText, Input, Label } from 'reactstrap'
import { Component, createElement } from 'nervjs'
import { Storage, formToJSON, i18n } from './Utils'

const Options = (items = {}, render) => Object.keys(items).map(render)
const OPTS = {
	// blockPosts: null, // [] // @TODO: This probably breaks the VL
	blockStories: null, // []
	night: false,
	nightModeStart: 0,
	nightModeEnd: 0,
	picturesOnly: false,
	hideStories: false,
	noSpaceBetweenPosts: false,
	//hideRecommended: false, // @TODO: Implement
	//highlightOP: true, // @TODO: Implement
	only3Dot: false,
	rows: window.innerWidth < 1367 ? 2 : 4,
	rowsFourBoxWidth: 23,
	rowsTwoBoxWidth: 40,
	// indicateFollowing: true // @TODO: Implement
}

const OPTS_ADDITIONAL = {
	rows: {
		min: 2,
		step: 2,
		max: 4,
	},
	rowsFourBoxWidth: {
		min: 20,
		step: 1,
		max: 24,
		help: true,
	},
	rowsTwoBoxWidth: {
		min: 34,
		step: 1,
		max: 49,
		help: true,
	},
	nightModeStart: {
		min: 0,
		step: 1,
		max: 23,
		help: true,
	},
	nightModeEnd: {
		min: 0,
		step: 1,
		max: 23,
		help: true,
	},
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

	renderLabel(id) {
		return (
			<Label for={id} sm={3}>
				{i18n(id)}
			</Label>
		)
	}

	renderHelp(id) {
		return <FormText color="muted">{i18n(`${id}_help`)}</FormText>
	}

	@bind
	renderOption(key) {
		return (
			<option key={key} value={key} onDoubleClick={this.remove} onContextMenu={this.remove}>
				{key}
			</option>
		)
	}

	@bind
	renderBasedOnType(id, value, additional) {
		if (typeof value === 'boolean') return <Input type="checkbox" name={id} id={id} checked={value ? true : undefined} />
		if (Array.isArray(value) || value === null)
			// @TODO: Fragments
			return (
				<div>
					<Input type="select" name={id} multiple>
						{value && value.map(this.renderOption)}
					</Input>
					<Input type="text" name={`${id}_add`} placeholder="Instagrame Username" onKeyUp={this.add} />
					<Button type="button" onClick={this.add}>
						Add
					</Button>
				</div>
			)
		if (Number.isInteger(value))
			return <Input type="number" name={id} min={additional.min} max={additional.max} step={additional.step} value={value} />
		return null
	}

	@bind
	renderOptions(id) {
		const additional = OPTS_ADDITIONAL[id]

		return (
			<FormGroup key={id} row>
				{this.renderLabel(id)}
				<Col sm={9}>
					{this.renderBasedOnType(id, this.state.options[id], additional)}
					{additional !== undefined && additional.help && this.renderHelp(id)}
				</Col>
			</FormGroup>
		)
	}

	render() {
		const { options } = this.state
		return (
			<Container ref={this.setRef}>
				<Form onChange={this.save}>{Options(options, this.renderOptions)}</Form>
			</Container>
		)
	}
}
