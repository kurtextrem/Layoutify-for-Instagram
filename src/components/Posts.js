import { Component, createElement } from 'nervjs'

// @TODO: Implement paging system to prevent 1000+ posts getting rendered on page load
export default class Posts extends Component {
	/*shouldComponentUpdate(nextProps, nextState) {
		return (
			nextProps.items !== this.props.items || nextProps.renderPost !== this.props.renderPost || nextProps.categorys !== this.props.categorys
		)
	}*/

	render() {
		const { items, renderPost, categorys } = this.props
		console.log(this.props)
		if (!items) return null
		if (!categorys) return items.map(renderPost)

		const collections = { '0': [] }

		const headings = []
		const posts = []

		let x = 0
		for (let i = 0; i < items.length; ++i) {
			const colIds = items[i].saved_collection_ids
			if (Array.isArray(colIds) && colIds[0] !== undefined) {
				for (x = 0; x < colIds.length; ++x) {
					const colId = colIds[x]
					if (collections[colId] === undefined) collections[colId] = []
					collections[colId].push(i)
				}
			} else {
				collections[0].push(i)
			}
		}

		for (const c in collections) {
			if (c !== '0') {
				const id = `col_${c}`
				headings.push(
					<a href={`#${id}`}>
						<span className="badge badge-secondary">{c}</span>
					</a>
				)
				posts.push(
					<h1 className="saved--heading" id={id}>
						<a href={`#${id}`}>{c}</a>
					</h1>
				)
			}

			const arr = collections[c]
			for (x = 0; x < arr.length; ++x) {
				posts.push(renderPost(items[arr[x]]))
			}
		}

		const headingsContainer = <div className="saved--headings">{headings}</div>
		return [headingsContainer, posts]
	}
}
