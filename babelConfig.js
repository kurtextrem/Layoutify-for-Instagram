'use strict'
module.exports = (isProd, options = {}) => ({
	comments: !isProd,
	presets: [
		[require.resolve('babel-preset-env'), {
			modules: options.modules || false,
			targets: isProd ? { chrome: 55 } : {
				browsers: 'last 2 Chrome versions'
			},
			loose: true,
			useBuiltIns: false,
			exclude: [
				'transform-regenerator',
				'transform-es2015-typeof-symbol'
			]
		}],
		'stage-0'
	],
	plugins: isProd ? [
		[require.resolve('babel-plugin-transform-imports'), {
			reactstrap: {
				transform: 'reactstrap/lib/${member}',
				preventFullImport: true
			},
			history: {
				transform: 'history/es/${member}',
				preventFullImport: true
			}
		}],
		require.resolve('babel-plugin-transform-react-constant-elements'),
		[require.resolve('babel-plugin-transform-react-remove-prop-types'), { removeImport: true, additionalLibraries: ['react-immutable-proptypes'] }],
		[require.resolve('babel-plugin-transform-react-jsx'), { pragma: 'h', useBuiltIns: true }],
		[require.resolve('babel-plugin-jsx-pragmatic'), {
			module: 'preact',
			export: 'h',
			import: 'h'
		}],

		// 'module:fast-async', - enabled from Chrome 55
		require.resolve('babel-plugin-loop-optimizer'),
		require.resolve('babel-plugin-closure-elimination'),
		require.resolve('./pure-plugin.js')
	] : [
			[require.resolve('babel-plugin-transform-react-jsx'), { pragma: 'h', useBuiltIns: true }]
			// 'runtyper'
		],
	cacheDirectory: true
})
