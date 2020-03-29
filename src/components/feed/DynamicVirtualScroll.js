/**
 * Virtual scroll driver for dynamic row heights
 *
 * License: GNU LGPLv3.0+
 * (c) Vitaliy Filippov 2018+
 *
 * @param props { totalItems, minRowHeight, viewportHeight, scrollTop }
 * @param oldState - previous state object
 * @param getRenderedItemHeight = (itemIndex) => height
 *     this function MUST return the height of currently rendered item or 0 if it's not currently rendered
 *     the returned height MUST be >= props.minRowHeight
 *     the function MAY cache heights of rendered items if you want your list to be more responsive
 * @return new state object
 *     you MUST re-render your list when any state values change
 *     you MUST preserve all keys in the state object and pass it back via `oldState` on the next run
 *     you MUST use the following keys for rendering:
 *         newState.targetHeight - height of the 1px wide invisible div you should render in the scroll container
 *         newState.topPlaceholderHeight - height of the first (top) placeholder. omit placeholder if it is 0
 *         newState.firstItem - first item to be rendered
 *         newState.itemCount - item count to be renderer after top placeholder. omit items if it is 0
 *         newState.bottomPlaceholderHeight - height of the second (middle) placeholder. omit placeholder if it is 0
 */
export function virtualScrollDriver(props, oldState, getRenderedItemHeight, getRenderedItemWidth) {
	const viewportHeight = props.viewportHeight
	const viewportWidth = props.viewportWidth
	const viewportItemYCount = Math.ceil(viewportHeight / props.minRowHeight) // +border?
	const viewportItemXCount = Math.floor(viewportWidth / props.minItemWidth)
	//const itemsPerRow = viewportItemYCount * viewportItemXCount
	const newState = {
		avgRowHeight: oldState.avgRowHeight,
		bottomPlaceholderHeight: 0,
		firstItem: 0,
		itemCount: 0,
		lastItemsTotalHeight: oldState.lastItemsTotalHeight,
		scrollHeightInItems: oldState.scrollHeightInItems,
		targetHeight: 0,
		topPlaceholderHeight: 0,
		totalItems: props.totalItems,
		viewportHeight,
		viewportItemXCount,
		viewportItemYCount,
		viewportWidth,
	}

	if (!oldState.viewportHeight) {
		oldState = { ...oldState }
		for (const k in newState) {
			oldState[k] = oldState[k] || 0
		}
	}

	if (2 * viewportItemXCount >= props.totalItems) {
		// We need at least 2*viewportItemXCount to perform virtual scrolling
		return newState
	}

	{
		let lastItemsHeight = 0,
			lastVisibleItems = 0
		let lastItemSize
		while (lastItemsHeight < viewportHeight) {
			const index = props.totalItems - 1 - lastVisibleItems
			if (index < 0) break

			lastItemSize = getRenderedItemHeight(index)
			if (lastItemSize == 0) lastItemSize = 0 // Some required items in the end are missing
			lastItemsHeight += lastItemSize < props.minRowHeight ? props.minRowHeight : lastItemSize

			lastVisibleItems += viewportItemXCount
		}

		newState.scrollHeightInItems = props.totalItems - lastVisibleItems + (lastItemsHeight - viewportHeight) / (lastItemSize || 1)

		// Calculate heights of the rest of items
		while (lastVisibleItems < newState.viewportItemYCount) {
			const index = props.totalItems - 1 - lastVisibleItems
			if (index < 0) break

			lastItemsHeight += getRenderedItemHeight(index)
			lastVisibleItems += viewportItemXCount
		}
		newState.lastItemsTotalHeight = lastItemsHeight
		newState.avgRowHeight = lastItemsHeight / lastVisibleItems
		newState.avgRowHeight =
			!oldState.avgRowHeight || newState.avgRowHeight > oldState.avgRowHeight ? newState.avgRowHeight : oldState.avgRowHeight
	}

	newState.targetHeight = newState.avgRowHeight * newState.scrollHeightInItems + newState.viewportHeight

	const scrollTop = props.scrollTop
	let scrollPos = scrollTop / (newState.targetHeight - newState.viewportHeight)
	if (scrollPos > 1) {
		// Rare case - avgRowHeight isn't enough and we need more
		// avgRowHeight will be corrected after rendering all items
		scrollPos = 1
	}

	let firstVisibleItem = scrollPos * newState.scrollHeightInItems
	const firstVisibleItemOffset = firstVisibleItem - Math.floor(firstVisibleItem)

	// FIXME: Render some items before current for smoothness
	firstVisibleItem = Math.floor(firstVisibleItem)
	const firstVisibleItemHeight = getRenderedItemHeight(firstVisibleItem) || newState.avgRowHeight
	newState.topPlaceholderHeight = scrollTop - firstVisibleItemHeight * firstVisibleItemOffset
	if (newState.topPlaceholderHeight < 0) {
		newState.topPlaceholderHeight = 0
	}
	if (firstVisibleItem + newState.viewportItemYCount >= props.totalItems - newState.viewportItemYCount) {
		// Only one placeholder is required
		let sum = 0,
			count = props.totalItems - newState.viewportItemYCount - firstVisibleItem
		count = count > 0 ? count : 0
		for (let i = 0; i < count; ++i) {
			const itemSize = getRenderedItemHeight(i + newState.firstItem)
			if (!itemSize) {
				// Some required items in the middle are missing
				return newState
			}
			sum += itemSize
		}
		const correctedAvg = (sum + newState.lastItemsTotalHeight) / (count + newState.viewportItemYCount)
		if (correctedAvg > newState.avgRowHeight) {
			newState.avgRowHeight = correctedAvg
		}
	} else {
		newState.firstItem = firstVisibleItem // 0
		newState.itemCount = newState.viewportItemYCount //.000000       2
		let sum = 0
		for (let i = 0; i < newState.itemCount; ++i) {
			const itemSize = getRenderedItemHeight(i + newState.firstItem)
			if (!itemSize) {
				// Some required items in the middle are missing
				return newState
			}
			sum += itemSize
		}
		newState.bottomPlaceholderHeight = newState.targetHeight - sum - newState.lastItemsTotalHeight - newState.topPlaceholderHeight
		if (newState.bottomPlaceholderHeight < 0) {
			newState.bottomPlaceholderHeight = 0
		}
		const correctedAvg = (sum + newState.lastItemsTotalHeight) / (newState.itemCount + newState.viewportItemYCount)
		if (correctedAvg > newState.avgRowHeight) {
			newState.avgRowHeight = correctedAvg
		}
	}
	return newState
}
