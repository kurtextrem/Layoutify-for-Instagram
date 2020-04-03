import { h } from 'preact'
import { memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'preact/compat'

const Sentinel = ({ observer }) => {
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

	// index === 0 -> disabled = lastChunk < 3

	return <div className="sentinel-start" ref={setRef} />
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
	const endObserver = new IntersectionObserver(endCallback, options) // just two observers
	const endTarget = document.querySelector('.sentinel')
	endObserver.observe(endTarget)

	const startObserver = useIntersect(startCallback, options)
	const startTarget = document.querySelector('.sentinel-start')
	startObserver.observe(startTarget)

	const chunks = useRef([
		{
			items: [],
			offset: 0,
		},
	])

	const offsets = useRef({ 1: 0 })
	const lastChunk = useRef(1)
	const startFlag = useRef(false)

	let endCallback = function (entries, observer) {
		if (entries[0].intersectionRatio > 0) {
			let newChunks = { ...chunks }
			newChunks = Object.keys(newChunks).map(function (key) {
				return newChunks[key]
			})
			newChunks.push({
				items: data.slice(lastChunk * 15, (lastChunk + 1) * 15),
				offset: offsets[lastChunk] + document.querySelector('.sentinel').offsetTop + 1000,
			})
			offsets[lastChunk + 1] = offsets[lastChunk] + document.querySelector('.sentinel').offsetTop + 1000
			if (newChunks.length > 2) {
				newChunks.shift()
			}
			chunks = newChunks
			lastChunk++
			setTimeout(function () {
				startObserver.observe(document.querySelector('.sentinel-start'))
				endObserver.observe(document.querySelector('.sentinel'))
			}, 100)
		}
	}

	let startCallback = function (entries, observer) {
		if (entries[0].intersectionRatio > 0) {
			startFlag = true
			let newChunks = { ...chunks }
			newChunks = Object.keys(newChunks).map(function (key) {
				return newChunks[key]
			})
			newChunks.unshift({
				items: data.slice((lastChunk - 2 - 1) * 15, (lastChunk - 2) * 15),
				offset: offsets['' + (lastChunk - 2)],
			})
			if (newChunks.length >= 2) {
				newChunks.pop()
				lastChunk--
			}
			chunks = newChunks
			setTimeout(function () {
				startFlag = false
				startObserver.observe(document.querySelector('.sentinel-start'))
				endObserver.observe(document.querySelector('.sentinel'))
			}, 100)
		}
	}

	return (
		<div style={{ height, overflowY: 'scroll' }} ref={ref} className={className}>
			<div
				style={{
					height: totalHeight /* 100% */,
					overflow: 'hidden' /* unneeded? */,
					position: 'relative' /* unneeded? */,
					willChange: 'transform' /* unneeded? */,
				}}>
				<div
					className={className + 'container'}
					style={{
						transform: `translateY(${offsetY}px)`,
						willChange: 'transform',
					}}>
					{visibleChildren}
				</div>
			</div>
		</div>
	)
}

export default memo(VirtualScroll)
