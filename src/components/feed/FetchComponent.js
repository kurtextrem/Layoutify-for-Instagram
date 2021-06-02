import bind from 'autobind-decorator'
import { Component, h } from 'preact'

/**
 *
 */
export default class FetchComponent extends Component {
	static rolloutHash =
		window._cached_shared_Data?.rollout_hash || window._sharedData?.rollout_hash || window.__initialData?.data?.rollout_hash || '<unknown>'

	/**
	 * Used as gate-keeper toggle to the loading of multiple pages at the same time.
	 */
	_isNextPageLoading = false

	loadNextPageRender = () => this.loadNextPage(true)

	fetchNext(cb) {}

	state = {
		cursor: undefined,
		hasNextPage: true,
		isNextPageLoading: false,
		items: [],
		nextCount: 0,
		prevCount: 0,
	}

	getCSRF() {
		return (
			document.cookie
				.split('; ')
				.find(v => v.indexOf('csrftoken=') === 0)
				?.split('=')[1] ||
			window._sharedData?.config?.csrf_token ||
			window.__initialData?.data?.config?.csrf_token ||
			window._csrf_token
		)
	}

	getHeaders(withRollout) {
		// sync with background.js
		const headers = new Headers({
			'x-asbd-id': sessionStorage['ige_ASBD'], // sync with igdata
			'x-csrftoken': this.getCSRF(),
			'X-IG-App-ID': '936619743392459', // .instagramWebDesktopFBAppId
			'X-IG-WWW-Claim': sessionStorage['www-claim-v2'] || localStorage['www-claim-v2'],
			'x-requested-with': 'XMLHttpRequest',
		})

		if (withRollout) headers.append('x-instagram-ajax', FetchComponent.rolloutHash)

		return headers
	}

	@bind
	loadNextPage(userInitiated) {
		if (this._isNextPageLoading) return window.setTimeout(this.loadNextPage.bind(this, userInitiated), 500)
		this._isNextPageLoading = true

		this.setState({ isNextPageLoading: true }, () => {
			this.fetchNext(() => {
				if (userInitiated) requestIdleCallback(this.loadNextPage.bind(this, false)) // preload next
			})
		})
	}

	async fetch(url, options) {
		const query = await fetch(url, options)

		if (!query.ok) return { status: '' }

		const response = await query.json()
		console.log(response)

		return response
	}
}
