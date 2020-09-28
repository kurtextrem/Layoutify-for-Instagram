import bind from 'autobind-decorator'
import { Button } from 'reactstrap'
import { Component, h } from 'preact'
import { Storage, StorageSync } from './Utils'

export default class About extends Component {
	state = {
		bytesLocal: 0,
		bytesMaxLocal: 0,
		bytesMaxSync: 0,
		bytesSync: 0,
	}

	@bind
	onBtnClick(e) {
		chrome.storage.local.clear()
		e.target.textContent = 'Cleared!'
	}

	async componentDidMount() {
		const bytesLocal = await Storage.getBytes()
		const bytesSync = await StorageSync.getBytes()

		chrome.permissions.contains({ permissions: ['unlimitedStorage'] }, granted => {
			this.setState({
				bytesLocal,
				bytesMaxLocal: chrome.storage.local.QUOTA_BYTES,
				bytesMaxSync: chrome.storage.sync.QUOTA_BYTES,
				bytesSync,
				granted,
			})
		})
	}

	render() {
		return (
			<div>
				<h3>
					<a href="https://github.com/kurtextrem/Improved-for-Instagram/blob/master/CHANGELOG.md#changelog" target="_blank" rel="noopener">
						Changelog 📃
					</a>
				</h3>
				<h3>About</h3>
				<p>
					Improved Layout for Instagram does not store any data of your Instagram account apart from on your PC. The code is Open-Source on{' '}
					<a href="https://github.com/kurtextrem/Improved-for-Instagram" target="_blank" rel="noopener">
						GitHub
					</a>
					.
				</p>
				<p>
					If you find any issues, please report them on{' '}
					<a href="https://github.com/kurtextrem/Improved-for-Instagram/issues" target="_blank" rel="noopener">
						GitHub
					</a>{' '}
					or mail me: <a href="mailto:kurtextrem@gmail.com">kurtextrem@gmail.com</a>.
				</p>

				<h3>Donate</h3>
				<p>
					As I am doing this in my freetime during University and don&apos;t get any money for working on this project, I would very much
					appreciate any donation. So if you want to buy me a 🍻 or ☕, use either of these PayPal buttons ❤️
				</p>
				<div class="d-flex">
					Euro (€):
					<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" rel="noopener">
						<input type="hidden" name="cmd" value="_s-xclick" />
						<input type="hidden" name="hosted_button_id" value="LAHXLBYJPA822" />
						<input
							type="image"
							src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
							border="0"
							name="submit"
							alt="Donate with PayPal."
						/>
						<img alt="" border="0" src="https://www.paypalobjects.com/de_DE/i/scr/pixel.gif" width="1" height="1" />
					</form>
					Dollar ($):
					<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" rel="noopener">
						<input type="hidden" name="cmd" value="_s-xclick" />
						<input type="hidden" name="hosted_button_id" value="274AUHUBFNZAU" />
						<input
							type="image"
							src="https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif"
							border="0"
							name="submit"
							alt="Donate with PayPal."
						/>
						<img alt="" border="0" src="https://www.paypalobjects.com/de_DE/i/scr/pixel.gif" width="1" height="1" />
					</form>
				</div>
				<p>
					...or show your support by giving a <span class="star" />
					<span class="star" />
					<span class="star" />
					<span class="star" />
					<span class="star" /> rating in the{' '}
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
					updates.
				</p>

				<h3>Tips & Tricks</h3>
				<p>
					If you want to upload pictures to Instagram on your PC, follow{' '}
					<a href="https://medium.com/@mwender/how-to-post-to-instagram-from-your-desktop-65fa55c77556" target="_blank" rel="noopener">
						this
					</a>{' '}
					tutorial.
				</p>
				<h3>Clear Outdated Data</h3>
				<p>
					Sometimes old posts are displayed, which aren&apos;t saved or liked anymore. Use this button to clear old local data (does not
					clear options):{' '}
					<Button color="warning" onClick={this.onBtnClick}>
						Clear
					</Button>
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
