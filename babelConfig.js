'use strict'

const resolve = require.resolve

module.exports = (isProd, options = {}) => ({
	babelrc: false,
	comments: !isProd,
	presets: [
		[resolve('@babel/preset-stage-0'), { loose: true, useBuiltIns: true, decoratorsLegacy: true, pipelineProposal: 'minimal' }],
		[
			resolve('@babel/preset-env'),
			{
				modules: options.modules || false,
				targets: {
					browsers: isProd ? 'Chrome > 54' : 'unreleased Chrome versions',
				},
				loose: true,
				useBuiltIns: false,
				shippedProposals: true,
				exclude: [
					'transform-regenerator', // for fast-async
					'transform-typeof-symbol',
				],
			},
		],
	],
	plugins: isProd
		? [
				/*[
					resolve('@babel/plugin-transform-runtime'),
					{
						polyfill: false,
						regenerator: false,
					},
				], // Increases bundle size */
				[
					resolve('babel-plugin-transform-imports'),
					{
						reactstrap: {
							transform: 'reactstrap/lib/${member}',
							preventFullImport: true,
						},
					},
				],
				[
					resolve('babel-plugin-transform-react-remove-prop-types'),
					{ removeImport: true, additionalLibraries: ['react-immutable-proptypes'] },
				],
				resolve('babel-plugin-transform-react-pure-class-to-function'),
				[resolve('@babel/plugin-transform-react-jsx'), { pragma: 'createElement', useBuiltIns: true }],
				//resolve('@babel/plugin-transform-react-constant-elements'), // see https://github.com/facebookincubator/create-react-app/issues/553#issuecomment-359196326
				//[resolve('babel-plugin-transform-hoist-nested-functions'), { methods: true }], // see ^^^
				resolve('babel-plugin-closure-elimination'), // @TODO: Benchmark w/ & w/o, see ^^^

				// 'module:fast-async', - enabled from Chrome 55
				resolve('babel-plugin-annotate-pure-calls'),
				resolve('./pure-plugin.js'),
				[resolve('@babel/plugin-transform-strict-mode'), { strict: true }],
				// 'emotion/babel'
		  ]
		: [
				[resolve('@babel/plugin-transform-react-jsx'), { pragma: 'createElement', useBuiltIns: true }],
				resolve('@babel/plugin-transform-react-jsx-source'),
				resolve('babel-plugin-transform-console-log-variable-names'),
				resolve('babel-plugin-console-groupify'),
				[resolve('@babel/plugin-transform-strict-mode'), { strict: true }],
				// 'emotion/babel'
				// 'runtyper'
		  ],
})
