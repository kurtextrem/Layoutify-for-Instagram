import Dots from '../Dots'
import bind from 'autobind-decorator'
import { Button } from 'reactstrap'
import { Component, h } from 'preact'

export default class PostMedia extends Component {
	state = {
		carouselIndex: 0,
		carouselLen: 0,
		isCarousel: false,
	}

	constructor(props) {
		super(props)

		const carousel = props.data.edge_sidecar_to_children
		if (carousel !== undefined) {
			this.state.isCarousel = true
			this.state.carouselLen = carousel.edges.length
		}
	}

	@bind
	handleArrowClick(e) {
		e.stopPropagation()
		e.preventDefault()

		this.setState((previousState, properties) => {
			let newIndex = previousState.carouselIndex
			if (e.currentTarget.classList.contains('arrow--left')) --newIndex
			else ++newIndex

			if (newIndex < 0) newIndex = properties.carouselLen - 1
			else if (newIndex >= properties.carouselLen) newIndex = 0

			return { carouselIndex: newIndex }
		})
	}

	shouldComponentUpdate(nextProperties, nextState) {
		if (this.state.carouselIndex !== nextState.carouselIndex) return true
		return false
	}

	render() {
		const { data } = this.props
		const { carouselIndex, carouselLen, isCarousel } = this.state
		const media = isCarousel ? data.edge_sidecar_to_children.edges[carouselIndex] : data

		console.log(media)

		let mediaElement
		if (media.is_video) {
			// video
			mediaElement = (
				<video
					src={media.video_url}
					poster={media.display_url}
					type="video/mp4"
					preload="metadata"
					class="img-fluid"
					intrinsicsize={media.dimensions !== undefined ? `${media.dimensions.width}x${media.dimensions.height}` : undefined}
					controls
				/>
			)
		} else {
			mediaElement = (
				<img
					src={media.display_url}
					alt={media.accessibility_caption}
					class="img-fluid"
					decoding="async"
					intrinsicsize={media.dimensions !== undefined ? `${media.dimensions.width}x${media.dimensions.height}` : undefined}
				/>
			)
		}

		return (
			<div class={`position-relative${isCarousel ? ' post--carousel' : ''}`}>
				{isCarousel ? (
					<Button class="arrow arrow--left" color="link" onClick={this.handleArrowClick}>
						<i class="material-icons">keyboard_arrow_left</i>
					</Button>
				) : null}
				<a href={`https://www.instagram.com/p/${data.shortcode}`} target="_blank" rel="noopener" class="img--wrapper">
					{mediaElement}
				</a>
				{isCarousel ? (
					<Button class="arrow arrow--right" color="link" onClick={this.handleArrowClick}>
						<i class="material-icons">keyboard_arrow_right</i>
					</Button>
				) : null}
				{isCarousel ? <Dots index={carouselIndex} len={carouselLen} /> : null}
			</div>
		)
	}
}

// @TODO
// Tagged users
// Video
// Carousel "sidecar"
