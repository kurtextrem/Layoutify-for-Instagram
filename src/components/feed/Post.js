//import ImgWorker from './ImgWorker'
import Comments from './Comments'
import Heart from './Heart'
import PostFooter from './PostFooter'
import PostHeader from './PostHeader'
import PostMedia from './PostMedia'
import Save from './Save'
import bind from 'autobind-decorator' // @todo: when handleEvent works again, remove this
import { EventComponent } from '../EventComponent'
import { h } from 'preact'

export default class Post extends EventComponent {
	constructor(props) {
		super(props)

		this.carouselLen = props.data.edge_sidecar_to_children?.edges?.length ?? 0
		this.preloaded = false
		this.timeout = 0
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return true
		//if (this.state.active !== nextState.active) return true
		//return false
	}

	render() {
		const {
			data: {
				owner = {},
				taken_at_timestamp = 0,
				location = null,
				edge_media_to_caption = null,
				id = 0,
				shortcode = '',
				comments_disabled = true,
				edge_media_preview_like = null,
				edge_media_preview_comment = null,
			},
			data,
		} = this.props
		const text = edge_media_to_caption?.edges[0]?.node?.text

		return (
			<article class="ige_post" id={`post_${id}`}>
				<PostHeader user={owner} shortcode={shortcode} taken_at={taken_at_timestamp} location={location} />
				<PostMedia data={data} />
				<div class="d-flex f-row a-center">
					<button type="button" class="ige_button">
						<Heart width={32} height={32} />
					</button>
					<button type="button" class="ige_button">
						<Save width={24} height={24} />
					</button>
					<div class="ml-auto">♥ {edge_media_preview_like?.count}</div>
				</div>
				<div class="ige_post-content">
					<div class="ige_post-text">
						<span>{text}</span>
					</div>
					<Comments data={edge_media_preview_comment} />
					<PostFooter comments_disabled={comments_disabled} />
				</div>
			</article>
		)
	}
}
