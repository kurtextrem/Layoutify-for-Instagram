'use strict'

var tab = null, url = chrome.runtime.getURL('index.html')
function createTab(id, force) {
	if (tab !== null && !force) {
		chrome.tabs.update(tab.id, { active: true, url: url + '?tabid=' + id }, function() {
			if (chrome.runtime.lastError)
				createTab(id, true)
		})
	} else {
		chrome.tabs.create({
			url: url + '?tabid=' + id
		}, function(newTab) {
			tab = newTab
		})
	}
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.action === 'click')
			createTab(sender.tab.id, false)
	}
)
