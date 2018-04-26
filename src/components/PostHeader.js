//import ImgWorker from './ImgWorker'
import PropTypes from 'prop-types'
import TimeAgo from 'react-timeago'
import { Component, createElement } from 'nervjs'
import { Media } from 'reactstrap'
import { updateCDN } from './Utils'

export default class PostHeader extends Component {
	constructor(props) {
		super(props)

		this.state = {
			date: props.taken_at !== 0 ? new Date(+`${props.taken_at}000`) : null,
		}
	}

	shouldComponentUpdate() {
		return false // carousel?
	}

	render() {
		const { user, code } = this.props
		const { date } = this.state

		return (
			<header className="media align-items-center card-block grow-0 pl-2 pr-2">
				<a href={`https://www.instagram.com/${user.username}`} target="_blank" rel="noopener">
					<img src={updateCDN(user.profile_pic_url)} className="img-fluid profile-pic rounded mr-2" alt="❌" decoding="async" />
				</a>
				<Media body>
					<a href={`https://instagram.com/${user.username}`} target="_blank" rel="noopener">
						{user.full_name || user.username}
					</a>
				</Media>
				<a href={`https://www.instagram.com/p/${code}`} target="_blank" rel="noopener">
					{date !== null ? <TimeAgo className="text-muted" date={date} /> : <time className="text-muted" />}
				</a>
			</header>
		)
	}
}

PostHeader.propTypes = {
	user: PropTypes.shape({
		username: PropTypes.string.isRequired,
		profile_pic_url: PropTypes.string.isRequired,
		full_name: PropTypes.string,
	}).isRequired,
	taken_at: PropTypes.number.isRequired,
	code: PropTypes.func.isRequired,
}
