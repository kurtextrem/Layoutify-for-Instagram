import FetchComponent from './FetchComponent'
//import VirtualList from './VirtualList'
import Arrow from './Arrow'
import Story from './Story'
import bind from 'autobind-decorator'
import withIntersectionObserver from './withIntersectionObserver'
import { Fragment, h } from 'preact'
import { shallowDiffers } from '../Utils'
//import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'preact/compat'

/**
 *
 */
function promiseReq(req) {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result)
		req.onerror = () => reject(req.error)
	})
}

class Stories extends FetchComponent {
	static fetchObj = {
		highlight_reel_ids: [],
		location_ids: [],
		precomposed_overlay: false,
		reel_ids: null, // []
		show_story_viewer_list: true,
		stories_video_dash_manifest: false,
		story_viewer_cursor: '',
		story_viewer_fetch_count: 50,
		tag_names: [],
	}

	constructor(props) {
		super(props)

		this.db = null
		this.itemAmount = 12
		this.queryID = 'f5dc1457da7a4d3f88762dae127e0238' // stories query id // @TODO Update regularely, last check 20.04.2020
		this.state.cursor = props.cursor
		this.state.page = props.cursor / 14
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return shallowDiffers(this.state, nextState)
	}

	async fetchNext(cb) {
		const db = await this.db
		const reels = await promiseReq(db.transaction('paths').objectStore('paths').get('stories.feedTray'))
		const len = reels.length

		const obj = { ...Stories.fetchObj }
		obj.reel_ids = reels.splice(this.state.cursor, 14)

		const response = await this.fetch('/graphql/query/?query_hash=' + this.queryID + '&variables=' + JSON.stringify(obj), {
			headers: this.getHeaders(false),
		})

		if (response.status !== 'ok') {
			this.setState({ hasNextPage: false, isNextPageLoading: false })
			return
		}

		this.setState((prevState, props) => {
			const nextItems = prevState.items.concat(response.data.reels_media),
				nextCursor = prevState.cursor + 14
			return {
				cursor: prevState.cursor + 14,
				hasNextPage: nextCursor < len,
				isNextPageLoading: false,
				items: nextItems,
				nextCount: nextItems.length,
				prevCount: prevState.nextCount,
			}
		}, cb)
	}

	@bind
	renderItems() {
		const { items, prevCount, page } = this.state,
			arr = [],
			len = Math.min(page * this.itemAmount + this.itemAmount, items.length)
		for (let i = page; i <= len; ++i) {
			const current = items[i]
			arr.push(<Story data={current} key={current.id} additionalClass={i >= prevCount ? 'ige_fade' : ''} />)
		}

		return arr
	}

	componentDidMount() {
		this.db = promiseReq(window.indexedDB.open('redux', 1)) // they store reel IDs in the redux DB, until... I don't know, not sure how they invalidate, maybe SW
		this.fetchNext()
		this.itemAmount = ~~(document.getElementById('ige_feed').clientWidth / 135)
	}

	@bind
	prevPage() {
		this.setState(prevState => {
			const page = prevState.page - 1
			return {
				page: page >= 0 ? page : 0,
			}
		})
	}

	@bind
	nextPage() {
		this.setState(prevState => {
			const page = prevState.page + 1,
				len = prevState.items.length
			return {
				page: page < len ? page : len,
			}
		})
	}

	render() {
		const { hasNextPage, page } = this.state

		// @TODO Unload out of viewport imgs/videos

		return (
			<div class="ige_stories ige_post">
				<div class="d-flex f-row ige_stories-heading">
					<span>New Stories</span>
					{/*<a href="#" class="ml-auto">
						Alle ansehen
					</a>*/}
				</div>
				<div class="ige_stories_container">
					{page > 0 ? (
						<button type="button" class="ige_button ige_carousel-btn ige_carousel-btn--left" onClick={this.prevPage}>
							<Arrow direction="left" size="30" fill="gray" />
						</button>
					) : null}
					{this.renderItems()}
					{hasNextPage ? (
						<button type="button" class="ige_button ige_carousel-btn ige_carousel-btn--right" onClick={this.nextPage}>
							<Arrow direction="right" size="30" fill="gray" />
						</button>
					) : null}
				</div>
			</div>
		)

		//return <VirtualList itemCount={items.length / 8} renderItems={this.renderItems} className="ige_virtual" />
	}
}

export default Stories
