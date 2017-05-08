import { h, render, Component } from 'preact' // eslint-disable-line no-unused-vars

export default class About extends Component {
	shouldComponentUpdate() {
		return false
	}

	render() {
		return (
			<div>
				<h3>About</h3>
				<p>This extension does not store any data of your Instagram account apart from on your PC. The Code is Open Source on <a href="https://github.com/kurtextrem/Improved-for-Instagram" target="_blank">GitHub</a>.</p>
				<p>This is a beta version. Please report any bugs on <a href="https://github.com/kurtextrem/Improved-for-Instagram/issues" target="_blank">GitHub</a>.</p>

				<h3>Legal</h3>
				<p>Plus Icon by <a href="https://dribbble.com/enesdal" target="_blank">Enes Dal</a> Creative Commons (Attribution 3.0 Unported). I've added shadows and modified the color.</p>
				<p>This project is in no way affiliated with, authorized, maintained, sponsored or endorsed by Instagram or any of its affiliates or subsidiaries. This is an independent project. Use at your own risk.</p>
			</div>
		)
	}
}
