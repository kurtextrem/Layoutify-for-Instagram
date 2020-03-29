import FetchComponent from './FetchComponent'
import Loading from '../Loading'
import Post from './Post'
import bind from 'autobind-decorator'
import withIntersectionObserver from './withIntersectionObserver'
import { Fragment, h } from 'preact'

class Feed extends FetchComponent {
	state = {
		cursor: '',
		data: window.__additionalData?.feed?.data?.user?.edge_web_feed_timeline?.edges,
		hasNextPage: false,
		isNextPageLoading: false,
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
			data: prevState.data.concat(response.data.user.edge_web_feed_timeline.edges),
			hasNextPage: nextCursor !== undefined,
			isNextPageLoading: false,
		}))
	}

	steal() {
		// we need to scroll on load once to get the item & steal it after
	}

	render() {
		const { hasNextPage, isNextPageLoading, data } = this.state

		// Only load 1 page of items at a time.
		// Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
		const loadMoreItems = isNextPageLoading ? () => {} : this.loadNextPage

		const LoadingWithObserver = this.LoadingWithObserver

		// @TODO Clone stories node & put in here; stories appear after 8th post usually, tag type div
		return (
			<>
				{data.map(v => (v.node.__typename === 'GraphStoriesInFeedItem' ? this.steal() : <Post data={v.node} key={v.node.shortcode} />))}
				{!hasNextPage && !isNextPageLoading ? <div>End of feed</div> : <LoadingWithObserver onVisible={loadMoreItems} />}
			</>
		)
	}
}

// __optimizeReactComponentTree is only known to Prepack
// so we wrap it in a conditional so the code still works
// for local development testing without Prpeack
if (typeof __optimizeReactComponentTree !== 'undefined') {
	__optimizeReactComponentTree(App)
}

export default Feed
