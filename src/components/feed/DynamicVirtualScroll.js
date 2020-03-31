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
 *         newState.containerHeight - height of the 1px wide invisible div you should render in the scroll container
 *         newState.topPlaceholderHeight - height of the first (top) placeholder. omit placeholder if it is 0
 *         newState.firstItem - first item to be rendered
 *         newState.itemCount - item count to be renderer after top placeholder. omit items if it is 0
 *         newState.bottomPlaceholderHeight - height of the bottom placeholer. omit paceholder middle if it is 0
 */
export function virtualScrollDriver(props, oldState, getRenderedItemHeight, getRenderedItemWidth) {
	const viewportHeight = props.viewportHeight
	const viewportWidth = props.viewportWidth
	const viewportMinItemYCount = Math.ceil(viewportHeight / props.minRowHeight) // +border?
	const viewportMinItemXCount = Math.floor(viewportWidth / props.minItemWidth)
	const totalItems = props.totalItems

	// @TODO: Position rows using transform? https://dev.to/adamklein/build-your-own-virtual-scroll-part-i-11ib

	const newState = {
		avgRowHeight: oldState.avgRowHeight || 0,
		bottomItemsTotalHeight: oldState.bottomItemsTotalHeight || 0,
		bottomPlaceholderHeight: 0,
		containerHeight: 0,
		firstMainItem: 0,
		firstOverscanBottomItem: 0,
		firstOverscanTopItem: 0, // @idea: if we reach very high numbers, the first items might not be relevant anymore; so thoose more relevant numbers such as N/2 as start
		firstTopItem: 0,
		itemBottomCount: oldState.itemBottomCount || 0,
		itemMainCount: 0,
		overscanBottomCount: 0,
		overscanTopCount: 0,
		scrollHeightInItems: oldState.scrollHeightInItems || 0,
		topPlaceholderHeight: 0,
		totalItems: props.totalItems,
		viewportHeight,
		viewportMinItemXCount,
		viewportMinItemYCount,
		viewportWidth,
	}

	let _oldState = oldState
	if (_oldState.viewportHeight === undefined) _oldState = newState // first run

	if (2 * viewportMinItemXCount >= totalItems) return newState // We need at least 2*viewportMinItemXCount to perform virtual scrolling

	// Initially render as many items that fit the viewport as possible at the start. This gives us the ability to avg. the row height, needed for calculions later.
	// @TODO Skip rendering of those after initial. Only show them when needed.
	let bottomItemsHeight = _oldState.bottomItemsTotalHeight,
		bottomVisibleItems = _oldState.itemBottomCount
	bottomCalc: {
		if (bottomVisibleItems !== 0) break bottomCalc // Skip this calculation after initial rendering; we just keep initial values

		let topItemSize
		while (bottomItemsHeight < viewportHeight) {
			topItemSize = getRenderedItemHeight(totalItems - 1 - bottomVisibleItems)
			if (topItemSize === null) {
				console.error('No size found for the first item row, which is required.')
				topItemSize = 0
			}

			bottomItemsHeight += topItemSize < props.minRowHeight ? props.minRowHeight : topItemSize
			bottomVisibleItems += viewportMinItemXCount // put the cursor to the next row, as all items in a row are assumed to have the same height | @TODO don't do this; check if one item has height 0 and don't count it, but continue
		}

		newState.scrollHeightInItems = bottomVisibleItems / viewportMinItemXCount + (bottomItemsHeight - viewportHeight) / (topItemSize || 1)

		// Calculate heights of the rest of items that fit
		while (bottomVisibleItems / viewportMinItemXCount < viewportMinItemYCount) {
			topItemSize = getRenderedItemHeight(totalItems - 1 - bottomVisibleItems)
			if (topItemSize === null) topItemSize = 0

			bottomItemsHeight += topItemSize
			bottomVisibleItems += viewportMinItemXCount // put the cursor to the next row, as all items in a row are assumed to have the same height
		}
	}

	newState.itemBottomCount = bottomVisibleItems
	newState.bottomItemsTotalHeight = bottomItemsHeight

	const avgRowHeight = bottomItemsHeight / (bottomVisibleItems / viewportMinItemXCount)
	newState.avgRowHeight = avgRowHeight < _oldState.avgRowHeight ? _oldState.avgRowHeight : avgRowHeight // assuming the height always gets bigger

	{
		/*let viewportItemsHeight = 0,
		amountViewportVisibleItems = 0,
		indexOfVisibleItems = 0
	let lastItemHeight = 0

	// calculate height of items that fit the viewport; We use this to guess which row is visible
	while (viewportItemsHeight < viewportHeight) {
		lastItemHeight = getRenderedItemHeight(amountViewportVisibleItems)
		if (lastItemHeight === null) continue

		viewportItemsHeight += lastItemHeight
		amountViewportVisibleItems += viewportMinItemXCount
		//if (lastItemHeight !== 0)
	}

	const scrollTop = props.scrollTop
	const rowVisible = Math.floor(scrollTop / viewportItemsHeight)

	const rowTotals = rowVisible + viewportMinItemYCount
	for (let i = rowVisible; i < rowTotals; ++i) {
		lastItemHeight = getRenderedItemHeight(i)
		if (lastItemHeight === null) lastItemHeight = props.minRowHeight

		viewportItemsHeight += lastItemHeight
		amountViewportVisibleItems += viewportMinItemXCount
	}

	const overscanTopIndex = indexOfVisibleItems - props.overscan * viewportMinItemXCount
	const overscanTopEndIndex = indexOfVisibleItems / viewportMinItemXCount
	for (let i = overscanTopIndex; i < overscanTopEndIndex; ++i) {
		if (i < 0) break // we're at the start; no top overscan

		lastItemHeight = getRenderedItemHeight(amountViewportVisibleItems)
		if (lastItemHeight === null) lastItemHeight = props.minRowHeight

		viewportItemsHeight += lastItemHeight
		amountViewportVisibleItems += viewportMinItemXCount
	}

	const overscanBottomIndex = Math.min(indexOfVisibleItems + props.overscan, totalItems)
	for (let i = indexOfVisibleItems; i < overscanBottomIndex; ++i) {
		lastItemHeight = getRenderedItemHeight(amountViewportVisibleItems)
		if (lastItemHeight === null) lastItemHeight = props.minRowHeight

		viewportItemsHeight += lastItemHeight
		amountViewportVisibleItems += viewportMinItemXCount
	}

	newState.containerHeight = newState.avgRowHeight * (totalItems - amountViewportVisibleItems) + viewportItemsHeight
	//newState.containerHeight = newState.avgRowHeight * newState.scrollHeightInItems + newState.viewportHeight

	let scrollPos = scrollTop / (newState.containerHeight - newState.viewportHeight)
	if (scrollPos > 1) {
		// Rare case - avgRowHeight isn't enough and we need more
		// avgRowHeight will be corrected after rendering all items
		scrollPos = 1
	}

	/*newState.scrollHeightInItems =
		totalItems / viewportMinItemXCount -
		indexOfVisibleItems / viewportMinItemXCount +
		(viewportItemsHeight - viewportHeight) / (lastItemHeight || 1)*/
		//let firstVisibleItem = scrollPos * newState.scrollHeightInItems
		//const firstVisibleItem = indexOfVisibleItems / viewportMinItemXCount
		//const firstVisibleItemOffset = firstVisibleItem - Math.floor(firstVisibleItem)
		//firstVisibleItem = Math.floor(firstVisibleItem) * viewportMinItemXCount
		/*const firstVisibleItemHeight = getRenderedItemHeight(firstVisibleItem) || newState.avgRowHeight

	console.log({
		amountViewportVisibleItems,
		firstVisibleItem,
		indexOfVisibleItems,
		rowVisible,
		scrollPos,
		scrollTop,
	})*/
	}

	const overscanTopAmount = props.overscanTop * viewportMinItemXCount
	const overscanBottomAmount = props.overscanBottom * viewportMinItemXCount
	//newState.containerHeight = newState.avgRowHeight * (totalItems - bottomVisibleItems) + bottomItemsHeight
	newState.containerHeight = newState.avgRowHeight * newState.scrollHeightInItems + newState.viewportHeight

	// @HERE: Overscan trennen von mitte; oder halt, dass im viewport eigentlich overscroll+N sichtbar ist und nicht overscroll
	const scrollTop = props.scrollTop
	let scrollPos = scrollTop / (newState.containerHeight - newState.viewportHeight)
	if (scrollPos > 1) {
		// Rare case - avgRowHeight isn't enough and we need more
		// avgRowHeight will be corrected after rendering all items
		scrollPos = 1
	}

	let firstVisibleItem = scrollPos * newState.scrollHeightInItems
	const firstVisibleItemOffset = firstVisibleItem - Math.floor(firstVisibleItem)

	firstVisibleItem = Math.floor(firstVisibleItem) * viewportMinItemXCount
	const firstVisibleItemHeight = getRenderedItemHeight(firstVisibleItem) || newState.avgRowHeight

	const firstOverscanTopItem = firstVisibleItem - overscanTopAmount
	let overscanTopHeight = 0
	if (firstOverscanTopItem >= 0) {
		newState.firstOverscanTopItem = firstVisibleItem - overscanTopAmount
		newState.overscanTopCount = overscanTopAmount
		overscanTopHeight = getRenderedItemHeight(firstOverscanTopItem)
	}

	const firstOverscanBottomItem = firstVisibleItem + bottomVisibleItems
	if (firstOverscanBottomItem + overscanBottomAmount < totalItems) {
		newState.firstOverscanBottomItem = firstVisibleItem + bottomVisibleItems
		newState.overscanBottomCount = overscanBottomAmount
	}

	newState.topPlaceholderHeight = scrollTop - firstVisibleItemHeight * firstVisibleItemOffset - overscanTopHeight
	if (newState.topPlaceholderHeight < 0) newState.topPlaceholderHeight = 0

	if (firstVisibleItem + bottomVisibleItems >= totalItems - bottomVisibleItems) {
		// Only one placeholder is required
		let sum = 0,
			count = totalItems - bottomVisibleItems - firstVisibleItem
		count = count > 0 ? count : 0
		for (let i = 0; i < count; ++i) {
			const itemSize = getRenderedItemHeight(i + newState.firstMainItem)
			if (itemSize === null) return newState // Some required items in tmiddleemi are missing

			sum += itemSize
		}
		const correctedAvg = sum / (count + bottomVisibleItems)
		if (correctedAvg > newState.avgRowHeight) newState.avgRowHeight = correctedAvg
	} else {
		newState.firstMainItem = firstVisibleItem
		newState.itemMainCount = bottomVisibleItems

		console.log({
			bottomVisibleItems,
			firstMainItem: newState.firstMainItem,
			firstVisibleItem,
			firstVisibleItemHeight,
			firstVisibleItemOffset,
			itemMainCount: bottomVisibleItems,
			scrollPos,
			scrollTop,
			viewportMinItemXCount,
			viewportMinItemYCount,
		})

		let sum = 0
		for (let i = newState.firstMainItem; i < bottomVisibleItems; ++i) {
			const itemSize = getRenderedItemHeight(i)
			if (itemSize === null) {
				console.warn('no item height', i)
				return newState
			}

			sum += itemSize
		}

		newState.bottomPlaceholderHeight = newState.containerHeight - sum - bottomItemsHeight - newState.topPlaceholderHeight
		if (newState.bottomPlaceholderHeight < 0) newState.bottomPlaceholderHeight = 0

		const correctedAvg = (sum + newState.bottomItemsTotalHeight) / (2 * bottomVisibleItems)
		if (correctedAvg > newState.avgRowHeight) newState.avgRowHeight = correctedAvg
	}

	console.log(newState)
	return newState
}
