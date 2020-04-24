import FetchComponent from './FetchComponent'
//import VirtualList from './VirtualList'
import Arrow from './Arrow'
import Story from './Story'
import bind from 'autobind-decorator'
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

	static reelsRank = new Map()

	static reels = new Map()

	static db = null

	static itemAmount = 12

	static queryID = 'f5dc1457da7a4d3f88762dae127e0238' // stories query id // @TODO Update regularely, last check 20.04.2020

	constructor(props) {
		super(props)

		this.state.cursor = props.cursor
		this.state.page = props.cursor / 14
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return shallowDiffers(this.props, nextProperties) || shallowDiffers(this.state, nextState)
	}

	@bind
	async fetchNext(cb) {
		const obj = { ...Stories.fetchObj }
		obj.reel_ids = []

		const cursor = this.state.cursor
		const end = cursor + 14
		for (let i = cursor; i < end; ++i) {
			if (Stories.reelsRank.has(i)) obj.reel_ids.push(Stories.reelsRank.get(i).id)
		}

		const response = await this.fetch('/graphql/query/?query_hash=' + Stories.queryID + '&variables=' + JSON.stringify(obj), {
			headers: this.getHeaders(false),
		})

		if (response.status !== 'ok') {
			this.setState({ hasNextPage: false, isNextPageLoading: false })
			return
		}

		const nextItems = response.data.reels_media
		for (const [i, element] of nextItems.entries()) {
			const id = element.id
			const reel = Stories.reels.get(id)
			reel.reel = element
			Stories.reels.set(id, reel)
			Stories.reelsRank.set(reel.reelsRank, reel)
		}

		console.log(Stories.reels)
		console.log(Stories.reelsRank)

		this.setState((prevState, props) => {
			const nextCursor = prevState.cursor + 14
			return {
				cursor: prevState.cursor + 14,
				hasNextPage: nextCursor < Stories.reelsRank.size,
				isNextPageLoading: false,
				nextCount: prevState.nextCount + nextItems.length,
				prevCount: prevState.nextCount,
			}
		}, cb)
	}

	@bind
	renderItems() {
		const { prevCount, page } = this.state,
			items = Stories.reelsRank,
			size = items.size,
			arr = [],
			start = page * Stories.itemAmount,
			len = Stories.itemAmount
		for (let i = start; arr.length < len && i < size; ++i) {
			// fill array until `itemAmount`, to avoid endless loop, break on `size`
			if (!items.has(i)) continue

			const current = items.get(i)
			if (current.reel !== undefined)
				arr.push(<Story data={current.reel} key={current.id} additionalClass={i >= prevCount ? 'ige_fade' : ''} />)
		}

		return arr
	}

	componentDidMount() {
		if (Stories.db === null) Stories.db = promiseReq(window.indexedDB.open('redux', 1)) // they store reel IDs in the redux DB, until... I don't know, not sure how they invalidate, maybe SW
		console.log('didmount')
		this.loadReels()
		Stories.itemAmount = ~~(document.getElementById('ige_feed').clientWidth / 135)
	}

	@bind
	async loadReels() {
		const db = await Stories.db
		const reels = await promiseReq(db.transaction('paths').objectStore('paths').get('stories.reels'))

		for (const i in reels) {
			const current = reels[i]
			Stories.reels.set(i, current)
			Stories.reelsRank.set(current.rankedPosition - 1, current) // rankedPosition starts at 1
		}
		this.loadNextPage(true)
	}

	@bind
	prevPage(e) {
		this.setState(prevState => {
			const page = prevState.page - 1
			return {
				page: page >= 0 ? page : 0,
			}
		})
	}

	@bind
	nextPage(e) {
		this.setState(
			prevState => {
				const page = prevState.page + 1,
					len = Stories.reelsRank.size
				return {
					page: page * Stories.itemAmount < len ? page : len,
				}
			},
			() => this.loadNextPage(true)
		)
	}

	render() {
		const { hasNextPage, page } = this.state
		const items = this.renderItems()

		// @TODO Unload out of viewport imgs/videos

		return (
			<div class="ige_stories ige_post">
				<div class="d-flex f-row ige_stories-heading">
					<span class="text-gray">New Stories</span>
					{/*<a href="#" class="ml-auto">
						Alle ansehen
					</a>*/}
				</div>
				<div class="ige_stories_container">
					{/*page > 0 ? (
						<button type="button" class="ige_button ige_carousel-btn ige_carousel-btn--left" onClick={this.prevPage}>
							<Arrow direction="left" size="30" fill="gray" />
						</button>
					) : null*/}
					{items}
					{/*hasNextPage ? (
						<button type="button" class="ige_button ige_carousel-btn ige_carousel-btn--right" onClick={this.nextPage}>
							<Arrow direction="right" size="30" fill="gray" />
						</button>
					) : null*/}
				</div>
			</div>
		)
	}
}

export default Stories
