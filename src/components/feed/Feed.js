import FetchComponent from './FetchComponent'
import Loading from '../Loading'
import Post from './Post'
//import VirtualList from './VirtualList'
import bind from 'autobind-decorator'
import withIntersectionObserver from './withIntersectionObserver'
import { Fragment, h } from 'preact'
import { shallowDiffers } from '../Utils'
//import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'preact/compat'

class Feed extends FetchComponent {
	state = {
		cursor: '',
		hasNextPage: true,
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
		this.state.cursor = window.__additionalData.feed?.data?.user?.edge_web_feed_timeline?.page_info?.end_cursor || ''
		this.LoadingWithObserver = withIntersectionObserver(Loading, {
			delay: 16,
			root: document.getElementById('ige_virtual'),
			rootMargin: '0px 0px 500px 0px',
			trackVisibility: false,
		})
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return shallowDiffers(this.state, nextState)
	}

	@bind
	loadNextPage(userInitiated) {
		if (this.state.isNextPageLoading) return

		this.setState({ isNextPageLoading: true }, () => {
			this.fetchNext(() => {
				if (userInitiated) requestIdleCallback(() => this.loadNextPage(false)) // preload next
			})
		})
	}

	async fetchNext(cb) {
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

		this.setState(
			(prevState, props) => ({
				cursor: nextCursor,
				hasNextPage: nextCursor !== undefined,
				isNextPageLoading: false,
				items: prevState.items.concat(response.data.user.edge_web_feed_timeline.edges),
			}),
			cb
		)
	}

	componentDidUpdate() {
		;/\s*/g.exec('') // free regexp memory
	}

	componentDidMount() {
		this.componentDidUpdate()
	}

	@bind
	steal(index) {
		// we need to scroll on load once to get the item & steal it after
		// FIXME: Remove this empty box once virtual list supports flex
		//return <div className="ige_post ige_stories_after" key={'i' + index} data-index={index} />
		return null
	}

	@bind
	renderItems(start, count) {
		const items = this.state.items,
			arr = [],
			len = Math.min(start * 8 + count * 8, items.length)
		for (let i = start * 8; i < len; ++i) {
			const current = items[i]
			arr.push(
				current.node.__typename === 'GraphStoriesInFeedItem' ? (
					this.steal(i)
				) : (
					<Post data={current.node} key={current.node.shortcode} index={i} />
				)
			)
		}

		return arr
	}

	render() {
		const { hasNextPage, isNextPageLoading, items } = this.state

		// Only load 1 page of items at a time.
		// Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
		const loadMoreItems = isNextPageLoading ? () => {} : () => this.loadNextPage(true)
		const LoadingWithObserver = this.LoadingWithObserver

		// @TODO Clone stories node & put in here; stories appear after 8th post usually, tag type div
		// @TODO Unload out of viewport imgs/videos

		return (
			<div class="ige_virtual">
				<div class="ige_virtual_container">
					{items.map(v => (v.node.__typename === 'GraphStoriesInFeedItem' ? this.steal() : <Post data={v.node} key={v.node.shortcode} />))}
					{!hasNextPage && !isNextPageLoading ? (
						<div>End of feed, try reloading the page.</div>
					) : (
						<LoadingWithObserver onVisible={loadMoreItems} />
					)}
				</div>
			</div>
		)

		//return <VirtualList itemCount={items.length / 8} renderItems={this.renderItems} className="ige_virtual" />
	}
}

// __optimizeReactComponentTree is only known to Prepack
// so we wrap it in a conditional so the code still works
// for local development testing without Prpeack
if (typeof __optimizeReactComponentTree !== 'undefined') {
	__optimizeReactComponentTree(App)
}

export default Feed
