import { Component, createElement } from 'nervjs'
import { Container, Nav, NavItem, NavLink, Navbar, NavbarBrand } from 'reactstrap'

function getActive(location, key) {
	return location === key ? 'active' : ''
}

export default class Header extends Component {
	shouldComponentUpdate(nextProps) {
		return nextProps.location !== this.props.location
	}

	render() {
		const { location } = this.props
		return (
			<Navbar color="faded" light toggleable className="mb-2 navbar-expand bg-light">
				<Container>
					<NavbarBrand href="/index.html">Improved for IG</NavbarBrand>
					<Nav navbar className="mr-auto">
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
					</Nav>
					<Nav navbar className="d-none">
						<NavLink className={getActive(location, 'options')} href="#/options">
							Options <i className="material-icons">build</i>
						</NavLink>
					</Nav>
					<Nav navbar className="d-none">
						<NavLink className={getActive(location, 'changelog')} href="#/about">
							Changelog <i className="material-icons">description</i>
						</NavLink>
					</Nav>
					<Nav navbar>
						<NavLink className={getActive(location, 'about')} href="#/about">
							<i className="material-icons">help</i>
						</NavLink>
					</Nav>
				</Container>
			</Navbar>
		)
	}
}
