import FetchComponent from './FetchComponent'
import PropTypes from 'prop-types'
import bind from 'autobind-decorator'
import { h } from 'preact'

export default class PostFooter extends FetchComponent {
	state = {
		canSubmit: false,
	}

	@bind
	handleSubmit(e) {
		e.preventDefault()

		this.setState({ canSubmit: false }, async () => {
			const response = await this.fetch(`/web/comments/${this.props.id}/add/`, {
				body: new FormData(e.target),
				headers: FetchComponent.getHeaders(true),
				method: 'POST',
			})

			if (response.status === 'ok') {
				this.props.onComment(response)
				e.target.reset()
			} else {
				this.setState({ canSubmit: true })
			}
		})
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return this.state.canSubmit !== nextState.canSubmit
	}

	@bind
	handleInput(e) {
		if (!this.state.canSubmit && e.target.comment_text !== '')
			this.setState({
				canSubmit: true,
			})
	}

	render() {
		const { canSubmit } = this.state

		return this.props.canComment ? (
			<footer class="ige_footer px-12">
				<form class="ige_add_comment" method="POST" onInput={this.handleInput} onSubmit={this.handleSubmit}>
					<input type="hidden" name="replied_to_comment_id" />
					<textarea class="ige_textarea" placeholder="Add comment..." autoComplete="off" name="comment_text" />
					<button type="submit" class="ige_button" disabled={!canSubmit}>
						Post
					</button>
				</form>
			</footer>
		) : null
	}
}

PostFooter.propTypes = {
	id: PropTypes.string.isRequired,
}
