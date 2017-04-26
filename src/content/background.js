'use strict'

function createTab(id) {
	chrome.tabs.create({
		url: chrome.extension.getURL('index.html') + '?tabid=' + id
	})
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.action === 'click')
			createTab(sender.tab.id)
	}
)
