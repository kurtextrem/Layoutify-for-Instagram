//import ImgWorker from './ImgWorker'
import PostFooter from './PostFooter'
import PostHeader from './PostHeader'
import { CardBody, CardText } from 'reactstrap'
import { h } from 'preact'

const dummyUser = {
	username: '',
	profile_pic_url: '',
	full_name: '',
}
const style = { visibility: 'hidden' }
const PostDummy = () => (
	<article class="card">
		<PostHeader user={dummyUser} code={0} taken_at={0} />
		<div class="position-relative post--carousel">
			<a
				href="#"
				target="_blank"
				rel="noopener"
				class="img--wrapper img--placeholder">
				<img
					src=""
					width="400"
					height="400"
					alt=""
					decoding="async"
					data-src=""
					style={style}
				/>
			</a>
		</div>
		<CardBody class="overflow-auto p-3 card-body">
			<CardText />
		</CardBody>
		<PostFooter
			active
			btnClick={undefined}
			defaultClass=""
			toggleClass=""
			parent=""
		/>
	</article>
)

export default PostDummy
