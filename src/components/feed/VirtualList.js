import { h } from 'preact'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'preact/compat'

const useIntersect = ({ root = null, rootMargin = '', threshold = 0 } = {}) => {
	const [entries, updateEntries] = useState([])
	const [node, observeNode] = useState(null)

	const observer = useRef(null)

	useEffect(
		function createObserver() {
			if (root.current === null) return // desired root isn't there yet
			if (observer.current !== null) observer.current.disconnect()

			observer.current = new IntersectionObserver(
				e => {
					console.log(e)
					updateEntries(e)
				},
				{
					delay: 100,
					root: root.current,
					rootMargin,
					threshold,
					trackVisibility: false,
				}
			) // updateEntries

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

/**
 *
 */
function useRefCallback(cb) {
	const ref = useRef(null)
	const setRef = useCallback(node => {
		if (node === null) return

		if (ref.current) {
			// @TODO Make sure to cleanup any events/references added to the last instance
		}

		if (node !== null) cb(node)

		// Save a reference to the node
		ref.current = node
	}, [])

	return [ref, setRef]
}

/**
 * Assumes you know how many items you want to render in one segment (e.g. viewport width / 1 element width), or some random number.
 * This component handles virtualization and scrolling. You handle rendering. If you need masonry, take a look at this: https://github.com/jaredLunde/masonic/blob/master/src/index.tsx
 */
const VirtualScroll = ({ itemCount, className, renderItems }) => {
	const scrollRef = useRef()
	const [entries, observeNode] = useIntersect({ root: scrollRef, rootMargin: '0px 0px 400px 0px' })
	//const y1TopValues = useRef(new Map())
	const offsetY1 = useRef(0)
	const offsetY2 = useRef(0)
	const offsetY3 = useRef(0)
	const scrollCount1 = useRef(0)
	const scrollCount2 = useRef(0)
	const scrollCount3 = useRef(0)

	const [sentinelTop1, sentinelTop1Ref] = useRefCallback(node => observeNode(node))
	const [sentinelBottom1, sentinelBottom1Ref] = useRefCallback(node => observeNode(node))
	const [sentinelTop2, sentinelTop2Ref] = useRefCallback(node => observeNode(node))
	const [sentinelBottom2, sentinelBottom2Ref] = useRefCallback(node => observeNode(node))
	const [sentinelTop3, sentinelTop3Ref] = useRefCallback(node => observeNode(node))
	const [sentinelBottom3, sentinelBottom3Ref] = useRefCallback(node => observeNode(node))
	const sentinelStateRef = useRef({
		sentinelBottom1: {
			entry: {},
			ref: sentinelBottom1,
		},
		sentinelBottom2: {
			entry: {},
			ref: sentinelBottom2,
		},
		sentinelBottom3: {
			entry: {},
			ref: sentinelBottom3,
		},
		sentinelTop1: {
			entry: {},
			ref: sentinelTop1,
		},
		sentinelTop2: {
			entry: {},
			ref: sentinelTop2,
		},
		sentinelTop3: {
			entry: {},
			ref: sentinelTop3,
		},
	})

	const scrollTop = scrollRef.current ? scrollRef.current.scrollTop : 0
	const sentinelState = sentinelStateRef.current
	useMemo(() => {
		for (const nodeName in sentinelState) {
			const node = sentinelState[nodeName]
			for (const entry of entries) {
				if (entry.target === node.ref.current) node.entry = entry
			}
		}
	}, [entries])

	const sentinelTop1Entry = sentinelState.sentinelTop1.entry
	const sentinelTop2Entry = sentinelState.sentinelTop2.entry
	const sentinelTop3Entry = sentinelState.sentinelTop3.entry
	const sentinelBottom1Entry = sentinelState.sentinelBottom1.entry
	const sentinelBottom2Entry = sentinelState.sentinelBottom2.entry
	const sentinelBottom3Entry = sentinelState.sentinelBottom3.entry

	// scroll down
	useMemo(() => {
		if (sentinelBottom1Entry.isIntersecting) {
			console.log('Append 2 to 1', sentinelState)

			offsetY2.current = sentinelBottom1Entry.boundingClientRect.bottom - sentinelBottom1Entry.rootBounds.top + scrollTop
			scrollCount2.current = scrollCount1.current + 1
		}
	}, [sentinelBottom1Entry.isIntersecting])

	useMemo(() => {
		if (sentinelBottom2Entry.isIntersecting) {
			console.log('Append 3 to 2', sentinelState)

			offsetY3.current = sentinelBottom2Entry.boundingClientRect.bottom - sentinelBottom2Entry.rootBounds.top + scrollTop
			scrollCount3.current = scrollCount2.current + 1
		}
	}, [sentinelBottom2Entry.isIntersecting])

	useMemo(() => {
		if (sentinelBottom3Entry.isIntersecting) {
			console.log('Append 1 to 3', sentinelState)

			offsetY1.current = sentinelBottom3Entry.boundingClientRect.bottom - sentinelBottom3Entry.rootBounds.top + scrollTop
			scrollCount1.current = scrollCount3.current + 1
		}
	}, [sentinelBottom3Entry.isIntersecting])

	// scroll up
	useMemo(() => {
		if (sentinelTop1Entry.isIntersecting) {
			console.log('Pre block 3 to 1', sentinelState)

			--scrollCount3.current
			if (scrollCount3.current < 0) scrollCount3.current = 0
			offsetY3.current = offsetY1 + sentinelTop1Entry.boundingClientRect.top - sentinelTop1Entry.rootBounds.top
		}
	}, [sentinelTop1Entry.isIntersecting])

	useMemo(() => {
		if (sentinelTop2Entry.isIntersecting && initial.current === 0) {
			console.log('Pre block 1 to 2', sentinelState)

			--scrollCount1.current
			if (scrollCount1.current < 0) scrollCount1.current = 0
			offsetY1.current = sentinelTop2Entry.boundingClientRect.top - sentinelTop2Entry.rootBounds.top
		}
	}, [sentinelTop2Entry.isIntersecting])

	useMemo(() => {
		if (sentinelTop3Entry.isIntersecting) {
			console.log('Pre block 2 to 3', sentinelState)

			--scrollCount2.current
			if (scrollCount2.current < 0) scrollCount2.current = 0
			offsetY2.current = sentinelTop3Entry.boundingClientRect.top - sentinelTop3Entry.rootBounds.top
		}
	}, [sentinelTop3Entry.isIntersecting])

	const currentScroll1Count = scrollCount1.current
	const currentScroll2Count = scrollCount2.current
	const currentScroll3Count = scrollCount3.current
	const visibleChildren1 = useMemo(() => (offsetY1.current > 0 ? renderItems(currentScroll1Count, 1) : null), [currentScroll1Count])
	const visibleChildren2 = useMemo(() => renderItems(currentScroll2Count, 1), [currentScroll2Count])
	const visibleChildren3 = useMemo(() => (offsetY3.current > 0 ? renderItems(currentScroll3Count, 1) : null), [currentScroll3Count])

	// @TODO When over item count, stop scrolling

	//const totalHeight = Sentinel top y + Sentinel bottom y / segments;
	const block1Height =
		offsetY1.current > 0 ? (sentinelBottom1Entry.boundingClientRect?.top || 0) - (sentinelTop1Entry.boundingClientRect?.top || 0) : 0
	const block2Height = (sentinelBottom2Entry.boundingClientRect?.top || 0) - (sentinelTop2Entry.boundingClientRect?.top || 0)
	const block3Height =
		offsetY1.current > 0 ? (sentinelBottom3Entry.boundingClientRect?.top || 0) - (sentinelTop3Entry.boundingClientRect?.top || 0) : 0
	const totalBlockHeight = block1Height + block2Height + block3Height

	const totalHeight =
		(totalBlockHeight / (offsetY3.current > 0 ? 3 : offsetY1.current > 0 ? 2 : 1)) *
			(itemCount - (block1Height > 0 ? 1 : 0) - 1 - (block3Height > 0 ? 1 : 0)) +
		totalBlockHeight

	//only change this every x ms, or only when it gets higher; or use dummy element + contain strict; test later

	// todo: 6 IO on tiny sentinels vs. 3 IO on big elements benchmark

	// ggf. 'pointer-events': 'none' beim parent
	// wenn die will-change jeweils GPU layer forcen, dann auch entfernen

	// @TODO: Render 1st block after 3rd block on initial render
	return (
		<div style={{ overflowY: 'scroll', willChange: 'scroll-position' }} className={className} ref={scrollRef}>
			<div
				style={{
					height: '100%', // immer 100% und padding-bottom?
					paddingBottom: totalHeight + 'px',
					position: 'relative' /* unneeded? */,
					willChange: 'contents',
				}}>
				{offsetY1.current > 0 ? (
					<div
						className={className + '_container'}
						style={{
							position: 'absolute',
							top: '0',
							transform: `translateY(${offsetY1.current}px)`,
							willChange: 'transform',
						}}>
						<div className="sentinel-top" ref={sentinelTop1Ref} />
						{visibleChildren1}
						<div className="sentinel-bottom" ref={sentinelBottom1Ref} />
					</div>
				) : null}
				<div
					className={className + '_container'}
					style={{
						position: 'absolute',
						top: '0',
						transform: `translateY(${offsetY2.current}px)`,
						willChange: 'transform',
					}}>
					<div className="sentinel-top" ref={sentinelTop2Ref} />
					{visibleChildren2}
					<div className="sentinel-bottom" ref={sentinelBottom2Ref} />
				</div>
				{offsetY3.current > 0 ? (
					<div
						className={className + '_container'}
						style={{
							position: 'absolute',
							top: '0',
							transform: `translateY(${offsetY3.current}px)`,
							willChange: 'transform',
						}}>
						<div className="sentinel-top" ref={sentinelTop3Ref} />
						{visibleChildren3}
						<div className="sentinel-bottom" ref={sentinelBottom3Ref} />
					</div>
				) : null}
			</div>
		</div>
	)
}

export default memo(VirtualScroll)
