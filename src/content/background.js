'use strict'

var url = ''
function createTab(id) {
	if (url === '') url = chrome.extension.getURL('index.html')

	chrome.tabs.query({ url }, (tabs) => {
		if (tabs.length) {
			chrome.tabs.update({ id: tabs[0].id }, { active: true, url: url + '?tabid=' + id })
		} else {
			chrome.tabs.create({
				url: url + '?tabid=' + id
			})
		}
	})
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.action === 'click')
			createTab(sender.tab.id)
	}
)
