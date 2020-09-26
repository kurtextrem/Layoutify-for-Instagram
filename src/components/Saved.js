import Loading from './Loading'
import NavPortal from './NavPortal'
import PostsContainer from './PostsContainer'
import bind from 'autobind-decorator'
import { Component, h } from 'preact'
import { NavItem, NavLink } from 'reactstrap'
import { Storage, fetchFromBackground } from './Utils'
import { Suspense } from 'preact/compat'
import { getActive } from './Nav'

export default class Saved extends Component {
	state = { items: [] }

	@bind
	async getItems() {
		// @TODO Implement more_available
		const now = Date.now()
		const collections = await Storage.get('collections', null) // {items: [], date: int}

		if (collections === null || now - collections.date > 300000) {
			// 5min
			const json = await fetchFromBackground('private_web', 'collections/list/')
			Storage.set('collections', { date: now, items: json.items })
			this.setItems(json.items)
			return
		}
		//const req = await fetch('../collectionList.json')
		//const json = await req.json()
		this.setItems(collections.items)
	}

	setItems(items) {
		this.setState({ items })
	}

	componentDidMount() {
		this.getItems()
	}

	shouldComponentUpdate(nextProps, nextState) {
		const id = this.props.id
		if (nextState.items.length !== this.state.items.length) return true
		if (id === nextProps.id) return false
		return (nextProps.id === undefined && id !== undefined) || (nextProps.id !== undefined && id === undefined) || nextProps.id() !== id()
	}

	@bind
	renderCollection() {
		const items = this.state.items,
			result = [],
			nav = []
		for (let i = 0; i < items.length; ++i) {
			const item = items[i]
			const link = `#/collection/${item.collection_id}`
			result.push(
				<a key={item.collection_id} href={link} class="collection">
					<div class="collection--image">
						<img src={item.cover_media?.image_versions2?.candidates?.[0].url} alt={item.collection_name} />
					</div>
					<div class="collection--title">{item.collection_name}</div>
					<div class="collection--footer">{item.collection_media_count}</div>
				</a>
			)
			nav.push(
				<NavItem>
					<NavLink class={getActive(location.hash, link)} href={link}>
						{item.collection_name}
					</NavLink>
				</NavItem>
			)
		}

		return [result, nav]
	}

	render() {
		const id = this.props.id,
			result = this.renderCollection()

		if (id === undefined)
			return (
				<Suspense fallback={<Loading />}>
					<div class="d-flex w-100 justify-content-center flex-wrap">
						{result[0]}
						<i class="w-100 text-center">(middle- or right-click to open a collection in a new tab)</i>
						<PostsContainer id="saved" defaultClass="turned_in" toggleClass="turned_in_not" preload={0} />
						<NavPortal>{result[1]}</NavPortal>
					</div>
				</Suspense>
			)

		return <PostsContainer id={'collection/' + id()} defaultClass="turned_in" toggleClass="turned_in_not" preload={5} />
	}
}
