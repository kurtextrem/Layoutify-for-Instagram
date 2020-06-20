//import ImgWorker from './ImgWorker'
import PropTypes from 'prop-types'
import TimeAgo from 'react-timeago'
import { Component, h } from 'preact'
import { Media } from 'reactstrap'
import { updateCDN } from './Utils'

export default class PostHeader extends Component {
	constructor(properties) {
		super(properties)

		this.state = {
			date: properties.taken_at !== 0 ? new Date(+`${properties.taken_at}000`) : null,
		}
	}

	shouldComponentUpdate() {
		return false // carousel?
	}

	render() {
		const { user, code } = this.props
		const { date } = this.state

		return (
			<header class="d-flex media align-items-center card-block grow-0 pl-2 pr-2">
				<a href={`https://www.instagram.com/${user.username}`} target="_blank" rel="noopener">
					<img src={updateCDN(user.profile_pic_url)} class="img-fluid profile-pic rounded mr-2" alt="❌" decoding="async" />
				</a>
				<Media body class="mr-auto">
					<a href={`https://instagram.com/${user.username}`} target="_blank" rel="noopener">
						{user.full_name || user.username}
					</a>
				</Media>
				<span class="text-muted">posted&nbsp;</span>
				<a href={`https://www.instagram.com/p/${code}`} target="_blank" rel="noopener">
					{date !== null ? <TimeAgo class="text-muted" date={date} /> : <time class="text-muted" />}
				</a>
			</header>
		)
	}
}

PostHeader.propTypes = {
	code: PropTypes.string.isRequired,
	taken_at: PropTypes.number.isRequired,
	user: PropTypes.shape({
		full_name: PropTypes.string,
		profile_pic_url: PropTypes.string.isRequired,
		username: PropTypes.string.isRequired,
	}).isRequired,
}
