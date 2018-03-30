import bind from 'autobind-decorator'
import { Component, createElement } from 'nervjs'
import { getWorkerBlob, shallowDiffers } from './Utils'

/** Have we initiated the worker pool already? */
let workerPoolCreated = false,
	poolLen = 0
const workerPool = []

function createWorkerPool() {
	getWorkerBlob()
		.then(blob => {
			poolLen = window.navigator.hardwareConcurrency - 2 || 2 // Let's "reserve" one CPU for main thread and other threads
			for (let i = 0; i < poolLen; ++i) {
				workerPool.push({
					worker: new Worker(blob),
					inUse: false,
					i,
				})
			}

			return blob
		})
		.catch(console.error)
}

/** Returns the next available worker. */
function getNextWorker() {
	for (let i = 0; i < poolLen; ++i) {
		const worker = workerPool[i]
		if (!worker.inUse) {
			worker.inUse = true
			return worker
		}
	}
	// no free found, so we just return the first one
	return workerPool[0]
}

/** Marks worker `index` as available. */
function setFree(index) {
	workerPool[index].inUse = false
}

export default class ImgWorker extends Component {
	constructor(props) {
		super(props)
		this.img = null

		if (!workerPoolCreated) {
			workerPoolCreated = true
			createWorkerPool()
		}

		this.worker = this.initWorker()
		this.worker.postMessage(props.src || props['data-src'])
	}

	state = {
		isLoading: true,
	}

	@bind
	initWorker() {
		const workerObj = getNextWorker()
		workerObj.worker.addEventListener(
			'message',
			event => {
				this.loadImage(event.data)
				setFree(workerObj.i)
			},
			{ once: true }
		)

		return workerObj.worker
	}

	@bind
	async loadImage(url) {
		const img = this.img || new Image()
		this.img = img
		img.src = url
		if (img.decode !== undefined) {
			return img
				.decode()
				.then(this.onload)
				.catch(this.onerror)
		}
		img.addEventListener('load', this.onload)
		img.addEventListener('error', this.onerror)
	}

	@bind
	onload() {
		this.setState(() => ({ isLoading: false }))
	}

	@bind
	onerror(e) {
		console.error('Failed loading', e)
		// we set the broken URL anyway
		this.onload()
	}

	componentWillReceiveProps(nextProps) {
		const { imgSrc } = this.state
		if (imgSrc !== nextProps.src && imgSrc !== nextProps['data-src']) this.worker.postMessage(nextProps.src || nextProps['data-src'])
	}

	shouldComponentUpdate(props, state) {
		return shallowDiffers(props, this.props) || state.isLoading !== this.state.isLoading
	}

	componentWillUnmount() {
		if (this.img !== null) {
			this.img.removeEventListener('load', this.onload)
			this.img.removeEventListener('error', this.onerror)
		}
	}

	@bind
	renderPlaceholder() {
		const { placeholder, placeholderAlt, ...attributes } = this.props
		if (placeholder !== undefined) {
			if (typeof placeholder === 'object') return placeholder
			if (typeof placeholder === 'function') {
				const Comp = placeholder
				return <Comp />
			}
		}
		return <img {...attributes} src={placeholder} alt={placeholderAlt} />
	}

	render() {
		const { src, placeholderAlt, placeholder, ...attributes } = this.props // eslint-disable-line no-unused-vars
		const { isLoading } = this.state
		return isLoading ? this.renderPlaceholder() : <img {...attributes} src={this.img.src} /> // props instead of this.props
	}
}
