;(function (window, document) {
	const get = (path, object) => path.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), object)

	// sync with FetchComponent
	function getFromIGData(key) {
		const path = [key]
		let get1 = get(path, window._cached_shared_Data)
		if (get1 !== null) return get1

		get1 = get(path, window._sharedData)
		if (get1 !== null) return get1

		get1 = get(['data', key], window.__initialData)
		if (get1 !== null) return get1

		return '<unknown>'
	}

	function getASBD() {
		const el = document.querySelector('script[src*="ConsumerLibCommons"]')
		if (el === null) return '<unknown>'

		const src = el.src

		return new Promise((resolve, reject) => {
			window
				.fetch(src, { cache: 'force-cache' })
				.then(response => {
					if (response.ok) return response
					resolve('<unknown>')
				})
				.then(response => response.text())
				.then(response => {
					const match = response.match(/ASBD_ID='(\d+)'/)
					if (match.length < 2) {
						console.error('couldnt find asbd id')
						return resolve('<unknown>')
					}

					sessionStorage['ige_ASBD'] = match[1]
					resolve(match[1])
				})
		})
	}

	function dispatch(obj) {
		window.dispatchEvent(
			new CustomEvent('__@@ptb_ige', {
				detail: obj,
			})
		)
	}

	function onReady() {
		getASBD().then(asbd => {
			const obj = {
				'rollout-hash': getFromIGData('rollout_hash'),
				'asbd-id': asbd,
			}
			const igClaim = sessionStorage['www-claim-v2'] || localStorage['www-claim-v2']
			if (igClaim) obj['ig-claim'] = igClaim

			dispatch(obj)
		})
	}

	function onLoad() {
		const igClaim = sessionStorage['www-claim-v2'] || localStorage['www-claim-v2']
		if (!igClaim) console.error('couldnt find ig claim')
		dispatch({ 'ig-claim': igClaim })
	}

	if (document.readyState === 'interactive' || document.readyState === 'complete') onReady()
	else document.addEventListener('DOMContentLoaded', onReady)

	if (document.readyState === 'complete') onLoad()
	else document.addEventListener('load', onLoad)
})(window, document)
