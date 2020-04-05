import Comments from './Comments'
import FetchComponent from './FetchComponent'
import Heart from './Heart'
import PlayButton from './PlayButton'
import PostFooter from './PostFooter'
import PostHeader from './PostHeader'
import PostMedia from './PostMedia' // @todo: when handleEvent works again, remove this
import Save from './Save'
import bind from 'autobind-decorator'
import { Fragment, h } from 'preact'
import { markAtsAndHashtags } from '../Utils'

export default class Post extends FetchComponent {
	state = {
		additionalComments: [],
		hasLiked: false,
		hasSaved: false,
	}

	constructor(props) {
		super(props)

		const {
			data: { id = null, viewer_has_liked = false, viewer_has_saved = false },
		} = this.props

		this.state.hasLiked = viewer_has_liked
		this.state.hasSaved = viewer_has_saved
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return true
		//if (this.state.active !== nextState.active) return true
		//return false
	}

	@bind
	handleSave() {
		this.setState(
			prevState => ({ hasSaved: !prevState.hasSaved }),
			async () => {
				const result = await this.post(this.state.hasSaved ? 'save' : 'unsave')
				if (result.status !== 'ok') this.setState({ hasSaved: false })
			}
		)
	}

	@bind
	handleLike() {
		this.setState(
			prevState => ({ hasLiked: !prevState.hasLiked }),
			async () => {
				const result = await this.post(this.state.hasLiked ? 'like' : 'unlike')
				if (result.status !== 'ok') this.setState({ hasLiked: false })
			}
		)
	}

	post(action) {
		const path = action.indexOf('like') !== -1 ? 'likes' : action.replace('un', '') // like -> likes; unsave -> save; ...

		return this.fetch(`/web/${path}/${this.props.data.id}/${action}/`, {
			headers: this.getHeaders(true),
			method: 'POST',
		})
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

	@bind
	handleAddComment(response) {
		this.setState((prevState, props) => ({
			additionalComments: prevState.additionalComments.push({
				node: {
					created_at: response.created_time,
					did_report_as_spam: false,
					id: response.id,
					owner: {
						id: response.from.id,
						profile_pic_url: response.from.profile_picture,
						username: response.from.username,
					},
					text: response.text,
					viewer_has_liked: false,
				},
			}),
		}))
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
				id = null,
				shortcode = '',
				comments_disabled = true,
				edge_media_preview_like = null,
				edge_media_preview_comment = null,
				is_video = false,
				video_view_count = 0,
			},
			data,
			index,
		} = this.props
		const text = edge_media_to_caption?.edges[0]?.node?.text

		const { hasLiked, hasSaved, additionalComments } = this.state

		const comments = edge_media_preview_comment.edges?.concat(additionalComments)

		return (
			<article class={`ige_post ${is_video ? 'ige_post_video' : ''}`} id={`post_${id}`} data-index={index}>
				<PostHeader user={owner} shortcode={shortcode} taken_at={taken_at_timestamp} location={location} />
				<PostMedia data={data} onLike={this.handleLike} />
				<div class="d-flex f-row a-center px-12 ige_actions_container">
					<button type="button" class="ige_button" onClick={this.handleLike}>
						<Heart width={24} height={24} fill="#262626" active={hasLiked} />
					</button>
					<button type="button" class="ige_button" onClick={this.handleSave}>
						<Save width={24} height={24} active={hasSaved} />
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
							<a class="ige_username" title={owner.username} href={'/' + owner.username + '/'}>
								{owner.username}
							</a>
							<span class="pl-2 ige_text">{markAtsAndHashtags(text)}</span>
						</div>
					) : null}
					<Comments data={comments} />
				</div>
				<PostFooter id={id} canComment={!comments_disabled} onComment={this.handleAddComment} />
			</article>
		)
	}
}
