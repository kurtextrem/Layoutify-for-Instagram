import { h } from 'preact'
import { memo } from 'preact/compat'

const User = props => (
	<svg class="ige_userIcon" viewBox="0 0 48 48" width={props.size} height={props.size} fill={props.fill}>
		<path d="M24 26.7c-7.4 0-13.4-6-13.4-13.4S16.6 0 24 0s13.4 6 13.4 13.4-6 13.3-13.4 13.3zM45 48H3c-.8 0-1.5-.7-1.5-1.5v-3c0-7.4 6-13.4 13.4-13.4h18.3c7.4 0 13.4 6 13.4 13.4v3c-.1.8-.8 1.5-1.6 1.5z" />
	</svg>
)

export default memo(User)
