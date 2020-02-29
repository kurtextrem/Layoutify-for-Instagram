import PropTypes from 'prop-types'
import { Button, CardFooter } from 'reactstrap'
import { Component, h } from 'preact'

export default class PostFooter extends Component {
	shouldComponentUpdate(nextProps) {
		return this.props.active !== nextProps.active
	}

	render() {
		const { active, btnClick, defaultClass, toggleClass, parent } = this.props
		return (
			<CardFooter className={parent}>
				<Button
					className={`action--btn ${active ? 'active' : 'inactive'}`}
					color="link"
					onClick={btnClick}>
					<i className="material-icons">
						{active ? defaultClass : toggleClass}
					</i>
				</Button>
			</CardFooter>
		)
	}
}

PostFooter.propTypes = {
	active: PropTypes.bool.isRequired,
	btnClick: PropTypes.func.isRequired,
	defaultClass: PropTypes.string.isRequired,
	toggleClass: PropTypes.string.isRequired,
	parent: PropTypes.string.isRequired,
}
