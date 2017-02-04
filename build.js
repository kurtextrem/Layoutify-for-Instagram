/* jshint node: true, devel: true */
var shell = require('shelljs'),
	zipdir = require('zip-dir');

(function () {
	'use strict'

	var Build = function () {
		this.args = process.argv.slice(2)
		this.args.forEach(function (arg) {
			if (this[arg]) {
				this[arg]()
			} else {
				console.warn('undefined option', arg)
			}
		}.bind(this))
	}

	Build.prototype.copy = function () {
		this.copyLocales()
		this.copyImg()
		this.copyHTML()
		this.copyCSS()
	}

	Build.prototype.copyImg = function () {
		shell.mkdir('dist/img')
		shell.cp('src/img/*.png', 'dist/img')
	}

	Build.prototype.copyLocales = function () {
		shell.cp('-rf', 'src/_locales', 'dist')
	}

	Build.prototype.copyCSS = function () {
		shell.cp('src/*.css', 'dist')
	}

	Build.prototype.copyHTML = function () {
		shell.cp('src/*.html', 'dist')
	}

	Build.prototype.replaceJSON = function () {
		//shell.sed('-i', 'inject.js', 'inject.min.js', 'dist/manifest.json')
	}

	Build.prototype.buildZip = function () {
		zipdir('dist', { saveTo: 'dist.zip' }, function (err) {
			if (err)
				console.error(err)
		})
	}

	new Build()
}());
