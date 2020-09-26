import { Component, h } from 'preact'
import { Container, Nav as NavI, NavItem, NavLink, Navbar } from 'reactstrap'

/**
 *
 */
export function getActive(location, key) {
	return location === key ? 'active' : ''
}

export default class Nav extends Component {
	shouldComponentUpdate(nextProps) {
		return nextProps.location !== this.props.location
	}

	render() {
		const { location } = this.props
		return (
			<Navbar color="faded" light toggleable class="mb-2 navbar-expand bg-light">
				<Container>
					<a href="/index.html">
						<img
							src="img/icon-128.png"
							alt="Improved for IG"
							decoding="async"
							id="logo"
							onLoad={module.hot ? () => performance.mark('logo') : undefined}
						/>
					</a>

					<NavI navbar class="grow-1">
						<NavItem>
							<NavLink class={getActive(location, 'liked') || location === '' ? 'active' : ''} href="#/">
								❤️ Likes
							</NavLink>
						</NavItem>
						<NavItem>
							<NavLink class={getActive(location, 'saved')} href="#/saved">
								🔖 Collections
							</NavLink>
						</NavItem>
						<div id="portal" class="d-flex" />
						{/* this is bad code, don't copy it. We abuse Portals to render something here, which is deep down the tree. */}

						<NavItem class="ml-auto">
							<NavLink class={getActive(location, 'options')} href="#/options">
								⚙️ Options
							</NavLink>
						</NavItem>
						<NavItem>
							<NavLink class={getActive(location, 'about')} href="#/about">
								❔ About
							</NavLink>
						</NavItem>
					</NavI>
				</Container>
			</Navbar>
		)
	}
}
