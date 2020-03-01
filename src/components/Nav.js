import { Component, h } from 'preact'
import { Container, Nav as NavI, NavItem, NavLink, Navbar } from 'reactstrap'

export default class Nav extends Component {
	static getActive(location, key) {
		return location === key ? 'active' : ''
	}

	shouldComponentUpdate(nextProps) {
		return nextProps.location !== this.props.location
	}

	render() {
		const { location } = this.props
		return (
			<Navbar
				color="faded"
				light
				toggleable
				class="mb-2 navbar-expand bg-light">
				<Container>
					<a href="/index.html">
						<img
							src="img/icon-128.png"
							alt="Improved for IG"
							decoding="async"
							id="logo"
							onLoad={module.hot ? performance.mark('logo') : undefined}
						/>
					</a>

					<NavI navbar class="grow-1">
						<NavItem>
							<NavLink
								class={
									Nav.getActive(location, 'liked') || location === ''
										? 'active'
										: ''
								}
								href="#/">
								Liked <i class="material-icons">favorite</i>
							</NavLink>
						</NavItem>
						<NavItem>
							<NavLink class={Nav.getActive(location, 'saved')} href="#/saved">
								Collections <i class="material-icons">turned_in</i>
							</NavLink>
						</NavItem>

						<NavItem class="ml-auto">
							<NavLink
								class={Nav.getActive(location, 'options')}
								href="#/options">
								Options <i class="material-icons">build</i>
							</NavLink>
						</NavItem>
						<NavItem>
							<NavLink class={Nav.getActive(location, 'about')} href="#/about">
								<i class="material-icons">help</i>
							</NavLink>
						</NavItem>
					</NavI>
				</Container>
			</Navbar>
		)
	}
}
