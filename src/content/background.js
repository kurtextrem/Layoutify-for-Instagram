'use strict'

function createTab() {
	chrome.tabs.create({
		url: chrome.extension.getURL('index.html')
	})
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(sender.tab ?
			'from a content script:' + sender.tab.url :
			'from the extension')
		if (request.action === 'click')
			createTab()

		return true // async
	}
)
