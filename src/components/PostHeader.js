import ImgWorker from './ImgWorker'
import TimeAgo from 'react-timeago'
import { Component, createElement } from 'nervjs'
import { Media } from 'reactstrap'
import { updateCDN } from './Utils'

export default class PostHeader extends Component {
	constructor(props) {
		super(props)

		this.state = {
			date: new Date(Number(props.taken_at + '000')),
		}
	}

	shouldComponentUpdate() {
		return false // carousel?
	}

	render() {
		const { user, code } = this.props
		return (
			<header className="media align-items-center card-block grow-0 pl-2 pr-2">
				<a href={`https://www.instagram.com/${user.username}`} target="_blank" rel="noopener">
					<img src={updateCDN(user.profile_pic_url)} className="img-fluid profile-pic rounded mr-2" decoding="async" />
				</a>
				<Media body>
					<a href={`https://instagram.com/${user.username}`} target="_blank" rel="noopener">
						{user.full_name || user.username}
					</a>
				</Media>
				<a href={`https://www.instagram.com/p/${code}`} target="_blank" rel="noopener">
					<TimeAgo className="text-muted" date={this.state.date} />
				</a>
			</header>
		)
	}
}
