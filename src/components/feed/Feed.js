import FetchComponent from './FetchComponent'
import Loading from '../Loading'
import Post from './Post'
import bind from 'autobind-decorator'
import withIntersectionObserver from './withIntersectionObserver'
import { Fragment, createRef, h } from 'preact'
import { shallowDiffers } from '../Utils'
import { virtualScrollDriver } from './DynamicVirtualScroll'

class Feed extends FetchComponent {
	itemRefs = new Map()

	itemSize = new Map()

	itemWidth = 0

	raf = null

	viewport = createRef()

	viewportHeight = 0

	viewportWidth = 0

	virtualState = {}

	state = {
		cursor: '',
		hasNextPage: false,
		isNextPageLoading: false,
		items: window.__additionalData?.feed?.data?.user?.edge_web_feed_timeline?.edges || [],
	}

	static fetchObj = {
		cached_feed_item_ids: [],
		fetch_comment_count: 4,
		fetch_like: 3,
		fetch_media_item_count: 12,
		fetch_media_item_cursor: '',
		has_stories: false, // @todo nice feature?
		has_threaded_comments: true,
	}

	constructor() {
		super()

		this.queryID = '6b838488258d7a4820e48d209ef79eb1' // feed query id

		const nextPage = window.__additionalData?.feed?.data?.user?.edge_web_feed_timeline?.page_info.end_cursor
		if (nextPage !== undefined) {
			this.state.hasNextPage = true
			this.state.cursor = nextPage
		}

		this.LoadingWithObserver = withIntersectionObserver(Loading, {
			root: document.getElementById('ige_feed'),
			rootMargin: '0px 0px 1400px 0px',
		})
	}

	componentDidUpdate() {
		this.driver()
	}

	componentDidMount() {
		this.viewportHeight = this.viewport.current.clientHeight
		this.viewportWidth = this.viewport.current.clientWidth
		this.componentDidUpdate()
	}

	@bind
	getRenderedItemHeight(index) {
		if (this.itemSize.has(index)) return this.itemSize.get(index)

		if (this.itemRefs.has(index)) {
			const item = this.itemRefs.get(index)
			let height
			if (item.getBoundingClientRect !== undefined) height = item.getBoundingClientRect().height
			else height = item?.base.getBoundingClientRect().height

			this.itemSize.set(index, height)
			return height
		}

		return null
	}

	getRenderedItemWidth() {
		if (this.itemWidth === 0) {
			this.itemWidth = this.itemRefs.get(0)?.base.getBoundingClientRect().width
		}
		return this.itemWidth
	}

	@bind
	loadNextPage() {
		if (this.state.isNextPageLoading) return

		this.setState({ isNextPageLoading: true }, () => {
			this.fetchNext()
		})
	}

	async fetchNext() {
		const obj = { ...Feed.fetchObj }
		obj.fetch_media_item_cursor = this.state.cursor

		const response = await this.fetch('/graphql/query/?query_hash=' + this.queryID + '&variables=' + JSON.stringify(obj), {
			headers: this.getHeaders(false),
		})

		if (response.status !== 'ok') {
			this.setState({ hasNextPage: false, isNextPageLoading: false })
			return
		}

		const nextCursor = response?.data?.user?.edge_web_feed_timeline?.page_info.end_cursor

		this.setState((prevState, props) => ({
			cursor: nextCursor,
			hasNextPage: nextCursor !== undefined,
			isNextPageLoading: false,
			items: prevState.items.concat(response.data.user.edge_web_feed_timeline.edges),
		}))
	}

	@bind
	steal(index) {
		// we need to scroll on load once to get the item & steal it after
		// FIXME: Remove this empty box once virtual list supports flex
		return <div class="ige_post ige_stories_after" key={'i' + index} data-index={index} ref={e => void this.itemRefs.set(index, e)} />
	}

	@bind
	renderItem(i) {
		const current = this.state.items[i]
		return current.node.__typename === 'GraphStoriesInFeedItem' ? this.steal(i) : <Post data={current.node} key={current.node.shortcode} />
	}

	renderItems(start, count) {
		const items = this.state.items,
			arr = [],
			len = Math.min(start + count, items.length)
		for (let i = start; i < len; ++i) {
			const current = items[i]
			arr.push(
				current.node.__typename === 'GraphStoriesInFeedItem' ? (
					this.steal(i)
				) : (
					<Post data={current.node} key={current.node.shortcode} ref={e => void this.itemRefs.set(i, e)} index={i} />
				)
			)
		}

		return arr
	}

	render() {
		const { hasNextPage, isNextPageLoading, items } = this.state

		// Only load 1 page of items at a time.
		// Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
		const loadMoreItems = isNextPageLoading ? () => {} : this.loadNextPage

		const LoadingWithObserver = this.LoadingWithObserver

		//return <DynamicVirtualScrollExample />

		//return <VirtualScrollList totalItems={data.length} renderItem={this.renderItem} minRowHeight={500} />

		// @TODO Clone stories node & put in here; stories appear after 8th post usually, tag type div
		// style={{ height: this.state.targetHeight + 'px' }}
		// @TODO Split this up in more elements which take props -> unchanged props = unneeded to render

		/*return (
			<div class="ige_virtual">
				{items.map(v => (v.node.__typename === 'GraphStoriesInFeedItem' ? this.steal() : <Post data={v.node} key={v.node.shortcode} />))}
				{!hasNextPage && !isNextPageLoading ? <div>End of feed</div> : <LoadingWithObserver onVisible={loadMoreItems} />}
			</div>
		)*/

		const {
			topPlaceholderHeight,
			itemBottomCount,
			firstBottomItem,
			bottomPlaceholderHeight,
			containerHeight,
			itemMainCount,
			firstMainItem,
			firstOverscanTopItem,
			overscanTopCount,
			firstOverscanBottomItem,
			overscanBottomCount,
		} = this.virtualState

		// @todo use padding style={{ paddingBottom: bottomPlaceholderHeight + 'px', paddingTop: topPlaceholderHeight + 'px' }}
		return (
			<div ref={this.viewport} onScroll={this.handleScroll} class="ige_virtual">
				<div class="ige_virtual_container" data-style={`height: ${containerHeight} + 'px'`}>
					<div style={{ contain: 'strict', height: topPlaceholderHeight, width: '100%' }} />
					{overscanTopCount ? this.renderItems(firstOverscanTopItem, overscanTopCount) : null}
					<div />
					{itemMainCount ? this.renderItems(firstMainItem, itemMainCount) : this.renderItems(0, 8)}
					<div />
					{overscanBottomCount ? this.renderItems(firstOverscanBottomItem, overscanBottomCount) : this.renderItems(8, 4)}
					<div style={{ contain: 'strict', height: bottomPlaceholderHeight, width: '100%' }} />
					{itemBottomCount ? this.renderItems(firstBottomItem, itemBottomCount) : this.renderItems(items.length - 4, 4)}
					{!hasNextPage && !isNextPageLoading ? <div>End of feed</div> : <LoadingWithObserver onVisible={loadMoreItems} />}
				</div>
			</div>
		)
	}

	@bind
	handleScroll() {
		if (this.raf !== null) cancelAnimationFrame(this.raf)

		this.raf = requestAnimationFrame(this.driver)
	}

	@bind
	driver() {
		const newState = virtualScrollDriver(
			{
				minItemWidth: 443,
				minRowHeight: 500, // 500
				overscanBottom: 1,
				overscanTop: 1,
				scrollTop: this.viewport.current.scrollTop,
				totalItems: this.state.items.length,
				viewportHeight: this.viewportHeight,
				viewportWidth: this.viewportWidth,
			},
			this.virtualState,
			this.getRenderedItemHeight
		)
		this.setStateIfDiffers(newState)
	}

	setStateIfDiffers(state) {
		const list = ['topPlaceholderHeight', 'MainItemCount', 'firstMainItem', 'MainItemCount', 'bottomPlaceholderHeight', 'targetHeight']
		for (const key in state) {
			if (list.indexOf(key) !== -1 && this.virtualState[key] != state[key]) {
				this.virtualState = state
				return this.forceUpdate()
			}
		}
	}
}

// __optimizeReactComponentTree is only known to Prepack
// so we wrap it in a conditional so the code still works
// for local development testing without Prpeack
if (typeof __optimizeReactComponentTree !== 'undefined') {
	__optimizeReactComponentTree(App)
}

export default Feed
