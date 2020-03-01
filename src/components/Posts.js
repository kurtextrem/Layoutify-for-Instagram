import { h, Fragment } from 'preact'

// @TODO: Implement paging system to prevent 1000+ posts getting rendered on page load
// https://alligator.io/react/react-infinite-scroll/
/**
 *
 */
export default function Posts(items, renderPost, categories) {
	if (!items) return null
	if (!categories) return items.map(renderPost)

	const collections = { '0': [] }

	let x = 0
	for (const [i, element] of items.entries()) {
		const colIds = element.saved_collection_ids
		if (Array.isArray(colIds) && colIds.length !== 0) {
			for (x = 0; x < colIds.length; ++x) {
				const colId = colIds[x]
				if (collections[colId] === undefined) collections[colId] = []
				collections[colId].push(i)
			}
		} else {
			collections[0].push(i)
		}
	}

	const posts = [,] // we save one array allocation by reservating the first entry for the headingsContainer
	const headings = []
	for (const c in collections) {
		if (c !== '0') {
			const id = `col_${c}`
			headings.push(
				<>
					<a key={id} href={`#${id}`}>
						<span class="badge badge-secondary">{c}</span>
					</a>
					<i class="material-icons">edit</i>
				</>
			)
			posts.push(
				<h1 key={id} class="saved--heading" id={id}>
					<a href={`#${id}`} class="badge badge-primary">
						{c}
					</a>
				</h1>
			)
		}

		const array = collections[c]
		for (x = 0; x < array.length; ++x) {
			posts.push(renderPost(items[array[x]]))
		}
	}

	const headingsContainer = (
		<div key="headings" class="saved--headings">
			{headings}
		</div>
	)
	posts[0] = headingsContainer
	return posts
}
