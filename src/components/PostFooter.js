import { Button, CardFooter } from 'reactstrap'
import { Component, createElement } from 'nervjs'

export default class PostFooter extends Component {
	shouldComponentUpdate(nextProps) {
		if (this.props.active !== nextProps.active) return true
		return false
	}

	render() {
		const { active, btnClick, defaultClass, toggleClass, parent } = this.props
		return (
			<CardFooter className={parent}>
				<Button className={'action--btn ' + (active ? 'active' : 'inactive')} color="link" onClick={btnClick}>
					<i className="material-icons">{active ? defaultClass : toggleClass}</i>
				</Button>
			</CardFooter>
		)
	}
}
