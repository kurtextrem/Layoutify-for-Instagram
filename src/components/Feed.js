import Post from './feed/Post'
import bind from 'autobind-decorator'
import { Component, Fragment, h } from 'preact'

class Feed extends Component {
	constructor() {
		super()

		this.claim = sessionStorage['www-claim-v2'] || localStorage['www-claim-v2'] // X-IG-WWW-Claim
		const cookies = document.cookie.split('; ')
		this.csrf = cookies.find(v => v.indexOf('csrftoken=') === 0)?.split('=')[1] ?? window._sharedData.config.csrf_token // x-csrftoken
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

		this.obj = {
			cached_feed_item_ids: [],
			fetch_comment_count: 4,
			fetch_like: 3,
			fetch_media_item_count: 12,
			fetch_media_item_cursor: window.__additionalData.feed.data.user.edge_web_feed_timeline.page_info.end_cursor,
			has_stories: false, // @todo nice feature?
			has_threaded_comments: true,
		}
	}

	async fetch() {
		const query = await fetch(
			'/graphql/query/?query_hash=' + this.queryID + '&variables=' + JSON.stringify(this.obj),
			this.GRAPHQL_API_OPTS
		)
		const response = await query.json()

		console.log(response)

		this.obj.fetch_media_item_cursor = response.data.user.edge_web_feed_timeline.page_info.end_cursor

		response.data.user.edge_web_feed_timeline.edges // [0].node => data
	}

	render() {
		return (
			<>
				<div>test</div>
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
