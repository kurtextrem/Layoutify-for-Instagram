import FetchComponent from './FetchComponent'
import Sentinel from './Sentinel'
//import VirtualList from './VirtualList'
import Arrow from './Arrow'
import Story from './Story'
import bind from 'autobind-decorator'
import withIntersectionObserver from './withIntersectionObserver'
import { Fragment, h } from 'preact'
import { shallowDiffers } from '../Utils'
//import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'preact/compat'

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

		this.queryID = 'f5dc1457da7a4d3f88762dae127e0238' // stories query id // @TODO Update regularely, last check 20.04.2020
		this.state.cursor = 0

		this.db = async () => window.indexedDB.open('redux', 1) // they store reel IDs in the redux DB, until... I don't know, not sure how they invalidate, maybe SW

		this.SentinelWithObserver = withIntersectionObserver(Sentinel, {
			//delay: 16,
			root: document.getElementById('ige_feed'),
			trackVisibility: false,
		})
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return shallowDiffers(this.state, nextState)
	}

	async fetchNext(cb) {
		const db = await this.db
		const reels = await db.result.transaction('paths').objectStore('paths').get('stories.feedTray')
		const len = reels.result.length

		const obj = { ...Stories.fetchObj }
		obj.reel_ids = reels.result.splice(this.state.cursor, 14)

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
		const { items, prevCount } = this.state,
			arr = []
		for (const [i, current] of items.entries()) {
			arr.push(<Story data={current} key={current.id} additionalClass={i >= prevCount ? 'ige_fade' : ''} />)
		}

		return arr
	}

	render() {
		const { hasNextPage, isNextPageLoading } = this.state

		// Only load 1 page of items at a time.
		// Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
		const loadMoreItems = isNextPageLoading ? () => {} : () => this.loadNextPage(true)
		const Sentinel = this.SentinelWithObserver

		// @TODO Clone stories node & put in here; stories appear after 8th post usually, tag type div
		// @TODO Unload out of viewport imgs/videos

		return (
			<div class="ige_stories">
				<div class="ige_stories_container">
					{this.renderItems()}
					<Sentinel onVisible={loadMoreItems} />
					<button type="button" class="ige_button ige_carousel-btn ige_carousel-btn--right" onClick={this.handleArrowClick}>
						<Arrow direction="right" size="30" fill="gray" />
					</button>
				</div>
			</div>
		)

		//return <VirtualList itemCount={items.length / 8} renderItems={this.renderItems} className="ige_virtual" />
	}
}

export default Stories
