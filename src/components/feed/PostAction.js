import Heart from './Heart'
import PlayButton from './PlayButton'
import PropTypes from 'prop-types'
import Save from './Save'
import Username from './Username'
import { Component, Fragment, h } from 'preact'
import { shallowDiffers } from '../Utils'

export default class PostAction extends Component {
	returnLiked(value, index) {
		const node = value.node,
			username = node.username

		return (
			<Username username={username} className="ige_comma" key={node.id}>
				<img
					class="ige_picture_container ige_picture_container-small va-text-top"
					src={node.profile_pic_url}
					alt={username + ' Profilbild'}
					decoding="async"
					intrinsicsize="150x150"
					width="20"
					height="20"
				/>
			</Username>
		)
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return shallowDiffers(nextProperties, this.props)
	}

	render() {
		const { onLike, onSave, hasLiked, hasSaved, shortcode, like_media, is_video, video_view_count } = this.props

		const count = is_video ? video_view_count : like_media?.count

		// @todo: Write share dialogue for IG DMs / Twitter / FB etc

		return (
			<div class="ige_actions_container d-flex f-row a-center px-12">
				<button type="button" class="ige_button" onClick={onLike}>
					<Heart width={24} height={24} fill="#262626" active={hasLiked} />
				</button>
				<button type="button" class="ige_button" onClick={onSave}>
					<Save width={24} height={24} active={hasSaved} />
				</button>
				<div class="ml-auto d-block ige_action_amount">
					<a href={'/p/' + shortcode + '/'} class="color-inherit">
						<>
							{is_video ? '' : '♥ '}
							{is_video ? <PlayButton fill="black" /> : like_media?.edges?.map(this.returnLiked)}
							{' ' + count?.toLocaleString()}
						</>
					</a>
				</div>
			</div>
		)
	}
}

PostAction.propTypes = {}
