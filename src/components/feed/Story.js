import { Fragment, h } from 'preact'
import { Modal } from 'react-responsive-modal'
import { cancelOpenModalDelayed, closeIframe, openModalDelayed } from '../Utils'
import { memo, useCallback, useState } from 'preact/compat'

/**
 * @param root0
 * @param root0.data
 * @param root0.src
 * @param root0.type
 * @param root0.additionalClass
 */
const Story = ({ data, src, type, additionalClass }) => {
	const [isOpen, setOpen] = useState(false)
	const [renderModal, setRenderModal] = useState(false)
	const [wasOpen, setOpened] = useState(false)

	const closeModal = useCallback(() => {
		setOpened(true)
		setOpen(false)
		setRenderModal(false)
	}, [setOpen, setOpened, setRenderModal])
	const openModal = () => setOpen(true)

	const iframeCloser = useCallback(closeIframe.bind(null, isOpen, closeModal), [isOpen]) // ref callback, calls fn(node)
	const renderModalDelayed = openModalDelayed.bind(null, setRenderModal)

	const {
		owner: { username = '', profile_pic_url = '' },
		has_besties_media,
		id = '',
	} = data

	if (type !== 'GraphStoryImage' && type !== 'GraphStoryVideo') console.info('New story type', type)

	return (
		<>
			<div
				class={`ige_story ${additionalClass} ${wasOpen ? 'black-white' : ''} ${has_besties_media ? 'bestie-story' : ''} ${
					type === 'GraphStoryVideo' ? 'story-video ig_sprite-before' : ''
				}`}
				onMouseOut={cancelOpenModalDelayed}
				onMouseOver={renderModalDelayed}>
				<button class="ige_story_container" onClick={openModal} role="menuitem" tabIndex="0" type="button">
					<div class="ige_story-img">
						<img class="full-img br-6" decoding="async" src={src} />
					</div>
					<div class="ige_story-avatar_container br-6 j-center">
						<div class="d-flex a-center j-center" role="button" tabIndex="0">
							<span class="ig_sprite-before ige_story-avatar" role="link" tabIndex="0">
								<img
									alt={`${username}s Profile Picture`}
									class="full-img br-50"
									decoding="async"
									height={150}
									src={profile_pic_url}
									width={150}
								/>
							</span>
						</div>
						<div class="ige_story-username">{username}</div>
					</div>
				</button>
			</div>
			{isOpen || renderModal ? (
				<Modal center classNames={{ modal: 'modal-story', root: !isOpen ? 'd-none' : undefined }} hidden={isOpen} onClose={closeModal} open>
					<div>
						<iframe class="ige_iframe" ref={iframeCloser} src={`/stories/${username}/${id}/#story`} />
					</div>
				</Modal>
			) : null}
		</>
	)
}

export default memo(Story)

/**
 * @param items
 * @param seen
 */
export function returnUnseenSrc(items, seen) {
	if (items === null) return null

	const src = { src: '', type: '' }
	for (let i = 0; i < items.length; ++i) {
		const element = items[i]
		if (element.taken_at_timestamp <= seen) continue

		src.src = element.display_url
		src.type = element.__typename
		break
	}

	return src
}
