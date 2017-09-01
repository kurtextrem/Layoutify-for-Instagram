'use strict'
const resolve = require.resolve

module.exports = (isProd, options = {}) => ({
	babelrc: false,
	comments: !isProd,
	presets: [
		[
			resolve('babel-preset-env'),
			{
				modules: options.modules || false,
				targets: {
					browsers: isProd ? 'Chrome > 54' : 'Chrome > 60', //'unreleased Chrome versions',
				},
				loose: true,
				useBuiltIns: false,
				exclude: [
					'transform-regenerator', // for fast-async
					'transform-es2015-typeof-symbol',
				],
			},
		],
		'stage-0',
	],
	plugins: isProd
		? [
				[resolve('babel-plugin-transform-object-rest-spread'), { useBuiltIns: true }],
				[
					resolve('babel-plugin-transform-imports'),
					{
						reactstrap: {
							transform: 'reactstrap/lib/${member}',
							preventFullImport: true,
						},
						history: {
							transform: 'history/es/${member}',
							preventFullImport: true,
						},
					},
				],
				resolve('babel-plugin-transform-react-constant-elements'),
				[
					resolve('babel-plugin-transform-react-remove-prop-types'),
					{ removeImport: true, additionalLibraries: ['react-immutable-proptypes'] },
				],
				[resolve('babel-plugin-transform-react-jsx'), { pragma: 'h', useBuiltIns: true }],

				// 'module:fast-async', - enabled from Chrome 55
				resolve('babel-plugin-loop-optimizer'),
				resolve('babel-plugin-closure-elimination'),
				resolve('./pure-plugin.js'),
				// 'emotion/babel'
			]
		: [
				[resolve('babel-plugin-transform-react-jsx'), { pragma: 'h', useBuiltIns: true }],
				resolve('babel-plugin-transform-react-jsx-source'),
				// 'emotion/babel'
				// 'runtyper'
			],
})
