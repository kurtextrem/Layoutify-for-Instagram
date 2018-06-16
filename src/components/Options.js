import bind from 'autobind-decorator'
import { Button, Col, Container, Form, FormGroup, FormText, Input, Label } from 'reactstrap'
import { Component, createElement } from 'nervjs'
import { Storage, fetch as XHR, formToJSON, i18n } from './Utils'

const Options = (items = {}, render) => Object.keys(items).map(render)

/**
 * Options object.
 * If you add something here, you need to add it to src/content/main.js as well
 */
const OPTS = {
	// blockPosts: null, // [] // @TODO: This probably breaks the VL
	watchPosts: null, // []
	watchStories: null, // []
	watchInBackground: false,

	night: false,
	nightModeStart: 0,
	nightModeEnd: 0,

	picturesOnly: false,
	hideStories: false,
	noSpaceBetweenPosts: false,
	only3Dot: false,
	rows: window.innerWidth < 1367 ? 2 : 4,
	rowsFourBoxWidth: 23,
	rowsTwoBoxWidth: 40,
	blockStories: null, // []

	//hideRecommended: false, // @TODO: Implement (easy)
	//highlightOP: true, // @TODO: Implement (easy)
	// indicateFollowing: true // @TODO: Implement (fairly easy)
	// blockUnseen: false, // @TODO: Block URL "https://www.instagram.com/stories/reel/seen", however the chance that they remove this ability is fairly high
}

/**
 * Additional settings for options.
 * For options that are an integer it is required to set `min`, `step` and `max`.
 *
 * help: Whether to render a help text below the settings, using the i18n key `optionname_help`.
 * onChange: Handler that is triggered when the option is toggled.
 */
const OPTS_ADDITIONAL = {
	rows: {
		min: 2,
		step: 2,
		max: 4,
		help: false,
		onChange: undefined,
	},
	rowsFourBoxWidth: {
		min: 20,
		step: 1,
		max: 24,
		help: true,
		onChange: undefined,
	},
	rowsTwoBoxWidth: {
		min: 34,
		step: 1,
		max: 49,
		help: true,
		onChange: undefined,
	},
	nightModeStart: {
		min: 0,
		step: 1,
		max: 23,
		help: true,
		onChange: undefined,
	},
	nightModeEnd: {
		min: 0,
		step: 1,
		max: 23,
		help: true,
		onChange: undefined,
	},

	/**
	 * watchData type
	 * name: { // username
	 * 	id: String, // user_id
	 * 	post: String, // short_code
	 * 	story: String, // latest_reel_media id
	 * }
	 */
	watchStories: {
		help: false,
		async onChange(value) {
			if (typeof value === 'string') {
				const json = await XHR(`https://www.instagram.com/${value}/?__a=1`, {
					headers: new Headers({
						'x-requested-with': 'XMLHttpRequest',
					}),
					credentials: 'include',
					mode: 'cors',
				})
				const data = await Storage.get('watchData', {})
				const user = data[value]
				if (user === undefined)
					data[value] = {
						id: json.graphql.user.id,
						post: '',
						story: '',
					}
				else user.id = json.graphql.user.id

				Storage.set('watchData', data).catch(e => console.error(e) && e)
			}
		},
	},
	watchPosts: {
		help: false,
		async onChange(value) {
			if (typeof value === 'string') {
				const data = await Storage.get('watchData', {})
				if (data[value] === undefined)
					data[value] = {
						id: '',
						post: '',
						story: '',
					}

				Storage.set('watchData', data).catch(e => console.error(e) && e)
			}
		},
	},
	watchInBackground: {
		help: true,
		onChange(e) {
			if (e.target.checked === true) chrome.runtime.sendMessage(null, { action: 'watchInBackground' })
			else chrome.runtime.sendMessage(null, { action: 'stopWatchInBackground' })
		},
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

		const value = input.value.trim()
		if (!value) return

		const select = input.previousSibling,
			opt = document.createElement('option')
		opt.value = value
		opt.textContent = value
		opt.title = 'Right click to remove'
		opt.addEventListener('dblclick', this.remove)
		opt.addEventListener('contextmenu', this.remove)

		select.appendChild(opt)
		input.value = ''

		const additional = OPTS_ADDITIONAL[select.name]
		if (additional !== undefined) additional.onChange !== undefined && additional.onChange(value)
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
		const onChange = additional !== undefined ? additional.onChange : undefined
		if (typeof value === 'boolean')
			return <Input type="checkbox" name={id} id={id} checked={value ? true : undefined} onChange={onChange} />
		if (Array.isArray(value) || value === null)
			// @TODO: Fragments
			return (
				<div>
					<Input type="select" name={id} multiple>
						{value && value.map(this.renderOption)}
					</Input>
					<Input type="text" name={`${id}_add`} placeholder="Instagram Username" onKeyUp={this.add} />
					<Button type="button" onClick={this.add}>
						Add
					</Button>
				</div>
			)
		if (Number.isInteger(value))
			return (
				<Input type="number" name={id} min={additional.min} max={additional.max} step={additional.step} value={value} onChange={onChange} />
			)
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
