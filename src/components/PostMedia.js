import Dots from './Dots'
import bind from 'autobind-decorator'
import { Button } from 'reactstrap'
import { Component, createElement } from 'nervjs'
import { updateCDN } from './Utils'

let observer
function onChange(changes) {
	for (const i in changes) {
		const change = changes[i]
		if (change.isIntersecting) {
			const target = change.target
			target.src = target.dataset.src // not in a rIC because of https://github.com/necolas/react-native-web/issues/759
			target.addEventListener('load', function(e) {
				window.requestAnimationFrame(() => {
					e.target.parentElement.classList.remove('img--placeholder')
					e.target.parentElement.classList.add('img--loaded')
				})
			})
			observer.unobserve(target)
		}
	}
}

let initiated = false
function init() {
	initiated = true
	if (window.IntersectionObserver !== undefined)
		observer = new window.IntersectionObserver(onChange, {
			rootMargin: '0px 0px 400px 0px', // eagerly load next rows
		})
}

export default class PostMedia extends Component {
	constructor(props) {
		super(props)

		this.ref = null
		this.style = { 'padding-bottom': '' }

		if (!initiated) init()
	}

	state = {
		carouselIndex: 0,
	}

	@bind
	setRef(ref) {
		return (this.ref = ref)
	}

	@bind
	handleArrowClick(e) {
		e.stopPropagation()
		e.preventDefault()

		this.setState((prevState, props) => {
			let newIndex = prevState.carouselIndex
			if (e.currentTarget.classList.contains('arrow--left')) --newIndex
			else ++newIndex

			if (newIndex < 0) newIndex = props.carouselLen - 1
			else if (newIndex >= props.carouselLen) newIndex = 0

			return { carouselIndex: newIndex }
		})
	}

	componentDidMount() {
		observer.observe(this.ref)
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (this.state.carouselIndex !== nextState.carouselIndex) return true
		return false
	}

	componentWillUnmount() {
		if (this.ref) observer.unobserve(this.ref)
		this.ref = null
	}

	render() {
		const { isCarousel, carouselLen, initial, data } = this.props
		const { carouselIndex } = this.state
		const media = isCarousel ? data.carousel_media[carouselIndex] : data

		let mediaElement, candidate
		if (media.media_type === 2) {
			// video
			candidate = media.video_versions[0]

			const url = updateCDN(candidate.url)
			mediaElement = (
				<video
					ref={this.setRef}
					src={isCarousel || initial ? url : ''}
					data-src={url}
					poster={media.image_versions2.candidates[0].url}
					type="video/mp4"
					preload="metadata"
					className="img-fluid"
					controls
				/>
			)
		} else {
			candidate = media.image_versions2.candidates[0]

			const url = updateCDN(candidate.url)
			mediaElement = (
				<img
					ref={this.setRef}
					src={isCarousel || initial ? url : ''}
					data-src={url}
					alt="If you see this, the post has probably been deleted"
					className="img-fluid"
					decoding="async"
				/>
			)
		}

		this.style['padding-bottom'] = `${(candidate.height / candidate.width) * 100}%`

		return (
			<div className={`position-relative${isCarousel ? ' post--carousel' : ''}`}>
				{isCarousel ? (
					<Button className="arrow arrow--left" color="link" onClick={this.handleArrowClick}>
						<i className="material-icons">keyboard_arrow_left</i>
					</Button>
				) : null}
				<a
					href={`https://www.instagram.com/p/${data.code}`}
					target="_blank"
					rel="noopener"
					className="img--wrapper img--placeholder"
					style={this.style}>
					{mediaElement}
				</a>
				{isCarousel ? (
					<Button className="arrow arrow--right" color="link" onClick={this.handleArrowClick}>
						<i className="material-icons">keyboard_arrow_right</i>
					</Button>
				) : null}
				{isCarousel ? <Dots index={carouselIndex} len={carouselLen} /> : null}
			</div>
		)
	}
}
