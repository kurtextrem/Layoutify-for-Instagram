import { createElement } from 'nervjs'

// @TODO: Implement paging system to prevent 1000+ posts getting rendered on page load
// https://alligator.io/react/react-infinite-scroll/
export default function Posts(items, renderPost, categories) {
	if (!items) return null
	if (!categories) return items.map(renderPost)

	const collections = { '0': [] }

	let x = 0
	for (let i = 0; i < items.length; ++i) {
		const colIds = items[i].saved_collection_ids
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
				<a key={id} href={`#${id}`}>
					<span className="badge badge-secondary">{c}</span>
				</a>
			)
			posts.push(
				<h1 key={id} className="saved--heading" id={id}>
					<a href={`#${id}`} className="badge badge-primary">
						{c}
					</a>
				</h1>
			)
		}

		const arr = collections[c]
		for (x = 0; x < arr.length; ++x) {
			posts.push(renderPost(items[arr[x]]))
		}
	}

	const headingsContainer = (
		<div key="headings" className="saved--headings">
			{headings}
		</div>
	)
	posts[0] = headingsContainer
	return posts
}
