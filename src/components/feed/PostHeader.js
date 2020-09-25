//import ImgWorker from './ImgWorker'
import PropTypes from 'prop-types'
import TimeAgo from 'react-timeago'
import Username from './Username'
import { Component, h } from 'preact'

export default class PostHeader extends Component {
	constructor(properties) {
		super(properties)

		this.state = {
			date: properties.taken_at !== 0 ? new Date(+`${properties.taken_at}000`) : null,
		}
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return false
	}

	render() {
		const {
			user: { username = '', full_name = '', profile_pic_url = '', is_private = false, is_verified = false },
			shortcode,
			location,
		} = this.props
		const { date } = this.state

		const userHref = '/' + username + '/'

		// @todo Portal popup on timestamp|like (#like) click?
		// @todo Add info popover https://i.instagram.com/api/v1/users/ID/info/

		return (
			<header class="ige_header px-12">
				<a class="ige_picture_container" href={userHref} role="button" tabIndex={0}>
					{/*<canvas class="CfWVH" height="42" width="42" style="position: absolute; top: -5px; left: -5px; width: 42px; height: 42px;" /> @TODO stories */}
					<img alt={username + ' Profilbild'} src={profile_pic_url} decoding="async" intrinsicsize="150x150" width="33" height="33" />
				</a>
				<div class="ige_username_container">
					<Username username={username} name={full_name} isVerified={is_verified} isPrivate={is_private} />
					{location !== null && location.has_public_page ? (
						<a class="ige_location" href={'/explore/locations/' + location.id + '/' + location.slug + '/'}>
							{location.name}
						</a>
					) : null}
				</div>
				<div class="f-1-auto text-right">
					<a href={'/p/' + shortcode + '/'}>
						{date !== null ? <TimeAgo date={date} minPeriod={60} title={date.toLocaleString()} /> : null}
					</a>
				</div>
			</header>
		)
	}
}

PostHeader.propTypes = {}
