import FetchComponent from './FetchComponent'
import Loading from '../Loading'
import Post from './Post'
import Sentinel from './Sentinel'
//import VirtualList from './VirtualList'
import PostDummy from '../PostDummy'
import Stories from './Stories'
import bind from 'autobind-decorator'
import withIntersectionObserver from './withIntersectionObserver'
import { Fragment, h } from 'preact'
import { iObs, promiseReq, rObs, shallowDiffers } from '../Utils'
//import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'preact/compat'

class Feed extends FetchComponent {
	TIME_STATE = {
		ERROR: 2_000,
		LOADING: 900,
	}

	loading = (<Loading />)

	error = (<div>End of feed, try reloading the page.</div>)

	dummy = (
		<div class="position-relative">
			<div class="d-flex position-relative justify-content-center flex-wrap">
				<PostDummy />
				<PostDummy />
				<PostDummy />
				<PostDummy />
			</div>
		</div>
	)

	db = null

	fetchObj = {
		// @TODO Update regularely, last check 17.06.2021, same as below
		cached_feed_item_ids: [],
		fetch_comment_count: 4,
		fetch_like: 3,
		fetch_media_item_count: 12,
		fetch_media_item_cursor: '',
		has_stories: false, // @todo nice feature?
		has_threaded_comments: true,
	}

	ref = null

	constructor(props) {
		super(props)

		this.queryID = 'a7124f10a3421523b50620bb071434ca' // feed query id &variables=%7B%22has_threaded_comments%22%3Atrue%7D // @TODO Update regularely, last check 17.06.2021

		//this.iObs = iObs()
		//this.rObs = rObs()

		this.state.timeout = 0
		this.state.items = []
		this.state.cursor = ''

		this.SentinelWithObserver = withIntersectionObserver(Sentinel, {
			//delay: 16,
			root: document.getElementById('ige_feed'),
			trackVisibility: false,
		})
	}

	@bind
	setRef(ref) {
		this.ref = ref
	}

	setTimeout(timeout) {
		this.setState({ timeout })
		if (timeout !== this.TIME_STATE.ERROR) window.setTimeout(() => this.setTimeout(this.TIME_STATE.ERROR), this.TIME_STATE.ERROR)
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return shallowDiffers(this.state, nextState) || shallowDiffers(this.props, nextProperties)
	}

	async fetchNext(cb) {
		const obj = { ...this.fetchObj }
		obj.fetch_media_item_cursor = this.state.cursor

		const response = await FetchComponent.fetch(`/graphql/query/?query_hash=${this.queryID}&variables=${JSON.stringify(obj)}`, {
			headers: FetchComponent.getHeaders(false),
		})

		if (response.status !== 'ok') {
			this.setState({ hasNextPage: false, isNextPageLoading: false })
			return
		}

		const nextCursor = response?.data?.user?.edge_web_feed_timeline?.page_info.end_cursor

		this.setState(
			prevState => {
				const nextItems = prevState.items.concat(response.data.user.edge_web_feed_timeline.edges)
				return {
					cursor: nextCursor,
					hasNextPage: nextCursor !== undefined,
					isNextPageLoading: false,
					items: nextItems,
					nextCount: nextItems.length,
					prevCount: prevState.nextCount,
				}
			},
			() => {
				this._isNextPageLoading = false
				cb && cb()
			}
		)
	}

	componentDidUpdate() {
		// eslint-disable-next-line regexp/no-useless-flag
		;/\s*/g.exec('') // free regexp memory

		/*if (this.ref) {
			this.ref.children.forEach(el => {
				if (el.isObserved) return

				//el.isObserved = true
				//this.iObs.observe(el)
				//this.rObs.observe(el)
			})
		}*/
	}

	componentDidMount() {
		if (this.db === null && this.state.items.length === 0) {
			this.db = promiseReq(window.indexedDB.open('redux', 1)) // they store reel IDs in the redux DB, until... I don't know, not sure how they invalidate, maybe SW
			this.loadDBItems()
		}

		window.setTimeout(() => this.setTimeout(this.TIME_STATE.LOADING), this.TIME_STATE.LOADING)
		this.componentDidUpdate()
	}

	componentWillUnmount() {
		//this.iObs.disconnect()
		//this.rObs.disconnect()
	}

	@bind
	async loadDBItems() {
		const db = await this.db
		const path = db.transaction('paths').objectStore('paths')
		const items = promiseReq(path.get('feed.items'))
		const posts = promiseReq(path.get('posts.byId'))
		const comments = promiseReq(path.get('comments.byId'))
		const users = promiseReq(path.get('users.users'))

		const [itemsResult, postsResult, commentsResult, usersResult] = await Promise.all([items, posts, comments, users])

		const result = []
		for (let i = 0; i < itemsResult.length; ++i) {
			const item = postsResult[itemsResult[i].postId]

			// We adapt the stored items to be compatible to the feed response
			if (item.isSidecar) item.__typename = 'GraphSidecar'
			else if (item.isVideo) item.__typename = 'GraphVideo'
			else item.__typename = 'GraphImage'

			item.is_video = item.isVideo
			item.shortcode = item.code
			item.display_url = item.src
			item.viewer_has_liked = item.likedByViewer
			item.viewer_has_saved = item.savedByViewer
			item.viewer_has_saved_to_collection = item.savedByViewerToCollection
			item.taken_at_timestamp = item.postedAt
			item.comments_disabled = item.commentsDisabled
			item.edge_media_to_caption = { edges: [{ node: { text: item.caption } }] }
			item.edge_media_preview_like = { count: item.numPreviewLikes } // edges: .likers
			item.video_view_count = item.videoViews
			// usertags
			// location

			const owner = usersResult[item.owner.id]
			item.owner = usersResult[item.owner.id]
			owner.is_private = owner.isPrivate
			owner.is_verified = owner.isVerified
			owner.profile_pic_url = owner.profilePictureUrl

			// comments
			item.edge_media_preview_comment = { count: item.numComments, edges: [] }
			for (let x = 0; x < item.previewCommentIds.length; ++x) {
				const node = { node: commentsResult[item.previewCommentIds[x]] }
				node.node.owner = usersResult[node.node.userId]
				item.edge_media_preview_comment.edges.push(node)
			}

			result.push({ node: item })
		}

		console.log(result)
		this.setState({ items: result })
	}

	@bind
	renderItems() {
		const { items, prevCount } = this.state,
			arr = []
		for (let i = 0; i < items.length; ++i) {
			const current = items[i],
				type = current.node.__typename
			if (type !== 'GraphImage' && type !== 'GraphSidecar' && type !== 'GraphVideo' && type !== 'GraphStoriesInFeedItem') {
				console.info('New typename', type)
				continue
			}

			const len = arr.length
			if (len === 8 || len === 25)
				// two rows, so stories can load out of view
				arr.push(<Stories additionalClass={i >= prevCount ? 'ige_fade' : ''} cursor={i < 10 ? 0 : 14} key={current.node.id} />)

			if (type === 'GraphStoriesInFeedItem') continue

			arr.push(<Post additionalClass={i >= prevCount ? 'ige_fade' : ''} data={current.node} key={current.node.shortcode} />)
		}

		return arr
	}

	render() {
		const { hasNextPage, isNextPageLoading, items, timeout } = this.state

		const Sentinel = this.SentinelWithObserver

		// @TODO Unload out of viewport imgs/videos
		if (items.length !== 0)
			return (
				<div class="ige_virtual">
					<div class="ige_virtual_container" ref={this.setRef}>
						{this.renderItems()}
						<Sentinel onVisible={this.loadNextPageRender} />
						{!hasNextPage && !isNextPageLoading ? this.error : this.loading}
					</div>
				</div>
			)

		if (timeout === this.TIME_STATE.LOADING) return this.loading
		if (timeout === this.TIME_STATE.ERROR) return this.error

		return this.dummy
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
