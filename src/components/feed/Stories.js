import FetchComponent from './FetchComponent'
//import VirtualList from './VirtualList'
import Arrow from './Arrow'
import Story from './Story'
import bind from 'autobind-decorator'
import { Fragment, h } from 'preact'
import { checkStatus, shallowDiffers, toJSON } from '../Utils'
//import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'preact/compat'

class Stories extends FetchComponent {
	static reels_promise = null

	static reels = []

	static queryID = '7223fb3539e10cad7900c019401669e7' // preloaded query id // @TODO Update regularely, last check 23.09.2020

	static fetchObj = {
		only_stories: true,
		stories_prefetch: true,
		stories_video_dash_manifest: false,
	}

	static itemAmount = 12

	constructor(props) {
		super(props)

		this.state.cursor = props.cursor
		this.state.page = props.cursor / 14
	}

	shouldComponentUpdate(nextProperties, nextState) {
		return shallowDiffers(this.props, nextProperties) || shallowDiffers(this.state, nextState)
	}

	@bind
	fetchNext(cb) {
		if (Stories.reels_promise !== null) return Stories.reels_promise

		Stories.reels_promise = this.fetch('/graphql/query/?query_hash=' + Stories.queryID + '&variables=' + JSON.stringify(Stories.fetchObj), {
			headers: this.getHeaders(false),
		})
			.then(checkStatus)
			.then(toJSON)
			.then(json => {
				Stories.reels = json?.data?.user?.feed_reels_tray?.edge_reels_tray_to_reel?.edges || []
				this.setState({ isNextPageLoading: false })
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
			const current = items[i]
			if (current.reel !== undefined) {
				const story = <Story data={current.reel} key={current.id} additionalClass={i >= prevCount ? 'ige_fade' : ''} />
				if (story !== null) arr.push(story)
			}
		}

		return arr
	}

	componentDidMount() {
		console.log('didmount')
		Stories.itemAmount = ~~(document.getElementById('ige_feed').clientWidth / 135)
		this.fetchNext()
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
				hasNextPage = page * Stories.itemAmount < Stories.reels.length
			return {
				hasNextPage,
				page: hasNextPage ? page : len,
			}
		})
	}

	render() {
		if (Stories.reels.size === 0) return null

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
					{page > 0 ? (
						<button type="button" class="ige_button ige_carousel-btn ige_carousel-btn--left" onClick={this.prevPage}>
							<Arrow direction="left" size="30" fill="gray" />
						</button>
					) : null}
					{items}
					{hasNextPage ? (
						<button type="button" class="ige_button ige_carousel-btn ige_carousel-btn--right" onClick={this.nextPage}>
							<Arrow direction="right" size="30" fill="gray" />
						</button>
					) : null}
				</div>
			</div>
		)
	}
}

export default Stories
