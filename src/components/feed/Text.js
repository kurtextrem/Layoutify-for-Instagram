import PropTypes from 'prop-types'
import { h } from 'preact'
import { markAtsAndHashtags } from '../Utils'
import { memo } from 'preact/compat'

const replacer = (tag, name) => (
	<a href={(tag === '#' ? '/explore/tags' : '') + '/' + name + '/'}>
		{tag}
		{name}
	</a>
)

const Text = props => <span class="pl-2 ige_text">{markAtsAndHashtags(props.text, replacer)}</span>

export default memo(Text)
