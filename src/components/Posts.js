// @TODO: Implement paging system to prevent 1000+ posts getting rendered on page load
// https://alligator.io/react/react-infinite-scroll/
/**
 *
 */
const Posts = (items, renderPost) => (!items ? null : items.map(renderPost))
export default Posts
