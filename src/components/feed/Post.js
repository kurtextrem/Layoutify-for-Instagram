//import ImgWorker from './ImgWorker'
import PostFooter from './PostFooter'
import PostHeader from './PostHeader'
import PostMedia from './PostMedia'
import bind from 'autobind-decorator'
import { CardBody, CardText } from 'reactstrap'
import { EventComponent } from '../EventComponent'
import { h } from 'preact' // @todo: when handleEvent works again, remove this

export default class Post extends EventComponent {
	constructor(props) {
		super(props)

		this.carouselLen = props.data.edge_sidecar_to_children?.edges?.length ?? 0
		this.preloaded = false
		this.timeout = 0
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return true
		//if (this.state.active !== nextState.active) return true
		//return false
	}

	render() {
		const {
			data: {
				owner = {},
				taken_at_timestamp = 0,
				location = null,
				edge_media_to_caption = null,
				id = 0,
				shortcode = '',
				comments_disabled = true,
			},
			data,
		} = this.props
		const text = edge_media_to_caption?.edges[0]?.node?.text

		return (
			<article class="ige_post" id={`post_${id}`}>
				<PostHeader user={owner} shortcode={shortcode} taken_at={taken_at_timestamp} location={location} />
				<PostMedia data={data} />
				<CardBody class="overflow-auto p-3 card-body">
					<CardText>{text}</CardText>
				</CardBody>
				<PostFooter comments_disabled={comments_disabled} />
			</article>
		)
	}
}
