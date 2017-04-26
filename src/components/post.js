import { h, render, Component } from 'preact' // eslint-disable-line no-unused-vars
import { CardBlock, CardText, Media } from 'reactstrap'

export default class Post extends Component {
	constructor(props) {
		super(props)
	}

	componentDidMount() {

	}

	render() {
		const data = this.props.data.media === undefined ? this.props.data : this.props.data.media

		const caption = data.caption && data.caption.text
		const user = data.user
		const isVideo = data.media_type === 2

		var media = null, candidate = null
		if (isVideo) {
			candidate = data.video_versions[0]
			media = <video src={data.video_versions[0].url} controls type="video/mp4" width={candidate.width} height={candidate.height} preload="none" className="img-fluid" />
		} else {
			candidate = data.image_versions2.candidates[0]
			media = <img width={candidate.width} height={candidate.height} src={candidate.url} alt={caption} className="img-fluid" />
		}

		const display = user.full_name || user.username

		return (
			<article className="card ml-auto mr-auto">
				<header className="media align-items-center card-block grow-0">
					<a href={`https://instagram.com/${display}`} className="d-flex" target="_blank"><img src={user.profile_pic_url} className="img-fluid" /></a>
					<Media body><a href={`https://instagram.com/${display}`} target="_blank">{display}</a></Media>
				</header>
				{media}
				<CardBlock className="overflow-auto">
					<CardText>{caption}</CardText>
				</CardBlock>
			</article>
		)
	}
}
