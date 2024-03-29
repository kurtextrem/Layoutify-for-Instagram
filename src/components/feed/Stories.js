import FetchComponent from './FetchComponent'
//import VirtualList from './VirtualList'
import Story, { returnUnseenSrc } from './Story'
import bind from 'autobind-decorator'
import { Fragment, h } from 'preact'
import { shallowDiffers } from '../Utils'
//import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'preact/compat'

class Stories extends FetchComponent {
	static reels_promise = null

	static reels = []

	static queryID = '0ae2bc5ea94ae2255f0ce78b7cd2d791' // <link rel="preload" query id // @TODO Update regularely, last check 17.06.2021

	static fetchObj = {
		only_stories: true,
		stories_prefetch: true,
		stories_video_dash_manifest: false,
	}

	static reelsFetchObj = {
		highlight_reel_ids: [],
		location_ids: [],
		precomposed_overlay: false,
		reel_ids: null, // []
		show_story_viewer_list: false,
		stories_video_dash_manifest: false,
		story_viewer_cursor: '',
		story_viewer_fetch_count: 0,
		tag_names: [],
	}

	static reelsQueryID = 'ac897a58b021a59013b517e73f8f9865' // stories query id, r(d[5]).query(f,{reel_ids: in ConsumerLibCommons // @TODO Update regularely, last check 20.04.2020

	static itemAmount = 12

	static pageNum = 14

	constructor(props) {
		super(props)

		this.state.cursor = props.cursor
		this.state.page = props.cursor / Stories.pageNum
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return shallowDiffers(this.props, nextProperties) || shallowDiffers(this.state, nextState)
	}

	@bind
	fetchInitial(cb) {
		if (Stories.reels_promise !== null) return Stories.reels_promise.then(() => cb && cb())

		Stories.reels_promise = FetchComponent.fetch(
			`/graphql/query/?query_hash=${Stories.queryID}&variables=${JSON.stringify(Stories.fetchObj)}`,
			{
				headers: FetchComponent.getHeaders(false),
			}
		)
			.then(json => {
				Stories.reels = json?.data?.user?.feed_reels_tray?.edge_reels_tray_to_reel?.edges || []
				cb && cb()
				return json
			})
			.catch(e => {
				console.error(e)
				this.setState({ hasNextPage: false, isNextPageLoading: false })
			})
	}

	@bind
	fetchNext(cb) {
		const obj = { ...Stories.reelsFetchObj }
		obj.reel_ids = []

		const cursor = this.state.cursor
		const end = Math.min(cursor + Stories.pageNum, Stories.reels.length)
		let itemMap = {}
		for (let i = cursor; i < end; ++i) {
			const item = Stories.reels[i].node
			if (item.items === null) {
				obj.reel_ids.push(item.id)
				itemMap[item.id] = item
			}
		}

		if (obj.reel_ids.length === 0) return this.forceUpdate()

		FetchComponent.fetch(`/graphql/query/?query_hash=${Stories.reelsQueryID}&variables=${JSON.stringify(obj)}`, {
			headers: FetchComponent.getHeaders(false),
		})
			.then(json => {
				if (!json || !json.data) return

				const nextItems = json.data.reels_media,
					len = nextItems.length
				for (let i = 0; i < len; ++i) {
					const item = nextItems[i]
					itemMap[item.id].items = item.items
				}

				itemMap = null // GC

				this.setState(
					prevState => {
						const nextCursor = prevState.cursor + Stories.pageNum
						return {
							cursor: nextCursor,
							hasNextPage: nextCursor < Stories.reels.length,
							isNextPageLoading: false,
							nextCount: prevState.nextCount + len,
							prevCount: prevState.nextCount,
						}
					},
					() => {
						this._isNextPageLoading = false
						cb && cb()
					}
				)

				return json
			})
			.catch(e => {
				console.error(e)
				this.setState({ hasNextPage: false, isNextPageLoading: false })
			})
	}

	@bind
	renderItems() {
		const { prevCount, page } = this.state,
			items = Stories.reels,
			size = items.length,
			arr = [],
			start = page * Stories.itemAmount,
			len = Stories.itemAmount
		for (let i = start; arr.length < len && i < size; ++i) {
			// fill array until `itemAmount`, to avoid endless loop, break on `size`
			const current = items[i].node
			if (current !== undefined) {
				const src = returnUnseenSrc(current.items, current.unseen)
				if (src === null) continue

				arr.push(<Story additionalClass={i >= prevCount ? 'ige_fade' : ''} data={current} key={current.id} src={src.src} type={src.type} />)
			}
		}

		return arr
	}

	componentDidMount() {
		console.log('didmount')
		Stories.itemAmount = Math.trunc(document.getElementById('ige_feed').clientWidth / 135)
		this.fetchInitial(this.fetchNext)
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
		this.setState(prevState => {
			const page = prevState.page + 1,
				len = Stories.reels.length,
				hasNextPage = page * Stories.itemAmount < len
			return {
				hasNextPage,
				page: hasNextPage ? page : len,
			}
		}, this.loadNextPageRender)
	}

	render() {
		if (Stories.reels.length === 0) return null

		const { hasNextPage, page } = this.state
		const items = this.renderItems()

		if (items.length === 0) return null

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
					{page > 0 ? (
						<button class="ige_button ig_sprite ige_carousel-btn ige_carousel-btn--left" onClick={this.prevPage} type="button" />
					) : null}
					{items}
					{hasNextPage ? (
						<button class="ige_button ig_sprite ige_carousel-btn ige_carousel-btn--right" onClick={this.nextPage} type="button" />
					) : null}
				</div>
			</div>
		)
	}
}

export default Stories
