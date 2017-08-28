import { Button, CardFooter } from 'reactstrap'
import { Component } from 'preact'

export default class PostFooter extends Component {
	shouldComponentUpdate(nextProps) {
		if (this.props.active !== nextProps.active) return true
		return false
	}

	render(props) {
		const { active, btnClick, defaultClass, toggleClass, parent } = props
		return (
			<CardFooter className={parent}>
				<Button className={'action--btn ' + (active ? 'active' : 'inactive')} color="link" onClick={btnClick}>
					<i className="material-icons">
						{active ? defaultClass : toggleClass}
					</i>
				</Button>
			</CardFooter>
		)
	}
}
