import Comments from './Comments'
import FetchComponent from './FetchComponent'
import PropTypes from 'prop-types'
import bind from 'autobind-decorator'
import { Fragment, createRef, h } from 'preact'

export default class PostFooter extends FetchComponent {
	formRef = createRef()

	state = {
		additionalComments: [],
		canSubmit: false,
	}

	post() {
		this.setState({ canSubmit: false }, async () => {
			const response = await this.fetch(`/web/comments/${this.props.id}/add/`, {
				body: new FormData(this.formRef.current),
				headers: this.getHeaders(true),
				method: 'POST',
			})

			if (response.status === 'ok')
				this.setState((prevState, props) => ({
					additionalComments: prevState.additionalComments.push({
						node: {
							created_at: response.created_time,
							did_report_as_spam: false,
							id: response.id,
							owner: {
								id: response.from.id,
								profile_pic_url: response.from.profile_picture,
								username: response.from.username,
							},
							text: response.text,
							viewer_has_liked: false,
						},
					}),
					canSubmit: true,
				}))
		})
	}

	@bind
	handleInput(e) {
		if (!this.state.canSubmit && e.target.comment_text !== '')
			this.setState({
				canSubmit: true,
			})
	}

	render() {
		const { canSubmit, additionalComments } = this.state

		const comments = this.props.comments.edges?.concat(additionalComments)
		return (
			<>
				<Comments data={comments} />
				{this.props.canComment ? (
					<footer class="ige_footer px-12">
						<form class="ige_add_comment" method="POST" onInput={this.handleInput} ref={this.formRef}>
							<input type="hidden" name="replied_to_comment_id" />
							<textarea class="ige_textarea" placeholder="Add comment..." autoComplete="off" name="comment_text" />
							<button type="submit" class="ige_button" disabled={!canSubmit}>
								Post
							</button>
						</form>
					</footer>
				) : null}
			</>
		)
	}
}

PostFooter.propTypes = {
	id: PropTypes.string.isRequired,
}
