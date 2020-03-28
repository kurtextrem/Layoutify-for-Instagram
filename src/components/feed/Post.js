import Comments from './Comments'
import Heart from './Heart'
import PlayButton from './PlayButton'
import PostFooter from './PostFooter'
import PostHeader from './PostHeader'
import PostMedia from './PostMedia'
import Save from './Save' // @todo: when handleEvent works again, remove this
import bind from 'autobind-decorator'
import { EventComponent } from '../EventComponent'
import { Fragment, h } from 'preact'

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

	returnLiked(edge_media_preview_like) {
		return (
			<>
				♥{' '}
				{edge_media_preview_like?.edges?.map(v => {
					const username = v.node.username
					return (
						<>
							<a class="" title={username} href={'/' + username + '/'}>
								<img class="ige_picture_container ige_picture_container-small va-text-top" src={v.node.profile_pic_url} decoding="async" />{' '}
								{username}
							</a>
							,{' '}
						</>
					)
				})}
				{edge_media_preview_like?.count?.toLocaleString()}
			</>
		)
	}

	render() {
		/**
		 * Unused keys:
		 * follow_hashtag_info // 1
		 * user.is_verified // !
		 * attribution // !
		 * edge_media_preview_comment.has_next_page, end_cursor // !
		 * "gating_info": null, // !
      "fact_check_overall_rating": null, // !
			"fact_check_information": null, // !
			edge_media_to_sponsor_user // !
			viewer_has_saved_to_collection // !
			viewer_in_photo_of_you
			user:
				followed_by_viewer // !
				is_private				// !
		 
				requested_by_viewer
				blocked_by_viewer
				has_blocked_viewer
				restricted_by_viewer
		 */
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
				viewer_has_liked = false,
				viewer_has_saved = false,
				is_video = false,
				video_view_count = 0,
			},
			data,
		} = this.props
		const text = edge_media_to_caption?.edges[0]?.node?.text

		return (
			<article class={`ige_post ${is_video ? 'ige_post_video' : ''}`} id={`post_${id}`}>
				<PostHeader user={owner} shortcode={shortcode} taken_at={taken_at_timestamp} location={location} />
				<PostMedia data={data} />
				<div class="d-flex f-row a-center px-12 ige_actions_container">
					<button type="button" class="ige_button">
						<Heart width={24} height={24} fill="#262626" active={viewer_has_liked} />
					</button>
					<button type="button" class="ige_button">
						<Save width={24} height={24} active={viewer_has_saved} />
					</button>
					<div class="ml-auto d-block">
						{is_video ? (
							<>
								<PlayButton fill="black" /> {video_view_count.toLocaleString()}
							</>
						) : (
							this.returnLiked(edge_media_preview_like)
						)}
					</div>
				</div>
				<div class="ige_post-content px-12">
					{text !== undefined ? (
						<div class="ige_post-text d-block">
							<a class="" title={owner.username} href={'/' + owner.username + '/'}>
								{owner.username}
							</a>
							<span class="pl-2 ige_text">{text}</span>
						</div>
					) : null}
					<Comments data={edge_media_preview_comment} />
					<PostFooter comments_disabled={comments_disabled} />
				</div>
			</article>
		)
	}
}
