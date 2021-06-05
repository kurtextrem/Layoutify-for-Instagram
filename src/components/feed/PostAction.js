import Heart from './Heart'
import PlayButton from './PlayButton'
import PropTypes from 'prop-types'
import Save from './Save'
import Share from './Share'
import Username from './Username'
import { Fragment, h } from 'preact'
import { Modal } from 'react-responsive-modal'
import { memo, useCallback, useState } from 'preact/compat'
import { closeIframe, openModalDelayed, cancelOpenModalDelayed } from '../Utils'

function returnLiked(value, index) {
	const node = value.node,
		username = node.username

	return (
		<Username username={username} className="ige_comma" key={node.id}>
			<img
				class="ige_picture_container ige_picture_container-small va-text-top"
				src={node.profile_pic_url}
				alt={username + ' Profilbild'}
				decoding="async"
				width="20"
				height="20"
			/>
		</Username>
	)
}

function PostAction({ onLike, onSave, hasLiked, hasSaved, shortcode, like_media, is_video, video_view_count, enableShare }) {
	const [isOpen, setOpen] = useState(false)
	const [renderModal, setRenderModal] = useState(false)

	const closeModal = useCallback(() => {
		setOpen(false)
		setRenderModal(false)
	}, [setOpen, setRenderModal])
	const openModal = () => setOpen(true)

	const iframeCloser = useCallback(closeIframe.bind(null, isOpen, closeModal), [isOpen]) // ref callback, calls fn(node)
	const renderModalDelayed = openModalDelayed.bind(null, setRenderModal)

	const count = is_video ? video_view_count : like_media?.count

	return (
		<div class="ige_actions_container d-flex f-row a-center px-12">
			<button type="button" class="ige_button" onClick={onLike}>
				<Heart size={24} fill="#262626" active={hasLiked} />
			</button>
			{enableShare ? (
				<button type="button" class="ige_button" onClick={openModal} onMouseOver={renderModalDelayed} onMouseOut={cancelOpenModalDelayed}>
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
						{is_video ? <PlayButton fill="black" /> : like_media?.edges?.map(returnLiked)}
						{' ' + count?.toLocaleString()}
					</>
				</a>
			</div>
			{isOpen || renderModal ? (
				<Modal open onClose={closeModal} center classNames={{ root: !isOpen ? 'd-none' : undefined }}>
					<iframe src={'/p/' + shortcode + '/#share'} class="ige_iframe" ref={iframeCloser} />
				</Modal>
			) : null}
		</div>
	)
}

PostAction.propTypes = {}

export default memo(PostAction)
