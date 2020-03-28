import Loading from '../Loading'
import Post from './Post'
import bind from 'autobind-decorator'
import withIntersectionObserver from './withIntersectionObserver'
import { Component, Fragment, h } from 'preact'

class Feed extends Component {
	state = {
		cursor: '',
		data: window.__additionalData?.feed?.data?.user?.edge_web_feed_timeline?.edges,
		hasNextPage: false,
		isNextPageLoading: false,
	}

	constructor() {
		super()

		this.claim = sessionStorage['www-claim-v2'] || localStorage['www-claim-v2'] // X-IG-WWW-Claim
		const cookies = document.cookie.split('; ')
		this.csrf = cookies.find(v => v.indexOf('csrftoken=') === 0)?.split('=')[1] ?? window._sharedData?.config?.csrf_token // x-csrftoken
		// this.appID = '936619743392459' // X-IG-App-ID  | .instagramWebDesktopFBAppId
		this.queryID = '6b838488258d7a4820e48d209ef79eb1' // feed query id
		// x-requested-with: XMLHttpRequest

		this.GRAPHQL_API_OPTS = {
			headers: new Headers({
				'x-csrftoken': this.csrf,
				'X-IG-App-ID': '936619743392459',
				'X-IG-WWW-Claim': this.claim,
				'x-requested-with': 'XMLHttpRequest',
			}),
		}

		const nextPage = window.__additionalData?.feed?.data?.user?.edge_web_feed_timeline?.page_info.end_cursor
		if (nextPage !== undefined) {
			this.state.hasNextPage = true
			this.state.cursor = nextPage
		}

		this.fetchObj = {
			cached_feed_item_ids: [],
			fetch_comment_count: 4,
			fetch_like: 3,
			fetch_media_item_count: 12,
			fetch_media_item_cursor: '',
			has_stories: false, // @todo nice feature?
			has_threaded_comments: true,
		}

		this.LoadingWithObserver = withIntersectionObserver(Loading, {
			//root: document.getElementById('ige_feed'),
			//rootMargin: '400px 0px 0px 0px',
		})
	}

	@bind
	loadNextPage() {
		if (this.state.isNextPageLoading) return

		this.setState({ isNextPageLoading: true }, () => {
			this.fetch()
		})
	}

	async fetch() {
		const obj = { ...this.fetchObj }
		obj.fetch_media_item_cursor = this.state.cursor

		const query = await fetch('/graphql/query/?query_hash=' + this.queryID + '&variables=' + JSON.stringify(obj), this.GRAPHQL_API_OPTS)
		const response = await query.json()

		console.log(response)

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
				<LoadingWithObserver onVisible={loadMoreItems} />
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
