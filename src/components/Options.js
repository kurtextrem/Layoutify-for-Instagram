import bind from 'autobind-decorator'
import { Button, Col, Container, Form, FormGroup, FormText, Input, Label } from 'reactstrap'
import { Component, Fragment, h } from 'preact'
import { StorageSync, i18n, logAndReturn, throttle } from './Utils'

export default class Options extends Component {
	/**
	 * Options object.
	 * If you add something here, you need to add it to src/content/main.js as well
	 *
	 * Supports:
	 * - boolean toggle
	 * - array
	 * - number
	 */
	/* eslint-disable */
	static OPTS = {
		watchPosts: [],
		watchStories: [],
		watchInBackground: true,

		night: true,
		nightModeStart: 23,
		nightModeEnd: 6,
		nightSystem: true,

		picturesOnly: false,
		hideStories: false,
		noSpaceBetweenPosts: false,
		only3Dot: false,
		rows: window.innerWidth < 1367 ? 2 : 4,
		rowsFourBoxWidth: 23,
		rowsTwoBoxWidth: 40,

		modalWidth: 85,

		//hidePrivateIcon: false, // @TODO load in main.js & then apply CSS
		//hideVerifiedIcon: false, // @TODO load in main.js & then apply CSS

		// hideRecommended: false, // @TODO: Implement (easy)
		// highlightOP: true, // @TODO: Implement (easy)
		// indicateFollowing: true // @TODO: Implement (fairly easy)
		// blockUnseen: false, // @TODO: Block URL "https://www.instagram.com/stories/reel/seen", however the chance that they remove this ability is fairly high
	}
	/* elsint-enable */

	/**
	 * Additional settings for options.
	 * For options that are an integer it is required to set `min`, `step` and `max`.
	 *
	 * help: Whether to render a help text below the settings, using the i18n key `optionname_help`.
	 * onChange: Handler that is triggered when the option is toggled.
	 */
	static OPTS_ADDITIONAL = {
		rows: {
			min: 1,
			step: 1,
			max: 8,
			help: true,
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
		nightSystem: {
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
			help: true,
			onChange: undefined,
		},
		watchPosts: {
			help: true,
			onChange: undefined,
		},
		watchInBackground: {
			help: true,
			onChange(e) {
				if (e.target.checked === true) chrome.runtime.sendMessage(null, { action: 'watchInBackground' })
				else chrome.runtime.sendMessage(null, { action: 'stopWatchInBackground' })
			},
		},
		modalWidth: {
			min: 25,
			step: 1,
			max: 85,
			help: true,
			onChange: undefined,
		},
	}

	static AllOptions(items = {}, render) {
		const array = []
		for (const opt in Options.OPTS) array.push(render(opt))
		return array
	}

	constructor(properties) {
		super(properties)

		StorageSync.get('options', Options.OPTS)
			.then(data => {
				this.setState({ options: data })
				return data
			})
			.catch(logAndReturn)

		this.ref = null
		this.save = throttle(this.save.bind(this), 250)
	}

	state = {
		options: Options.OPTS,
	}

	@bind
	setRef(reference) {
		return (this.ref = reference)
	}

	/**
	 *
	 * @param {string} key options key
	 * @param {*} value
	 * @param {boolean} remove If array, remove `key`?
	 */
	save(key, value, remove) {
		this.setState((previousState, properties) => {
			const options = previousState.options,
				option = options[key]

			if (Array.isArray(option)) {
				if (remove) option.splice(option.indexOf(value), 1)
				else option.push(value)
			} else options[key] = value

			StorageSync.set('options', options).catch(logAndReturn)
			return { options }
		})
	}

	@bind
	add(e) {
		if (e.keyCode !== undefined && e.keyCode !== 13) return

		let input = e.currentTarget
		if (input.tagName !== 'INPUT') input = e.currentTarget.previousSibling

		const value = input.value.trim(),
			select = input.previousSibling,
			name = select.name,
			opt = this.state.options[name]
		input.value = ''
		if (!value || (opt !== null && opt.indexOf(value) !== -1)) return

		const additional = Options.OPTS_ADDITIONAL[name]
		if (additional !== undefined && additional.onChange !== undefined) additional.onChange(value)

		this.save(name, value, false)
	}

	@bind
	remove(e) {
		e.preventDefault()

		const target = e.target,
			type = target.type
		let value = target.value

		if (type === 'checkbox') value = target.checked
		else if (type === 'number') value = +value
		this.save(target.parentElement.name, value, true)
	}

	@bind
	async onChange(e) {
		const target = e.target
		if (!target.reportValidity()) return Promise.reject(new Error('Invalid Entry'))

		switch (target.type) {
			case 'checkbox':
				this.save(target.name, target.checked, false)
				break

			case 'number':
				this.save(target.name, +target.value, false)
				break

			case 'radio':
				if (!target.checked) break
				this.save(target.name, +target.value, false)
				break

			default:
				this.save(target.name, target.value, false)
				break
		}

		return e
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return nextState !== this.state
	}

	static renderLabel(id) {
		if (Options.OPTS[id] === undefined) return console.warn('outdated option', id) // @todo: Remove from dataset

		return (
			<Label for={id} sm={3}>
				{i18n(id)}
			</Label>
		)
	}

	static renderHelp(id) {
		return <FormText color="muted">{i18n(`${id}_help`)}</FormText>
	}

	@bind
	renderOption(key) {
		return (
			<option key={key} value={key} title="Right click to remove" onDoubleClick={this.remove} onContextMenu={this.remove}>
				{key}
			</option>
		)
	}

	renderBasedOnType(id, value, additional) {
		const onChange =
			additional === undefined || additional.onChange === undefined
				? e => this.onChange(e).catch(logAndReturn)
				: e => this.onChange(e).then(additional.onChange).catch(logAndReturn)

		const type = Options.OPTS[id]
		if (type === undefined) return console.warn('outdated option', id, value)

		if (typeof type === 'boolean') return <Input type="checkbox" name={id} id={id} checked={value} onChange={onChange} />
		if (Array.isArray(type)) {
			const options = value.map(this.renderOption)
			return (
				<div class="d-flex flex-wrap">
					<Input name={id} type="select" multiple style={{ '--size': options.length * 1.5 + 'em' }}>
						{options}
					</Input>
					<Input type="text" name={`${id}_add`} placeholder="Instagram Username" onKeyUp={this.add} class="w-auto f-1" />
					<Button type="button" onClick={this.add}>
						Add
					</Button>
				</div>
			)
		}
		if (Number.isInteger(type)) {
			const { min = -1, max = -1, step = -1 } = additional
			if (step === 1)
				return (
					<Input
						type="number"
						name={id}
						step={step !== -1 ? step : undefined}
						min={min !== -1 ? min : undefined}
						max={max !== -1 ? max : undefined}
						value={value}
						onChange={onChange}
					/>
				)

			const radio = []
			for (let i = min; i <= max; i += step) {
				radio.push(
					<Label key={i}>
						<Input type="radio" name={id} value={i} onChange={onChange} checked={i === value ? true : undefined} /> {i}
					</Label>
				)
			}
			return radio
		}

		return null
	}

	@bind
	renderOptions(id) {
		const additional = Options.OPTS_ADDITIONAL[id]

		return (
			<FormGroup key={id} row>
				{Options.renderLabel(id)}
				<Col sm={9}>
					{this.renderBasedOnType(id, this.state.options[id], additional)}
					{additional !== undefined && additional.help && Options.renderHelp(id)}
				</Col>
			</FormGroup>
		)
	}

	render() {
		const { options } = this.state
		return (
			<Container ref={this.setRef}>
				<Form>{Options.AllOptions(options, this.renderOptions)}</Form>
			</Container>
		)
	}
}
