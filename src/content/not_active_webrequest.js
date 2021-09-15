'use strict'

let id = 0

// this is a workaround until https://bugs.chromium.org/p/chromium/issues/detail?id=1226276#c4 is fixed.
chrome.declarativeNetRequest.getDynamicRules(function (rules) {
	chrome.declarativeNetRequest.updateDynamicRules({
		addRules: [
			/** So we can load images/videos on 3-dots page. */
			...[
				'fbcdn.net',
				'cdninstagram.com',
				// private_web
				'i.instagram.com/api/v1/*',
				'www.instagram.com',
			].map(item => ({
				id: ++id,
				priority: 1,
				action: {
					type: 'modifyHeaders',
					requestHeaders: [
						{
							header: 'referer',
							operation: 'set',
							value: 'https://www.instagram.com/',
						},
					],
				},
				condition: {
					urlFilter: `||${item}`,
					domains: [chrome.runtime.id],
					resourceTypes: ['image', 'media', 'xmlhttprequest'],
				},
			})),

			// Hook into web request and modify headers before sending the request
			...['i.instagram.com/api/v1/feed/liked/*', 'i.instagram.com/api/v1/feed/saved/*', 'i.instagram.com/api/v1/feed/collection/*'].map(
				item => ({
					id: ++id,
					priority: 1,
					action: {
						type: 'modifyHeaders',
						requestHeaders: [
							{
								header: 'user-agent',
								operation: 'set',
								value:
									'Instagram 121.0.0.29.119 Android (24/7.0; 380dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; en_US; 185203708)',
							},
						],
					},
					condition: {
						urlFilter: `||${item}`,
						domains: [chrome.runtime.id],
						resourceTypes: ['xmlhttprequest'],
					},
				})
			),
		],
	})
})
