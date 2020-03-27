import PropTypes from 'prop-types'
import { Component, h } from 'preact'

export default class PostFooter extends Component {
	shouldComponentUpdate(nextProps) {
		return this.props.active !== nextProps.active
	}

	render() {
		// const { active, btnClick, defaultClass, toggleClass, parent } = this.props
		return (
			<footer class="ige_footer">
				<form class="X7cDz" method="POST">
					<textarea class="ige_textarea" aria-label="Kommentar hinzufügen ..." placeholder="Kommentar hinzufügen ..." autoComplete="off" />
					<button disabled type="submit">
						Posten
					</button>
				</form>
			</footer>
		)
	}
}

PostFooter.propTypes = {
	active: PropTypes.bool.isRequired,
	btnClick: PropTypes.func.isRequired,
	defaultClass: PropTypes.string.isRequired,
	parent: PropTypes.string.isRequired,
	toggleClass: PropTypes.string.isRequired,
}
