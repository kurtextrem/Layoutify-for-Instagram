//import ImgWorker from './ImgWorker'
import PostHeader from './PostHeader'
import { CardBody, CardText } from 'reactstrap'
import { h } from 'preact'

const dummyUser = {
	full_name: '',
	profile_pic_url: '',
	username: '',
}
const style = { visibility: 'hidden' }
const PostDummy = () => (
	<article class="card">
		<PostHeader user={dummyUser} code="" taken_at={0} />
		<div class="position-relative post--carousel">
			<a href="#" target="_blank" rel="noopener" class="img--wrapper img--placeholder">
				<img src="" width="400" height="400" alt="" decoding="async" data-src="" style={style} />
			</a>
		</div>
		<CardBody class="overflow-auto p-3 card-body">
			<CardText />
		</CardBody>
	</article>
)

export default PostDummy
