'use strict'

/** So we can load images/videos on 3-dots page. */
chrome.webRequest.onBeforeSendHeaders.addListener(
	function modifyCospHeaders(details) {
		// @todo Replace this with declarative netrequest https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/#:~:text=within%20a%20tab.-,initiator,-string%C2%A0optional
		if (details.initiator !== `chrome-extension://${chrome.runtime.id}`) return

		const headers = details.requestHeaders

		let updated = false
		for (const i in headers) {
			const header = headers[i]

			if (header.name === 'Referer') {
				header.value = 'https://www.instagram.com/'
				updated = true
			}
		}

		if (!updated) headers.push({ name: 'referer', value: 'https://www.instagram.com/' })

		return { requestHeaders: details.requestHeaders }
	},
	{
		types: ['image', 'media', 'xmlhttprequest'],
		urls: [
			'*://*.fbcdn.net/*',
			'*://*.cdninstagram.com/*',
			// private_web
			'https://i.instagram.com/api/v1/*',
			'https://www.instagram.com/*',
		],
	},
	['blocking', 'requestHeaders', 'extraHeaders']
)

// Hook into web request and modify headers before sending the request
chrome.webRequest.onBeforeSendHeaders.addListener(
	function listener(details) {
		if (details.initiator !== `chrome-extension://${chrome.runtime.id}`) return

		const headers = details.requestHeaders

		for (const i in headers) {
			const header = headers[i],
				name = header.name.toLowerCase()

			if (name === 'user-agent') {
				// credit https://github.com/mgp25/Instagram-API/master/src/Constants.php
				// https://packagist.org/packages/mgp25/instagram-php / https://github.com/dilame/instagram-private-api
				header.value =
					'Instagram 121.0.0.29.119 Android (24/7.0; 380dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; en_US; 185203708)'
			}
		}

		return { requestHeaders: headers }
	},
	{
		types: ['xmlhttprequest'],
		urls: [
			'https://i.instagram.com/api/v1/feed/liked/*',
			'https://i.instagram.com/api/v1/feed/saved/*',
			'https://i.instagram.com/api/v1/feed/collection/*',
		],
	},
	['blocking', 'requestHeaders', 'extraHeaders']
)
