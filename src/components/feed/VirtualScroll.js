import { h } from 'preact'
import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'preact/compat'

const Sentinel = ({ observer, className }) => {
	const ref = useRef(null)
	const setRef = useCallback(node => {
		ref.current = node
	}, [])

	useEffect(() => {
		if (observer !== null && ref !== null) {
			observer.observe(ref)

			return () => observer.unobserve(ref)
		}
	}, [observer, ref])

	return <div class={className} ref={setRef} />
}

const useIntersect = ({ root = null, rootMargin = '', threshold = 0 } = {}) => {
	const [entries, updateEntries] = useState([])
	const observer = useRef(null)
	const [node, observeNode] = useReducer((prevNode, node) => {
		if (observer.current !== null && prevNode !== null) requestIdleCallback(() => observer.current.unobserve(prevNode))
		return node
	}, null)

	useEffect(
		function createObserver() {
			if (root.current === null) return // desired root isn't there yet
			if (observer.current !== null) observer.current.disconnect()

			observer.current = new IntersectionObserver(updateEntries, {
				delay: 100,
				root: root.current,
				rootMargin,
				threshold,
				trackVisibility: false,
			}) // updateEntries

			return () => observer.current.disconnect()
		},
		[root, rootMargin, threshold]
	)

	useEffect(
		function observe() {
			const currentObserver = observer.current
			if (currentObserver === null || node === null) return

			currentObserver.observe(node)
		},
		[node]
	)

	return [entries, observeNode]
}

// VirtualScroll component
const VirtualScroll = ({ itemCount, className, renderItems }) => {
	const endObserver = useIntersect(endCallback, options) // just two observers
	const endTarget = document.querySelector('.sentinel')
	endObserver.observe(endTarget)

	const startObserver = useIntersect(startCallback, options)
	const startTarget = document.querySelector('.sentinel-start')
	startObserver.observe(startTarget)

	const chunks = useRef([
		{
			items: { end: 0, start: 8 },
			offset: 0,
		},
	])

	const offsets = useRef({ 1: 0 })
	const lastChunk = useRef(1)
	const startFlag = useRef(false)

	let endCallback = function (entries, observer) {
		if (entries[0].isIntersecting) {
			const currentLastChunk = lastChunk.current
			const currentOffsets = offsets.current

			const len = chunks.current.push({
				items: { end: (currentLastChunk + 1) * 15, start: currentLastChunk * 15 },
				offset: currentOffsets[currentLastChunk] + document.querySelector('.sentinel').offsetTop + 1000,
			})
			currentOffsets[currentLastChunk + 1] = currentOffsets[currentLastChunk] + document.querySelector('.sentinel').offsetTop + 1000

			if (len > 2) chunks.current.shift()
			++currentLastChunk

			setTimeout(function () {
				startObserver.observe(document.querySelector('.sentinel-start'))
				endObserver.observe(document.querySelector('.sentinel'))
			}, 100)
		}
	}

	let startCallback = function (entries, observer) {
		if (entries[0].isIntersecting) {
			startFlag.current = true
			const currentLastChunk = lastChunk.current

			const len = chunks.current.unshift({
				items: { end: (currentLastChunk - 2) * 15, start: (currentLastChunk - 2 - 1) * 15 },
				offset: offsets.current['' + (currentLastChunk - 2)],
			})

			if (len >= 2) {
				chunks.current.pop()
				--currentLastChunk
			}

			setTimeout(function () {
				startFlag = false
				startObserver.observe(document.querySelector('.sentinel-start'))
				endObserver.observe(document.querySelector('.sentinel'))
			}, 100)
		}
	}

	// @TODO Container entfernen, Sentinels entfernen, auf bestimmte Items ein IO setzen -> feste Anzahl Items pro Row
	return (
		<div style={{ height, overflowY: 'scroll' }} ref={ref} className={className}>
			<div
				style={{
					height: totalHeight /* 100% */,
					overflow: 'hidden' /* unneeded? */,
					position: 'relative' /* unneeded? */,
					willChange: 'transform' /* unneeded? */,
				}}>
				{chunks.current.map((chunk, index) => ({
					<div
						className={className + 'container'}
						style={{
							position: 'absolute',
							transform: `translateY(${offsetY}px)`,
							willChange: 'transform',
							opacity: 0.01,
							transition: 'opacity 0.3s ease-out',
							animation: 'fadeIn'
						}}>
						{index === 0 ? <Sentinel observer={startObserver} className={`sentinel-start ${lastChunk.current < 3 ? 'disabled' : ''}`} /> : null}
						{renderItems(chunk.items.start, chunk.items.end)}
						{index === chunks.current.length - 1 ? <Sentinel observer={endObserver} className={`sentinel ${startFlag.current ? 'disabled' : ''}`} /> : null}
					</div>
				}))}
			</div>
		</div>
	)
}

export default memo(VirtualScroll)
