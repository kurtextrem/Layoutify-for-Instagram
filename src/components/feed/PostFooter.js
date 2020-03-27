import PropTypes from 'prop-types'
import { Button, CardFooter } from 'reactstrap'
import { Component, h } from 'preact'

export default class PostFooter extends Component {
	shouldComponentUpdate(nextProps) {
		return this.props.active !== nextProps.active
	}

	render() {
		// const { active, btnClick, defaultClass, toggleClass, parent } = this.props
		return (
			<CardFooter>
				<div>
					<button type="button" class="ige_button">
						<svg aria-label="Gefällt mir" class="_8-yf5 " fill="#262626" height="24" viewBox="0 0 48 48" width="24">
							<path
								clipRule="evenodd"
								d="M34.3 3.5C27.2 3.5 24 8.8 24 8.8s-3.2-5.3-10.3-5.3C6.4 3.5.5 9.9.5 17.8s6.1 12.4 12.2 17.8c9.2 8.2 9.8 8.9 11.3 8.9s2.1-.7 11.3-8.9c6.2-5.5 12.2-10 12.2-17.8 0-7.9-5.9-14.3-13.2-14.3zm-1 29.8c-5.4 4.8-8.3 7.5-9.3 8.1-1-.7-4.6-3.9-9.3-8.1-5.5-4.9-11.2-9-11.2-15.6 0-6.2 4.6-11.3 10.2-11.3 4.1 0 6.3 2 7.9 4.2 3.6 5.1 1.2 5.1 4.8 0 1.6-2.2 3.8-4.2 7.9-4.2 5.6 0 10.2 5.1 10.2 11.3 0 6.7-5.7 10.8-11.2 15.6z"
								fillRule="evenodd"
							/>
						</svg>
					</button>
					<button type="button" class="ige_button">
						<svg aria-label="Speichern" class="_8-yf5 " fill="#262626" height="24" viewBox="0 0 48 48" width="24">
							<path d="M43.5 48c-.4 0-.8-.2-1.1-.4L24 29 5.6 47.6c-.4.4-1.1.6-1.6.3-.6-.2-1-.8-1-1.4v-45C3 .7 3.7 0 4.5 0h39c.8 0 1.5.7 1.5 1.5v45c0 .6-.4 1.2-.9 1.4-.2.1-.4.1-.6.1zM24 26c.8 0 1.6.3 2.2.9l15.8 16V3H6v39.9l15.8-16c.6-.6 1.4-.9 2.2-.9z" />
						</svg>
					</button>
				</div>
				<form class="X7cDz" method="POST">
					<textarea class="ige_textarea" aria-label="Kommentar hinzufügen ..." placeholder="Kommentar hinzufügen ..." autoComplete="off" />
					<button disabled type="submit">
						Posten
					</button>
				</form>
			</CardFooter>
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
