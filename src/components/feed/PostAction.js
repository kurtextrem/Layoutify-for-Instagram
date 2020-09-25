import Heart from './Heart'
import PlayButton from './PlayButton'
import PropTypes from 'prop-types'
import Save from './Save'
import Share from './Share'
import Username from './Username'
import bind from 'autobind-decorator'
import { Component, Fragment, h } from 'preact'
import { Modal } from 'react-responsive-modal'
import { shallowDiffers } from '../Utils'

export default class PostAction extends Component {
	state = { open: false }

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

	@bind
	handleShare() {
		this.openModal()
	}

	@bind
	openModal() {
		this.setState({ open: true })
	}

	@bind
	closeModal() {
		this.setState({ open: false })
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return nextState.open !== this.state.open || shallowDiffers(nextProperties, this.props)
	}

	render() {
		const { onLike, onSave, hasLiked, hasSaved, shortcode, like_media, is_video, video_view_count, enableShare } = this.props

		const count = is_video ? video_view_count : like_media?.count

		const { open } = this.state

		return (
			<div class="ige_actions_container d-flex f-row a-center px-12">
				<button type="button" class="ige_button" onClick={onLike}>
					<Heart size={24} fill="#262626" active={hasLiked} />
				</button>
				{enableShare ? (
					<button type="button" class="ige_button" onClick={this.handleShare}>
						<Share size={24} />
					</button>
				) : null}
				<button type="button" class="ige_button" onClick={onSave}>
					<Save size={24} active={hasSaved} />
				</button>
				<div class="ml-auto d-block ige_action_amount">
					<a href={'/p/' + shortcode + '/'} class="color-inherit">
						<>
							{is_video ? null : '♥ '}
							{is_video ? <PlayButton fill="black" /> : like_media?.edges?.map(this.returnLiked)}
							{' ' + count?.toLocaleString()}
						</>
					</a>
				</div>
				{open ? (
					<Modal open onClose={this.closeModal} center>
						<iframe src={'/p/' + shortcode + '/#share'} class="ige_iframe" />
					</Modal>
				) : null}
			</div>
		)
	}
}

PostAction.propTypes = {}
