import PropTypes from 'prop-types'
import { h } from 'preact'
import { memo } from 'preact/compat'

const Username = props => {
	const username = props.username,
		name = props.name || username,
		className = props.className
	return (
		<a class={'ige_username ' + (className !== undefined ? className : '')} title={username} href={'/' + username + '/'}>
			{props.children}
			{name}
		</a>
	)
}

Username.propTypes = {}

export default memo(Username)
