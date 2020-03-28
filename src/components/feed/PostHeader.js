//import ImgWorker from './ImgWorker'
import PropTypes from 'prop-types'
import TimeAgo from 'react-timeago'
import { Component, h } from 'preact'
import { Media } from 'reactstrap'

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
		const {
			user: { username = '', full_name = '', profile_pic_url = '' },
			user,
			shortcode,
			taken_at,
			location,
		} = this.props
		const { date } = this.state

		const userHref = '/' + username + '/'

		return (
			<header class="ige_header px-12">
				<div class="a-center" role="button" tabIndex="0">
					{/*<canvas class="CfWVH" height="42" width="42" style="position: absolute; top: -5px; left: -5px; width: 42px; height: 42px;" /> @TODO stories */}
					<a class="ige_picture_container d-block" href={userHref}>
						<img class="full-img" alt={username + ' Profilbild'} src={profile_pic_url} decoding="async" />
					</a>
				</div>
				<div class="ige_username_container">
					<a class="ige_username" href={userHref} title={username}>
						{full_name || username}
					</a>
					{location !== null && location.has_public_page ? (
						<a class="ige_location" href={'/explore/locations/' + location.id + '/' + location.slug + '/'}>
							{location.name}
						</a>
					) : null}
				</div>
				<div class="ml-auto">
					<a href={'/p/' + shortcode + '/'}>
						{date !== null ? <TimeAgo date={date} minPeriod={60} title={date.toLocaleString()} /> : null}
					</a>
				</div>
			</header>
		)
	}
}

PostHeader.propTypes = {}
