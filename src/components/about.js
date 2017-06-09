import { Component, h, render } from 'preact' // eslint-disable-line no-unused-vars

export default class About extends Component {
	shouldComponentUpdate() {
		return false
	}

	render() {
		return (
			<div>
				<h3>About</h3>
				<p>Improved Layout for Instagram does not store any data of your Instagram account apart from on your PC. The Code is Open Source on <a href="https://github.com/kurtextrem/Improved-for-Instagram" target="_blank" rel="noopener">GitHub</a>.</p>
				<p>This is a beta version. If you find any issues, please report any bugs on <a href="https://github.com/kurtextrem/Improved-for-Instagram/issues" target="_blank" rel="noopener">GitHub</a> or mail me: <a href="mailto:kurtextrem@gmail.com">kurtextrem@gmail.com</a>.</p>
				<p>I'd also very much appreciate ratings in the <a href="https://chrome.google.com/webstore/detail/improved-layout-for-insta/nekeeojpcbiehcignddhindbgacbghmi/reviews" target="_blank" rel="noopener">Chrome Webstore</a>.</p>

				<h3>Tips & Tricks</h3>
				<p>If you want to upload pictures to Instagram, follow <a href="https://medium.com/@mwender/how-to-post-to-instagram-from-your-desktop-65fa55c77556" target="_blank" rel="noopener">this</a> tutorial.</p>

				<h3>Legal</h3>
				<p>Plus Icon by <a href="https://dribbble.com/enesdal" target="_blank" rel="noopener">Enes Dal</a> Creative Commons (Attribution 3.0 Unported). I've added shadows and modified the color.</p>
				<p>This project is in no way affiliated with, authorized, maintained, sponsored or endorsed by Instagram or any of its affiliates or subsidiaries. This is an independent project. Use at your own risk.</p>
			</div>
		)
	}
}
