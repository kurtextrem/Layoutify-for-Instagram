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

	function onReady() {
		window.dispatchEvent(
			new CustomEvent('__@@ptb_ige', {
				detail: {
					'ig-claim': sessionStorage['www-claim-v2'] || localStorage['www-claim-v2'],
					'rollout-hash': getFromIGData('rollout_hash'),
				},
			})
		)
	}

	if (document.readyState === 'interactive' || document.readyState === 'complete') onReady()
	else document.addEventListener('DOMContentLoaded', onReady)
})(window, document)
