import { Component, h } from 'preact' // eslint-disable-line no-unused-vars
import { Media } from 'reactstrap'
import TimeAgo from 'react-timeago'

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

	render(props, state) {
		const user = props.user
		return (
			<header className="media align-items-center card-block grow-0 pl-2 pr-2">
				<a href={`https://www.instagram.com/${user.username}`} target="_blank" rel="noopener">
					<img src={user.profile_pic_url} className="img-fluid profile-pic rounded mr-2" />
				</a>
				<Media body>
					<a href={`https://instagram.com/${user.username}`} target="_blank" rel="noopener">
						{user.full_name || user.username}
					</a>
				</Media>
				<a href={`https://www.instagram.com/p/${props.code}`} target="_blank" rel="noopener">
					<TimeAgo className="text-muted" date={state.date} />
				</a>
			</header>
		)
	}
}
