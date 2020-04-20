import { Fragment, h } from 'preact'
import { Modal } from 'react-responsive-modal'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'preact/compat'

const Story = ({ data, additionalClass }) => {
	const [isOpen, setOpen] = useState(false)

	const {
		owner: { username = '', profile_pic_url = '' },
		seen,
		items,
	} = data

	let imgSrc = ''
	// find unseen media
	for (const element of items) {
		if (element.taken_at_timestamp < seen) continue

		imgSrc = element.display_url
		break
	}

	return (
		<>
			<div class={'g8rEa eju6Z ' + additionalClass}>
				<button class="_1rQDQ " role="menuitem" tabIndex="0" type="button" onClick={() => setOpen(true)}>
					<div class="eN6wV _8BNxr ">
						<img decoding="async" src={imgSrc} />
					</div>
					<div class="eQXXr UaaDv">
						<div class="RR-M- " role="button" tabIndex="0">
							<canvas class="CfWVH" height="66" width="66" style="position: absolute; top: -5px; left: -5px; width: 66px; height: 66px;" />
							<span class="_2dbep " role="link" tabIndex="0" style="width: 56px; height: 56px;">
								<img alt={username + 's Profilbild'} class="_6q-tv" src={profile_pic_url} decoding="async" />
							</span>
						</div>
						<div class="uI5Pp FjOSf">{username}</div>
					</div>
				</button>
			</div>
			{isOpen ? (
				<Modal open onClose={() => setOpen(false)}>
					<iframe src={'/stories/' + username + '/'} class="ige_iframe ige_iframe-fullscreen" />
				</Modal>
			) : null}
		</>
	)
}

export default memo(Story)
