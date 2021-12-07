<h1 align="center">

![Logo](src/img/icon-128.png?raw=true 'Layoutify: Improved for Instagram Logo')
<br>
Layoutify: Improved Layout for Instagram

</h1>

The default Instagram.com layout is not optimized for the desktop. This extension improves this.

Download from [Chrome Web Store](https://chrome.google.com/webstore/detail/nekeeojpcbiehcignddhindbgacbghmi).

![Screenshot](src/webstore/night.png 'Night Mode Screenshot')

## Legal

This project is in no way affiliated with, authorized, maintained, sponsored or endorsed by Instagram or any of its affiliates or
subsidiaries. This is an independent project. Use at your own risk.

Extension Icon and Logo by [Ibrahim Tenekeci](https://github.com/ihtiht).<br>
Night Mode by [Kelvin R.](https://github.com/KLVN)

## Development

Do you want to help with developing? You're very welcome.

To get this extension running (if you're a dev), follow these steps:

1.  Download the [ZIP](https://github.com/kurtextrem/Improved-for-Instagram/archive/master.zip) archive of the repository.
2.  Unpack somewhere.
3.  Run `npm install` in the folder _(make sure you have [NodeJS](https://nodejs.org/en/) installed)_

To load the Extension in Chrome follow these steps:

<table>
	<tr>
		<th>Chrome</th>
	</tr>
	<tr>
		<td>
			<ol>
				<li>Open <code>chrome://extensions</code>
				<li>Check the <strong>Developer mode</strong> checkbox
				<li>Click on the <strong>Load unpacked extension</strong> button
				<li>Select the <code>src</code> folder (<code>where-you-unpacked-the-ZIP/src</code>)
			</ol>
		</td>
	</tr>
</table>

### Starting the Dev Server

1.  Run `npm run start`
2.  Open the Options page (right click the Extension Icon in Chrome)

It will auto reload when you do changes in `src/components`.

This also works if you want to debug CSS/JS on Instagram.com.

I'm always available to help!

![Alt](https://repobeats.axiom.co/api/embed/788db19c8ef115ddecc2029c6c0fd78040cd119f.svg "Repobeats analytics image")