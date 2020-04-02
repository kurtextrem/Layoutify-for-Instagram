import { h } from 'preact'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'preact/compat'

// Generic hook for detecting scroll:
const useScrollAware = () => {
	const [scrollTop, setScrollTop] = useState(0)
	const ref = useRef()
	const animationFrame = useRef()

	const onScroll = useCallback(e => {
		if (animationFrame.current) {
			cancelAnimationFrame(animationFrame.current)
		}
		animationFrame.current = requestAnimationFrame(() => {
			setScrollTop(e.target.scrollTop)
		})
	}, [])

	useEffect(() => {
		const scrollContainer = ref.current

		setScrollTop(scrollContainer.scrollTop)
		scrollContainer.addEventListener('scroll', onScroll)
		return () => scrollContainer.removeEventListener('scroll', onScroll)
	}, [])

	return [scrollTop, ref]
}

// VirtualScroll component
const VirtualScroll = ({
	itemCount,
	height,
	getChildHeight,
	getChildWidth,
	renderAheadAbove = 4,
	minItemHeight,
	minItemWidth,
	renderAheadBelow = 4,
	className,
	renderItem,
}) => {
	const childPositions = useMemo(() => {
		const results = [0]
		for (let i = 1; i < itemCount; i++) {
			results.push(results[i - 1] + getChildHeight(i - 1))
		}
		return results
	}, [getChildHeight, itemCount])

	const [scrollTop, ref] = useScrollAware()
	const totalHeight = childPositions[itemCount - 1] + getChildHeight(itemCount - 1)

	const firstVisibleNode = useMemo(() => findStartNode(scrollTop, childPositions, itemCount), [scrollTop, childPositions, itemCount])

	const startNode = Math.max(0, firstVisibleNode - renderAheadAbove)

	const lastVisibleNode = useMemo(() => findEndNode(childPositions, firstVisibleNode, itemCount, height), [
		childPositions,
		firstVisibleNode,
		itemCount,
		height,
	])
	const endNode = Math.min(itemCount - 1, lastVisibleNode + renderAheadBelow)
	const visibleNodeCount = endNode - startNode + 1
	const offsetY = childPositions[startNode]
	// console.log(height, scrollTop, startNode, endNode);
	const visibleChildren = useMemo(() => new Array(visibleNodeCount).fill(null).map((_, index) => renderItem(index + startNode)), [
		startNode,
		visibleNodeCount,
		renderItem,
	])

	return (
		<div style={{ height, overflowY: 'scroll' }} ref={ref} class={className}>
			<div
				style={{
					height: totalHeight /* 100% */,
					overflow: 'hidden' /* unneeded? */,
					position: 'relative' /* unneeded? */,
					willChange: 'transform' /* unneeded? */,
				}}>
				<div
					class={className + 'container'}
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

/**
 *
 */
function findStartNode(scrollTop, nodePositions, itemCount) {
	let startRange = 0
	let endRange = itemCount - 1
	while (endRange !== startRange) {
		// console.log(startRange, endRange);
		const middle = Math.floor((endRange - startRange) / 2 + startRange)

		if (nodePositions[middle] <= scrollTop && nodePositions[middle + 1] > scrollTop) {
			// console.log("middle", middle);
			return middle
		}

		if (middle === startRange) {
			// edge case - start and end range are consecutive
			// console.log("endRange", endRange);
			return endRange
		} else if (nodePositions[middle] <= scrollTop) {
			startRange = middle
		} else {
			endRange = middle
		}
	}
	return itemCount
}

/**
 *
 */
function findEndNode(nodePositions, startNode, itemCount, height) {
	let endNode
	for (endNode = startNode; endNode < itemCount; endNode++) {
		// console.log(nodePositions[endNode], nodePositions[startNode]);
		if (nodePositions[endNode] > nodePositions[startNode] + height) {
			// console.log(endNode);
			return endNode
		}
	}
	return endNode
}

export default memo(VirtualScroll)
