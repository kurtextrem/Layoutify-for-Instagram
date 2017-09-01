import Dots from './Dots'
import PostFooter from './PostFooter'
import PostHeader from './PostHeader'
import { Button, CardBlock, CardText } from 'reactstrap'
import { Chrome, updateCDN } from './Utils'
import { Component, h } from 'preact'

let observer
if (typeof IntersectionObserver !== 'undefined')
	observer = new IntersectionObserver(onChange, {
		rootMargin: '0px 0px 400px 0px', // eagerly load next rows
	})

function onChange(changes) {
	for (let i = 0; i < changes.length; ++i) {
		const change = changes[i]
		if (change.isIntersecting) {
			if (i < 8) change.target.src = change.target.dataset.src
			else
				window.requestIdleCallback(() => {
					change.target.src = change.target.dataset.src
				})
			observer.unobserve(change.target)
		}
	}
}

export default class Post extends Component {
	constructor(props) {
		super(props)

		this.id = props.data.id.split('_')[0] // after _ comes the user id, which we don't want in the media id
		this.isCarousel = props.data.media_type === 8
		this.carouselLen = this.isCarousel ? props.data.carousel_media.length : 0
		this.preloaded = false
		this.ref = null

		this.state = {
			carouselIndex: 0,
			active: true,
		}
	}

	handleArrowClick = e => {
		e.stopPropagation()
		e.preventDefault()

		if (!this.preloaded) {
			for (let i = 1; i < this.carouselLen; ++i) {
				window.setTimeout(this.preload.bind(this, i), 1)
			}
			this.preloaded = true
		}

		this.setState((prevState, props) => {
			let newIndex = prevState.carouselIndex
			if (e.currentTarget.classList.contains('arrow--left')) --newIndex
			else ++newIndex

			if (newIndex < 0) newIndex = this.carouselLen - 1
			else if (newIndex >= this.carouselLen) newIndex = 0

			return { carouselIndex: newIndex }
		})
	}

	onBtnClick = e => {
		e.stopPropagation()
		e.preventDefault()

		if (this.state.active) {
			// @todo: Modify our data
			Chrome.send('remove', { which: this.props.parent, id: this.id })
			this.setState((prevState, props) => ({ active: false }))
		} else {
			Chrome.send('add', { which: this.props.parent, id: this.id })
			this.setState((prevState, props) => ({ active: true }))
		}
	}

	setRef = ref => (this.ref = ref)

	preload(index) {
		new Image().src = this.props.data.carousel_media[index].image_versions2.candidates[0].url
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (this.isCarousel && this.state.carouselIndex !== nextState.carouselIndex) return true
		if (this.state.active !== nextState.active) return true
		return false
	}

	componentDidMount() {
		observer.observe(this.ref)
	}

	componentWillUnmount() {
		observer.unobserve(this.ref)
		this.ref = null
	}

	render(props, state) {
		const post = props.data
		const isCarousel = this.isCarousel

		const caption = post.caption && post.caption.text // could be either undefined or null
		const user = post.user

		const media = isCarousel ? post.carousel_media[state.carouselIndex] : post

		let mediaElement = null,
			candidate = null
		if (media.media_type === 2) {
			// video
			candidate = media.video_versions[0]
			mediaElement = (
				<video
					ref={this.setRef}
					data-src={updateCDN(candidate.url)}
					poster={media.image_versions2.candidates[0].url}
					type="video/mp4"
					width={candidate.width}
					height={candidate.height}
					preload="none"
					className="img-fluid"
					controls
				/>
			)
		} else {
			candidate = media.image_versions2.candidates[0]
			mediaElement = (
				<img
					ref={this.setRef}
					width={candidate.width}
					height={candidate.height}
					data-src={updateCDN(candidate.url)}
					alt={caption + ' - if you see this, the post has probably been deleted.'}
					className="img-fluid"
				/>
			)
		}

		return (
			<article class="card">
				<PostHeader user={user} code={post.code} taken_at={post.taken_at} />
				<a href={`https://www.instagram.com/p/${post.code}`} target="_blank" rel="noopener" className={isCarousel ? 'post--carousel' : ''}>
					{isCarousel ? (
						<Button className="arrow arrow--left" color="link" onClick={this.handleArrowClick}>
							<i class="material-icons">keyboard_arrow_left</i>
						</Button>
					) : null}
					{mediaElement}
					{isCarousel ? (
						<Button className="arrow arrow--right" color="link" onClick={this.handleArrowClick}>
							<i class="material-icons">keyboard_arrow_right</i>
						</Button>
					) : null}
				</a>
				{isCarousel ? <Dots index={state.carouselIndex} len={this.carouselLen} /> : null}
				<CardBlock className="overflow-auto p-3 card-body">
					<CardText>{caption}</CardText>
				</CardBlock>
				<PostFooter
					active={state.active}
					btnClick={this.onBtnClick}
					defaultClass={props.defaultClass}
					toggleClass={props.toggleClass}
					parent={props.parent}
				/>
			</article>
		)
	}
}
