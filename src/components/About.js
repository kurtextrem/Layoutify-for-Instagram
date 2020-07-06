import bind from 'autobind-decorator'
import { Button } from 'reactstrap'
import { Component, h } from 'preact'
import { Storage } from './Utils'

export default class About extends Component {
	@bind
	onBtnClick(e) {
		Storage.remove('liked')
		Storage.remove('saved')
		e.target.textContent = 'Cleared!'
	}

	shouldComponentUpdate() {
		return false
	}

	render() {
		return (
			<div>
				<h3>About</h3>
				<p>
					Improved Layout for Instagram does not store any data of your Instagram account apart from on your PC. The Code is Open Source on{' '}
					<a href="https://github.com/kurtextrem/Improved-for-Instagram" target="_blank" rel="noopener">
						GitHub
					</a>
					.
				</p>
				<p>
					If you find any issues, please report any bugs on{' '}
					<a href="https://github.com/kurtextrem/Improved-for-Instagram/issues" target="_blank" rel="noopener">
						GitHub
					</a>{' '}
					or mail me: <a href="mailto:kurtextrem@gmail.com">kurtextrem@gmail.com</a>.
				</p>
				<p>
					I'd also very much appreciate <span class="star" />
					<span class="star" />
					<span class="star" />
					<span class="star" />
					<span class="star" /> ratings in the{' '}
					<a
						href="https://chrome.google.com/webstore/detail/improved-layout-for-insta/nekeeojpcbiehcignddhindbgacbghmi/reviews"
						target="_blank"
						rel="noopener">
						Chrome Webstore
					</a>
					.
				</p>
				<p>
					Follow me on <a href="https://instagram.com/kurtextrem">Instagram</a> or <a href="https://twitter.com/kurtextrem">Twitter</a> for
					updates!
				</p>

				<h3>Clear Outdated Data</h3>
				<p>
					Sometimes old posts are displayed, which aren't saved or liked anymore. Use this button to clear old data (not options):{' '}
					<Button color="warning" onClick={this.onBtnClick}>
						Clear
					</Button>
				</p>

				<h3>Tips & Tricks</h3>
				<p>
					If you want to upload pictures to Instagram, follow{' '}
					<a href="https://medium.com/@mwender/how-to-post-to-instagram-from-your-desktop-65fa55c77556" target="_blank" rel="noopener">
						this
					</a>{' '}
					tutorial.
				</p>

				<h3>Thanks to</h3>
				<p>
					Huuuuge thanks to{' '}
					<b>
						<a href="https://github.com/KLVN" target="_blank" rel="noopener">
							Kelvin R.
						</a>
					</b>{' '}
					for contributing the night theme.
					<br />
					Also huuuuge thanks to{' '}
					<b>
						<a href="https://github.com/ihtiht" target="_blank" rel="noopener">
							Ibrahim Tenekeci
						</a>
					</b>{' '}
					for the modern and nice new logo.
					<br />
					Thanks to{' '}
					<a href="https://github.com/PaoloC95" target="_blank" rel="noopener">
						PaoloC95
					</a>{' '}
					for the italian translation.
					<br />
					And to all the bug reporters that have sent me mails. I always try my best to respond as soon as possible.
				</p>

				<h3>
					<a href="https://github.com/kurtextrem/Improved-for-Instagram/blob/master/CHANGELOG.md#changelog" target="_blank" rel="noopener">
						Changelog <i class="material-icons">description</i>
					</a>
				</h3>

				<small>
					<b>Legal</b>
					<br />
					This project is in no way affiliated with, authorized, maintained, sponsored or endorsed by Instagram or any of its affiliates or
					subsidiaries. This is an independent project. Use at your own risk.
					<br />
					<a href="https://kurtextrem.de/chrome/PRIVACY.html" target="_blank" rel="noopener">
						Privacy Policy
					</a>{' '}
					(Sensitive data is <b>only</b> collected and stored <b>on your own PC</b>, options are synced if Chrome Sync is turned on)
				</small>
			</div>
		)
	}
}
