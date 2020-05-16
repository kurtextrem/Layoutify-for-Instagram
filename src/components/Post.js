import PostHeader from './PostHeader'
import PostMedia from './feed/PostMedia'
import PostAction from './feed/PostAction'
import bind from 'autobind-decorator'
import { CardBody, CardText } from 'reactstrap'
import { Chrome, Storage, logAndReturn } from './Utils'
import { default as FeedPost } from './feed/Post'
import { h } from 'preact'

export default class Post extends FeedPost {
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

		this.state.hasLiked = props.data.has_liked
		this.state.hasSaved = props.data.saved_collection_ids !== undefined ? true : false
		this.state.active = this.props.parent === 'liked' ? this.state.hasLiked : this.state.hasSaved

		this.id = props.data.id.split('_')[0] // after _ comes the user id, which we don't want in the media id
		this.timeout = 0
	}

	@bind
	handleLike() {
		this.setState(
			prevState => ({ hasLiked: !prevState.hasLiked }),
			async () => {
				window.clearTimeout(this.timeout)

				Chrome.send(this.state.hasLiked ? 'add' : 'remove', { id: this.id, which: 'liked' })
				if (!this.state.hasLiked && this.props.parent === 'liked') this.timeout = window.setTimeout(() => Post.removeItem(this.id), 7500)
			}
		)
	}

	@bind
	handleSave() {
		this.setState(
			prevState => ({ hasSaved: !prevState.hasSaved }),
			async () => {
				window.clearTimeout(this.timeout)

				Chrome.send(this.state.hasSaved ? 'add' : 'remove', { id: this.id, which: 'saved' })
				if (!this.state.hasSaved && this.props.parent === 'saved') this.timeout = window.setTimeout(() => Post.removeItem(this.id), 7500)
			}
		)
	}

	render() {
		const {
			data: { user = {}, caption = {}, code = '', view_count = 0, like_count = 0, taken_at = 0 },
			data,
			initial,
			defaultClass,
			toggleClass,
			parent,
			isCarousel,
		} = this.props
		const { active, hasLiked, hasSaved } = this.state
		const text = (caption && caption.text) || ''

		console.log(data)

		const dataProxy = { ...data }
		if (dataProxy.carousel_media !== undefined) {
			const carouselMedia = dataProxy.carousel_media
			for (let i = 0; i < carouselMedia.length; ++i) {
				const media = carouselMedia[i]
				media.is_video = media.media_type === 2
				media.video_url = media.is_video ? media.video_versions[0].url : undefined
				media.display_url = media.image_versions2.candidates[0].url
				media.dimensions = { height: media.image_versions2.candidates[0].height, width: media.image_versions2.candidates[0].width }
				carouselMedia[i] = { node: media }
			}
			dataProxy.edge_sidecar_to_children = { edges: dataProxy.carousel_media }
		} else {
			dataProxy.is_video = dataProxy.media_type === 2
			dataProxy.video_url = dataProxy.is_video ? dataProxy.video_versions[0].url : undefined
			dataProxy.display_url = dataProxy.image_versions2.candidates[0].url
			dataProxy.dimensions = {
				height: dataProxy.image_versions2.candidates[0].height,
				width: dataProxy.image_versions2.candidates[0].width,
			}
		}

		return (
			<article class={`card${active ? '' : ' fadeOut'}`} id={`post_${this.id}`} rendersubtree="activatable">
				<PostHeader user={user} code={code} taken_at={taken_at} />
				<PostMedia data={dataProxy} onLike={this.handleLike} />
				<PostAction
					like_media={{ count: like_count }}
					shortcode={code}
					is_video={dataProxy.is_video}
					video_view_count={view_count}
					hasLiked={hasLiked}
					hasSaved={hasSaved}
					onLike={this.handleLike}
					onSave={this.handleSave}
				/>
				<CardBody class="overflow-auto p-3 card-body">
					<CardText>{text}</CardText>
				</CardBody>
			</article>
		)
	}
}
