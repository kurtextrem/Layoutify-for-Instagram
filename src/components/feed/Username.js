import PropTypes from 'prop-types'
import { h } from 'preact'
import { memo } from 'preact/compat'

const Username = props => {
	const { username, name, className, isPrivate, isVerified } = props
	return (
		<a class={'ige_username ' + (className !== undefined ? className : '')} title={username} href={'/' + username + '/'}>
			{props.children}
			{name || username}
			{isVerified ? <i class="ig_sprite verified" title="Is Verified Account" /> : null}
			{isPrivate ? (
				<span class="ige_private" role="img" aria-label="Private" title="Is Private Account">
					🔒
				</span>
			) : null}
		</a>
	)
}

Username.propTypes = {}

export default memo(Username)
