'use strict'

const API = 'https://www.instagram.com/'
const UA = 'Instagram 10.8.0 Android (24/7.0; 380dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; en_US)'

const url = chrome.runtime.getURL('index.html')

let tab = null
function create(newTab) {
	tab = newTab
}

function update() {
	if (chrome.runtime.lastError) createTab(this, true)
}

const updateObj = { active: true, url: '' }
const createObj = { url: '' }
function createTab(id, force) {
	if (tab !== null && !force) {
		updateObj.url = url + '?tabid=' + id
		chrome.tabs.update(tab.id, updateObj, update.bind(id))
	} else {
		createObj.url = url + '?tabid=' + id
		chrome.tabs.create(createObj, create)
	}
}

chrome.runtime.onMessage.addListener(function listener(request, sender, sendResponse) {
	if (request.action === 'click') createTab(sender.tab.id, false)
})

const cookieObj = { url: API, name: '' }
function getCookie(name) {
	return new Promise((resolve, reject) => {
		cookieObj.name = name
		chrome.cookies.get(cookieObj, function cookies(cookie) {
			if (cookie !== null) resolve(cookie.value)
			reject()
		})
	})
}

let sessionid = ''
function getSessionId() {
	getCookie('sessionid').then(saveSession)
}
function saveSession(value) {
	return (sessionid = value)
}

getSessionId()

// hook into web request and modify headers before sending the request
chrome.webRequest.onBeforeSendHeaders.addListener(
	function listener(details) {
		getSessionId() // just update for next time

		const headers = details.requestHeaders

		for (let i = 0; i < headers.length; ++i) {
			var header = headers[i]

			if (header.name === 'User-Agent') {
				header.value = UA
			} else if (header.name === 'Cookie') {
				// add auth cookies to authenticate API requests
				header.value = header.value + '; sessionid=' + sessionid
			}
		}
		return { requestHeaders: headers }
	},
	{
		urls: ['https://i.instagram.com/api/v1/feed/liked/*', 'https://i.instagram.com/api/v1/feed/saved/*'],
		types: ['xmlhttprequest'],
	},
	['blocking', 'requestHeaders']
)
