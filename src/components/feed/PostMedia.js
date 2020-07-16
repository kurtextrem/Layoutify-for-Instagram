import Arrow from './Arrow'
import Dots from '../Dots'
import User from './User'
import bind from 'autobind-decorator'
import { Component, Fragment, createRef, h } from 'preact'

export default class PostMedia extends Component {
	static volume = 1

	videoRef = createRef()

	state = {
		carouselIndex: 0,
		carouselLen: 0,
		isCarousel: false,
	}

	timeout = 0

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
			if (e.currentTarget.classList.contains('ige_carousel-btn--left')) --newIndex
			else ++newIndex

			if (newIndex < 0) newIndex = previousState.carouselLen - 1
			else if (newIndex >= previousState.carouselLen) newIndex = 0

			return { carouselIndex: newIndex }
		})
	}

	componentDidMount() {
		if (this.videoRef.current !== undefined) this.videoRef.current.volume = PostMedia.volume
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return this.state.carouselIndex !== nextState.carouselIndex
	}

	setVolume(e) {
		PostMedia.volume = e.target.volume
	}

	@bind
	setPreload() {
		if (this.videoRef.current !== undefined) this.videoRef.current.preload = 'auto'
	}

	getMedia(media) {
		if (media.is_video) {
			// video | @todo Once we use virtual list, use preload="metadata"
			return (
				<video
					src={media.video_url}
					poster={media.display_url}
					type="video/mp4"
					class="img-fluid"
					preload="none"
					intrinsicsize={media.dimensions !== undefined ? `${media.dimensions.width}x${media.dimensions.height}` : undefined}
					controls
					onVolumeChange={this.setVolume}
					ref={this.videoRef}
				/>
			)
		}

		return (
			<img
				src={media.display_url}
				alt={media.accessibility_caption}
				class="img-fluid"
				decoding="async"
				intrinsicsize={media.dimensions !== undefined ? `${media.dimensions.width}x${media.dimensions.height}` : undefined}
			/>
		)
	}

	toggleTaggedUsers(e) {
		e.currentTarget.parentElement.classList.toggle('ige_show_tagged')
	}

	getTaggedUsers(edges) {
		if (!edges || edges.length === 0) return null

		// FIXME translate -50% needs to be calculated: distance from left side.
		// FIXME translate -100% needs to be calculatd: distance from bottom.
		return (
			<>
				{edges.map(v => {
					const node = v.node,
						username = node.user.username

					return (
						<div
							key={node.x + '' + node.y + '' + node.user.id}
							class="ige_taggedUser"
							style={{
								left: node.x * 100 + '%',
								top: node.y * 100 + '%',
								transform: `translate(${node.y > 0.15 ? '-50%' : '0'}, ${node.y > 0.85 ? '-100%' : '0'}`,
							}}>
							<a href={'/' + username + '/'}>{node.user.full_name || username}</a>
						</div>
					)
				})}
				<button type="button" class="ige_button ige_post_userIcon" onClick={this.toggleTaggedUsers}>
					<User size="24" fill="white" />
				</button>
			</>
		)
	}

	@bind
	handleDblClick() {
		this.props.onLike()
	}

	@bind
	handleHover() {
		this.timeout = window.setTimeout(this.setPreload, 75)
	}

	@bind
	handleMouseOut() {
		if (this.timeout) {
			window.clearTimeout(this.timeout)
			this.timeout = 0
		}
	}

	render() {
		const { data } = this.props
		const { carouselIndex, carouselLen, isCarousel } = this.state

		let mediaElement

		if (isCarousel) {
			mediaElement = data.edge_sidecar_to_children.edges.map((v, i) => (
				<div
					key={v.id}
					data-active={i === carouselIndex ? '' : undefined}
					hidden={i > carouselIndex + 1 || (i < carouselIndex - 1 && i > 0)}>
					{this.getMedia(v.node)}
					{this.getTaggedUsers(v.node.edge_media_to_tagged_user?.edges)}
				</div>
			))
		} else {
			mediaElement = (
				<div data-active>
					{this.getMedia(data)}
					{this.getTaggedUsers(data.edge_media_to_tagged_user?.edges)}
				</div>
			)
		}

		return (
			<div
				class="ige_post-media p-relative"
				onDblClick={this.handleDblClick}
				onMouseEnter={this.handleHover}
				onMouseOut={this.handleMouseOut}>
				<div class="img--wrapper">{mediaElement}</div>
				{isCarousel && carouselIndex !== 0 ? (
					<button type="button" class="ige_button ige_carousel-btn ige_carousel-btn--left" onClick={this.handleArrowClick} />
				) : null}
				{isCarousel ? (
					<button type="button" class="ige_button ige_carousel-btn ige_carousel-btn--right" onClick={this.handleArrowClick} />
				) : null}
				{isCarousel ? <Dots index={carouselIndex} len={carouselLen} /> : null}
			</div>
		)
	}
}
