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

	function loadWithCache(src, old) {
		return new Promise((resolve, reject) => {
			window
				.fetch(src, { cache: 'force-cache' })
				.then(response => {
					if (response.ok) return response
					resolve(null)
				})
				.then(response => response.text())
				.then(response => {
					const match = response.match(old ? /ASBD_ID='(\d+)'/ : /="(\d+)";\w\.ASBD_ID=/)
					if (!match || match.length < 2) return resolve(null)

					sessionStorage.ige_ASBD = match[1]
					resolve(match[1])
				})
				.catch(err => {
					console.error(err)
					resolve(null)
				})
		})
	}

	function getASBD() {
		const el = document.querySelector('script[src*="ConsumerLibCommons"]') || document.querySelectorAll("link[rel='preload'][as='script']")
		if (el === null) {
			console.error('couldnt find ConsumerLibCommons script')
			return Promise.resolve('<unknown>')
		}

		const len = el.length
		if (len) {
			const promises = new Array(len)
			for (let i = 0; i < len; ++i) {
				promises.push(loadWithCache(el[i].href, false))
			}

			return Promise.allSettled(promises).then(results => {
				const result = results.find(result => !!result.value)
				if (!result) {
					console.error('couldnt find asbd id')
					return '<unknown>'
				}

				return result.value
			})
		}

		return loadWithCache(el.src, true)
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
