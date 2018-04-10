import { Component, createElement } from 'nervjs'
import { Container, Nav as NavI, NavItem, NavLink, Navbar, NavbarBrand } from 'reactstrap'

function getActive(location, key) {
	return location === key ? 'active' : ''
}

export default class Nav extends Component {
	shouldComponentUpdate(nextProps) {
		return nextProps.location !== this.props.location
	}

	render() {
		const { location } = this.props
		return (
			<Navbar color="faded" light toggleable className="mb-2 navbar-expand bg-light">
				<Container>
					<NavbarBrand href="/index.html">Improved for IG</NavbarBrand>
					<NavI navbar className="grow-1">
						<NavItem>
							<NavLink className={getActive(location, 'liked') || location === '' ? 'active' : ''} href="#/">
								Liked <i className="material-icons">favorite</i>
							</NavLink>
						</NavItem>
						<NavItem>
							<NavLink className={getActive(location, 'saved')} href="#/saved">
								Saved <i className="material-icons">turned_in</i>
							</NavLink>
						</NavItem>

						<NavItem className="ml-auto">
							<NavLink className={getActive(location, 'options')} href="#/options">
								Options <i className="material-icons">build</i>
							</NavLink>
						</NavItem>
						<NavItem className="d-none">
							<NavLink className={getActive(location, 'changelog')} href="#/about">
								Changelog <i className="material-icons">description</i>
							</NavLink>
						</NavItem>
						<NavItem>
							<NavLink className={getActive(location, 'about')} href="#/about">
								<i className="material-icons">help</i>
							</NavLink>
						</NavItem>
					</NavI>
				</Container>
			</Navbar>
		)
	}
}
