//import ImgWorker from './ImgWorker'
import PropTypes from 'prop-types'
import TimeAgo from 'react-timeago'
import { Component, h } from 'preact'
import { Media } from 'reactstrap'

export default class PostHeader extends Component {
	constructor(properties) {
		super(properties)
	}

	shouldComponentUpdate() {
		return false // carousel?
	}

	render() {
		const { user, code } = this.props
		const { date } = this.state

		return (
			<header>
				<div role="button" tabIndex="0">
					{/*<canvas class="CfWVH" height="42" width="42" style="position: absolute; top: -5px; left: -5px; width: 42px; height: 42px;" /> @TODO stories */}
					<a href="/USERNAME/">
						<img alt="USERNAME Profilbild" src="PROFILBILD SRC" />
					</a>
				</div>
				<div>
					<div>
						<a href="/USERNAME/">USERNAME</a>
					</div>
					<div>
						<a href="/explore/locations/STADT ID/STADT/">STADT</a>
					</div>
				</div>
				<div>
					<a href="/p/POST ID/">
						<time dateTime="DATETIME" title="DATETIME HUMAN">
							TimeAgo
						</time>
					</a>
				</div>
			</header>
		)
	}
}

PostHeader.propTypes = {}
