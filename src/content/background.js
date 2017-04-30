'use strict'

var tab = null, url = chrome.runtime.getURL('index.html')
function createTab(id) {
	if (tab !== null) {
		chrome.tabs.update({ id: tab.id }, { active: true, url: url + '?tabid=' + id })
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
			createTab(sender.tab.id)
	}
)
