module.exports = {
	plugins: [
		require('autoprefixer'),
		/*require('cssnano', {
			preset: [
				'default',
				{
					discardComments: { removeAll: true },
					minifySelectors: false,
				},
			],
		}), // 03/09/2018: Minifies [src=""] to [src] */
		require('postcss-discard-unused'),
		require('postcss-merge-idents'),
		require('postcss-reduce-idents'),
		require('postcss-zindex'),
	],
}
