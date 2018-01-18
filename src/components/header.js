import { Component, createElement } from 'nervjs'
import { Container, Nav, NavItem, NavLink, Navbar, NavbarBrand } from 'reactstrap'
import { HashRouter, Route } from './HashRouter'

export default class Header extends Component {
	constructor(props) {
		super(props)

		this.state = {
			location: location.hash.replace('#/', ''),
		}
	}

	handleLocationChanged(childKey, params, cb) {
		switch (childKey) {
			case 'liked':
				this.setState(prevState => ({ location: 'liked' }))
				cb()
				break
			case 'saved':
				this.setState(prevState => ({ location: 'saved' }))
				cb()
				break
			case 'about':
				this.setState(prevState => ({ location: 'about' }))
				cb()
				break
			default:
				this.setState(prevState => ({ location: 'liked' }))
				cb()
				break
		}
	}

	shouldComponentUpdate() {
		return false
	}

	render() {
		const { location } = this.state
		return (
			<Navbar color="faded" light toggleable className="mb-2 navbar-expand bg-light">
				<HashRouter onLocationChanged={this.handleLocationChanged} />
				<Container>
					<NavbarBrand href="/index.html">Improved for IG</NavbarBrand>
					<Nav navbar className="mr-auto">
						<NavItem>
							<NavLink className={location === 'liked' || location === '' ? 'active' : ''} href="#/">
								Liked <i className="material-icons">favorite</i>
							</NavLink>
						</NavItem>
						<NavItem>
							<NavLink className={location === 'saved' ? 'active' : ''} href="#/saved">
								Saved <i className="material-icons">turned_in</i>
							</NavLink>
						</NavItem>
					</Nav>
					<Nav navbar className="d-none">
						<NavLink className={location === 'liked' ? 'active' : ''} href="#/about">
							Settings <i className="material-icons">cog</i>
						</NavLink>
					</Nav>
					<Nav navbar className="d-none">
						<NavLink className={location === 'liked' ? 'active' : ''} href="#/about">
							Changelog <i className="material-icons">cog</i>
						</NavLink>
					</Nav>
					<Nav navbar>
						<NavLink className={location === 'about' ? 'active' : ''} href="#/about">
							<i className="material-icons">help</i>
						</NavLink>
					</Nav>
				</Container>
			</Navbar>
		)
	}
}
