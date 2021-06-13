import bind from 'autobind-decorator'
import { Component, h } from 'preact'

/**
 *
 */
export default class FetchComponent extends Component {
	static async fetch(url, options) {
		const query = await fetch(url, options)

		if (!query.ok) return { status: '' }

		const response = await query.json()
		console.log(response)

		return response
	}

	static getCSRF() {
		const csrfToken =
			document.cookie
				.split('; ')
				.find(v => v.indexOf('csrftoken=') === 0)
				?.split('=')[1] ||
			window._sharedData?.config?.csrf_token ||
			window.__initialData?.data?.config?.csrf_token ||
			window._csrf_token

		if (!csrfToken) throw new Error('csrf token could not be found')
		return csrfToken
	}

	static getHeaders(withRollout) {
		// sync with background.js
		const headers = new Headers({
			'x-asbd-id': sessionStorage.ige_ASBD, // sync with igdata
			'x-csrftoken': FetchComponent.getCSRF(),
			'X-IG-App-ID': '936619743392459', // .instagramWebDesktopFBAppId
			'X-IG-WWW-Claim': sessionStorage['www-claim-v2'] || localStorage['www-claim-v2'],
			'x-requested-with': 'XMLHttpRequest',
		})

		if (withRollout) headers.append('x-instagram-ajax', FetchComponent.rolloutHash)

		return headers
	}

	state = {
		cursor: undefined,
		hasNextPage: true,
		isNextPageLoading: false,
		items: [],
		nextCount: 0,
		prevCount: 0,
	}

	/**
	 * Used as gate-keeper toggle to the loading of multiple pages at the same time.
	 */
	_isNextPageLoading = false

	static rolloutHash =
		window._cached_shared_Data?.rollout_hash || window._sharedData?.rollout_hash || window.__initialData?.data?.rollout_hash || '<unknown>'

	fetchNext(cb) {}

	@bind
	loadNextPageRender() {
		return this.loadNextPage(true)
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
}
