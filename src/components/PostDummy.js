import Dots from './Dots'
//import ImgWorker from './ImgWorker'
import PostFooter from './PostFooter'
import PostHeader from './PostHeader'
import { Button, CardBody, CardText } from 'reactstrap'
import { Component, createElement } from 'nervjs'

const dummyUser = {
	username: '',
	profile_pic_url: '',
	full_name: '',
}
const PostDummy = () => (
	<article className="card">
		<PostHeader user={dummyUser} code={0} taken_at={0} />
		<a className="post--carousel">
			<img />
		</a>
		<CardBody className="overflow-auto p-3 card-body">
			<CardText />
		</CardBody>
		<PostFooter active btnClick={undefined} defaultClass="" toggleClass="" parent="" />
	</article>
)

export default PostDummy
