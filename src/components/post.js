import { Button, CardBlock, CardFooter, CardText, Media } from 'reactstrap' // eslint-disable-line no-unused-vars
import { Component, h, render } from 'preact'
import TimeAgo from 'react-timeago'

export default class Post extends Component {
	constructor(props) {
		super(props)

		this.id = this.props.data.id.split('_')[0] // after _ comes the user id, which we don't want in the media id
	}

	componentDidMount() {

	}

	render() {
		var data = this.props.data

		const caption = data.caption && data.caption.text // could be either undefined or null
		const user = data.user
		const isCarousel = data.media_type === 8

		if (isCarousel) { // @todo: Add carousel
			data = data.carousel_media[0]
		}

		var media = null,
			candidate = null
		if (data.media_type === 2) { // video
			candidate = data.video_versions[0]
			media = <video src={data.video_versions[0].url} poster={data.image_versions2.candidates[0].url} controls type="video/mp4" width={candidate.width} height={candidate.height} preload="none" className="img-fluid" />
		} else {
			candidate = data.image_versions2.candidates[0]
			media = <img width={candidate.width} height={candidate.height} src={candidate.url} alt={caption} className="img-fluid" />
		}

		const date = new Date(Number(data.taken_at + '000'))

		return (
			<article className="card ml-auto mr-auto" data-id={this.id}>
				<header className="media align-items-center card-block grow-0 pl-2 pr-2">
					<a href={`https://www.instagram.com/${user.username}`} target="_blank" rel="noopener"><img src={user.profile_pic_url} className="img-fluid profile-pic rounded mr-2" /></a>
					<Media body className="grow-1"><a href={`https://instagram.com/${user.username}`} target="_blank" rel="noopener">{user.full_name}</a></Media>
					<a href={`https://www.instagram.com/p/${data.code}`} target="_blank" rel="noopener">
						<TimeAgo className="text-muted" date={date} />
					</a>
				</header>
				<a href={`https://www.instagram.com/p/${data.code}`} target="_blank" rel="noopener">{media}</a>
				<CardBlock className="overflow-auto">
					<CardText>{caption}</CardText>
				</CardBlock>
				<CardFooter className={this.props.parent}>
					<Button className={'material-icons active action--btn'} color="link" data-id={this.id}>{this.props['data-defaultClass']}</Button>
				</CardFooter>
			</article>
		)
	}
}
