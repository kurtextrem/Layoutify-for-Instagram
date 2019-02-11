//import ImgWorker from './ImgWorker'
import PostFooter from './PostFooter'
import PostHeader from './PostHeader'
import PostMedia from './PostMedia'
import { CardBody, CardText } from 'reactstrap'
import {
	Chrome,
	Storage,
	getWorkerBlob,
	logAndReturn,
	updateCDN,
} from './Utils'
import { EventComponent } from './EventComponent'
import { createElement } from 'nervjs'

let initiated = false,
	worker
function init() {
	initiated = true
	if (window.Worker !== undefined) {
		getWorkerBlob()
			.then(blob => (worker = new window.Worker(blob)))
			.catch(logAndReturn)
	}
}

export default class Post extends EventComponent {
	static removeItem(id) {
		Storage.get('items', null)
			.then(data => {
				if (data === null) return data

				data.items.splice(data.items.indexOf(id))
				Storage.set('items', data.items)
				return data
			})
			.catch(logAndReturn)
	}

	constructor(props) {
		super(props)

		this.id = props.data.id.split('_')[0] // after _ comes the user id, which we don't want in the media id
		this.isCarousel = props.data.media_type === 8
		this.carouselLen = this.isCarousel ? props.data.carousel_media.length : 0
		this.preloaded = false
		this.timeout = 0

		if (!initiated) init()
	}

	state = {
		active: true,
	}

	mouseenter() {
		if (this.preloaded) return

		this.preloaded = true
		for (let i = 1; i < this.carouselLen; ++i) {
			this.preload(i)
		}
	}

	click(e) {
		e.stopPropagation()
		e.preventDefault()

		if (this.state.active) {
			Chrome.send('remove', { which: this.props.parent, id: this.id })
			this.setState((prevState, props) => ({ active: false }))
			this.timeout = window.setTimeout(() => Post.removeItem(this.id), 7500)
		} else {
			Chrome.send('add', { which: this.props.parent, id: this.id })
			this.setState((prevState, props) => ({ active: true }))
			window.clearTimeout(this.timeout)
		}
	}

	preload(index) {
		if (worker !== undefined) {
			console.log(
				'preloading',
				this.props.data.carousel_media[index].image_versions2.candidates[0].url
			)
			worker.postMessage(
				updateCDN(
					this.props.data.carousel_media[index].image_versions2.candidates[0]
						.url
				)
			)
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (this.state.active !== nextState.active) return true
		return false
	}

	render() {
		const {
			data: { user = {}, caption = {} },
			data,
			initial,
			defaultClass,
			toggleClass,
			parent,
		} = this.props
		const { active } = this.state
		const isCarousel = this.isCarousel
		const carouselLen = this.carouselLen
		const text = (caption && caption.text) || ''

		return (
			<article
				className={`card${active ? '' : ' fadeOut'}`}
				id={`post_${this.id}`}
				onMouseEnter={isCarousel ? this : undefined}
			>
				<PostHeader user={user} code={data.code} taken_at={data.taken_at} />
				<PostMedia
					isCarousel={isCarousel}
					carouselLen={carouselLen}
					initial={initial}
					data={data}
				/>
				<CardBody className="overflow-auto p-3 card-body">
					<CardText>{text}</CardText>
				</CardBody>
				<PostFooter
					active={active}
					btnClick={this}
					defaultClass={defaultClass}
					toggleClass={toggleClass}
					parent={parent}
				/>
			</article>
		)
	}
}
