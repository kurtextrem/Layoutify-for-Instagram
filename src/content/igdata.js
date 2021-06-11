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
		if (el === null) {
			console.error('couldnt find ConsumerLibCommons script')
			return '<unknown>'
		}

		const src = el.src

		return new Promise((resolve, reject) => {
			window
				.fetch(src, { cache: 'force-cache' })
				.then(response => {
					if (response.ok) return response
					throw new Error('response not ok')
				})
				.then(response => response.text())
				.then(response => {
					const match = response.match(/ASBD_ID='(\d+)'/)
					if (match.length < 2) throw new Error('couldnt find asbd id')

					sessionStorage.ige_ASBD = match[1]
					resolve(match[1])
				})
				.catch(err => {
					console.error(err)
					resolve('<unknown>')
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

	function asbdPromiseHandler(asbd) {
		const obj = {
			'asbd-id': asbd,
			'rollout-hash': getFromIGData('rollout_hash'),
		}
		const igClaim = sessionStorage['www-claim-v2'] || localStorage['www-claim-v2']
		if (igClaim) obj['ig-claim'] = igClaim

		dispatch(obj)
	}

	function onReady() {
		getASBD().then(asbdPromiseHandler).catch(asbdPromiseHandler)
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
