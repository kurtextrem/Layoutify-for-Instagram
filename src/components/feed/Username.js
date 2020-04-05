import PropTypes from 'prop-types'
import { Component, h } from 'preact'

const Username = props => {
	const username = props.username,
		name = props.name || username
	return (
		<a class="ige_username" title={username} href={'/' + username + '/'}>
			{name}
		</a>
	)
}

export default Username
