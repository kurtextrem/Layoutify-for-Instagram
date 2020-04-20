import bind from 'autobind-decorator'
import { Component, h } from 'preact'

/**
 *
 */
export default class FetchComponent extends Component {
	static rolloutHash = window._cached_shared_Data?.rollout_hash || window._sharedData?.rollout_hash || '<unknown>'

	state = {
		cursor: undefined,
		hasNextPage: true,
		isNextPageLoading: false,
		items: [],
		nextCount: 0,
		prevCount: 0,
	}

	getCSRF() {
		const cookies = document.cookie.split('; ')
		return cookies.find(v => v.indexOf('csrftoken=') === 0)?.split('=')[1] || window._sharedData?.config?.csrf_token
	}

	getHeaders(withRollout) {
		const headers = new Headers({
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
		if (this.state.isNextPageLoading) return

		this.setState({ isNextPageLoading: true }, () => {
			this.fetchNext(() => {
				if (userInitiated) requestIdleCallback(() => this.loadNextPage(false)) // preload next
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
