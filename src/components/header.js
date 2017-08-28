import { Component } from 'preact'
import { Container, Nav, NavItem, Navbar, NavbarBrand } from 'reactstrap'
import { Link } from 'preact-router/match'

export default class Header extends Component {
	shouldComponentUpdate() {
		return false
	}

	render() {
		return (
			<Navbar color="faded" light toggleable className="mb-2 navbar-expand bg-light">
				<Container>
					<NavbarBrand href="/">Improved for IG</NavbarBrand>
					<Nav navbar className="mr-auto">
						<NavItem className="">
							<Link activeClassName="active" href="/" className="nav-link">
								Liked <i className="material-icons">favorite</i>
							</Link>
						</NavItem>
						<NavItem className="">
							<Link activeClassName="active" href="/saved" className="nav-link">
								Saved <i className="material-icons">turned_in</i>
							</Link>
						</NavItem>
					</Nav>
					<Nav navbar className="">
						<Link activeClassName="active" href="/about" className="nav-link">
							<i className="material-icons">help</i>
						</Link>
					</Nav>
				</Container>
			</Navbar>
		)
	}
}
