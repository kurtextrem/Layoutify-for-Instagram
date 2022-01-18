# Changelog

<h3 style="display: flex;">

<img src="src/img/icon-128.png?raw=true" width="3%"> Layoutify: Improved Layout for Instagram

</h3>

## 3.11.0

Instagram changed the structure of their page and thus it broke the extension. I submitted a fix for this on the 9th of December, but it did not get approveduntil late December (not even on the 25th December). Not sure why it took so long, I never had that issue before.

Hope you had a good start into the new year 🎆.

## Bug Fixes

- Media controls are visible again (e.g. to download videos)
- Feed is working again
- Stories are working again

## 3.10.0

Downloading videos now works again via right-click on posts (if you open them in a new tab - modals aren't supported yet) - Instagram broke this purposely it seems.

## 3.9.0 & 3.8.0 - 2021-09-26 (updated details)

The new permission is required since I upgraded to Chrome [Manifest V3](https://9to5google.com/guides/manifest-v3/), which makes the extension **use less resources in the background**. <small>Up to version 3.7.0 the extension always needed to run in the background (a lot of extensions do this).</small>

### Why is the new permission needed?

> This lets extensions modify network requests without intercepting them and viewing their content, **thus providing more privacy**. <small>- Source: [Chrome API](https://developer.chrome.com/docs/extensions/reference/declarativeNetRequest/)</small>

**TL;DR: I replaced a permission with a privacy friendly one, which also consumes less CPU resources.**

As a reminder, the extension can only access data from: instagram.com, fbcdn.net (to display images), cdninstagram.com (to display images). Data collected stays on your own PC (also stated in the legally binding privacy statement).

To check, right-click the extension -> "Manage extensions" there you can see what websites it can modify. Google also checks the extensions before updates get published.

For developers, the added rules can be seen [here](https://github.com/kurtextrem/Layoutify-for-Instagram/blob/master/src/content/background.js#L383). Discussions can be seen here: [#105](https://github.com/kurtextrem/Layoutify-for-Instagram/issues/105#issuecomment-927180588), [#106](https://github.com/kurtextrem/Layoutify-for-Instagram/issues/106#issuecomment-927180421).

### Bug Fixes

Instagram changed the source code of posts and modals on profiles, which broke the design. This version fixes it.

## 3.7.0 - 2021-06-24

### New Features

The "Watch" feature has been expanded to notify when a user...:

- has a new IGTV post
- has a new highlight reel
- has a new tagged photo
- went private / unprivate

And:

- 3-dots page now has an option for the modal width (and the bigger width is now less buggy in height)

### Bug Fixes

- The 'unmute' button is visible again on single posts and media controls work on videos again
- Another fix regarding the case described below.

## 3.6.0 - 2021-06-17

For some users, the "suspicion bans" are still happening and I am working on fixing them. I have updated a few other things, that might have been outdated, so fingers crossed, that 3.6.0 will stop them finally. **If you have any hints, write me an email, it is very important to know what actions you did before the ban got triggered, so that I can fix it**.

**❗ For now, please do not open many Instagram.com tabs at the same time! This seems to be one of the causes ❗**

### New features

- The DMs page now supports dark mode too
- Modals (when you click a post on someones profile) are now bigger (<small>_thanks to Dominic for the suggestion_</small>)

## 3.5.0 - 2021-06-02

"Suspicion bans" from Instagram happened for some users in the past days and thanks to Cheyi, Nedi and Mike who wrote me in the Chrome WebStore and via email (I read all your comments and try to reply :) ), I have finally found the culprit.

**Why did that happen?**

Instagram added a new security feature to their requests (when your browser sends something to their servers). My requests did not send them. As a result, Instagram could think a bot is sending the requests, in simple terms.

**Again:** This extension will never do any action without your interaction. In fact, for example it can not even like posts without you clicking on the heart button.

## 3.4.0 - 2021-05-24

No exciting new features, sorry - but exciting news: I have completed University - and the post/story notifications work again _(had been broken way too long, sorry!)_.

New Permissions: Instagram changed how websites can display their images/videos, and since the 3-dot page does display them, I have to ask for new permissions in order to access the following URLs:

- cdninstagram.com: this is where Instagram saves your images/videos.
- fbcdn.net: this is where Facebook saves your images/videos (Instagram is a brand of Facebook)

**Your images/videos never leave your PC. This extension will NEVER collect any personal data. Respecting your privacy is my highest principle, the code is visible for everyone on GitHub.**

Until the next update, stay safe and healthy, make sure your loved ones know how you feel about them (RIP my dear friend Arif, who lost the fight against Covid).<br>
I know _you_ are loved too. Keep being awesome ❤️

## 3.3.2 - 2020-11-19

Added new option "System Night Mode". Turned on by default. When turned on, the night mode automatically activates when your Operating System (Windows/Mac/Linux/Chrome OS) is in Night/Dark Mode.

## 3.3.1 - 2020-10-05

Instagram requested me to change the extension name. The new name is "Layoutify: Improved Layout for Instagram".

## 3.3.0 - 2020-09-21

### New

Collections now finally have their correct names and you can view each of them like in the Instagram app <small>_(the "wishlist" collection is currently missing, but it seems like this is an app-only thing)_</small>.

![Collections](https://raw.githubusercontent.com/kurtextrem/Layoutify-for-Instagram/master/src/webstore/Screenshot_80.png)

Also, added a donation button to the "❔ About" page, as I'm a student working on this extension during my freetime, which means I don't get any money for doing so.<br>So if you want to buy me a ☕ or 🍻, use the PayPal button on that page. Donations are of course optional and will always stay optional, but I really appreciate any amount. ❤️

### Fixed

When you open a profile and then switch to the main feed, it did not load posts. This is now fixed.

Stories in the main feed now always work correctly and mark stories with videos using a play button.

## 3.2.0 - 2020-09-04

### Known Issues

On the 3-dots page, posts will show up two or three times instead of once. This is a bug that still puzzles me, but I'll continue trying to fix it.

I sadly don't have much time at the moment, as I'm the only developer of this extension and I'll do my Bachelor thesis soon.

### Changed

Instagram lawyer forced me to change the extension **icon**, possibly the name in the future. :(

### Bug Fixes

Since the last release with a changelog, there have been many releases containing just bug fixes. If you find any more, please write an email to me.

## 3.1.0 - 2020-04-09

### Changed

The "Pictures Only" setting has been updated (and fixed, it was broken from 3.0.0). Here's how it looks combined with "No Space Between Posts":

![Pictures Only Demo](https://raw.githubusercontent.com/kurtextrem/Layoutify-for-Instagram/master/src/webstore/ScreenshotPicturesOnly.png)

### Bug Fixes

This release contains all the bugfixes from 3.0.1 and 3.0.2:

- Fixed "posts on profiles could not be opened"
- On the main feed, the like button always did the opposite (_ouups, I'm only human after all... or maybe unintended april fools?_). Fixed.
- Fixed the "Load more" button on the 3-dots like/saved page
- Fixed the login screen (the new feed was on top of it)

**Thank you again for all the nice emails, bug reports and so on. This means a lot to me and helps me fix issues faster.**

### Upcoming

- Instagram DMs finally arrived on Desktop. This means the "Share" button is useful again, hence in this version you can see it again, when you view a single post. I will try to add the button to the main feed too.
- Also, the preview of stories in the main feed is missing, this is on my Todo list as well

## 3.0.0 - 2020-03-29

_Again, it has been quite some time since the latest bigger release (this excludes bug-fixes etc.)._

This version brings a long-term **fix for the scrolling issue** many people had in the past (including myself). To explain: Instagram changed the way the feed works and broke my method of having multiple posts per row.

The new feed is entirely written by me and even improves performance compared to Instagram. As a plus, compared to Instagrams feed, it **does not log user actions**, which is a nice **privacy bonus**!

It is still beta, however. If you find any issues, or missing features, let me know (email is on 3-dot page -> About)

**Thank you for all your continued support, even though I sometimes don't have much time to update the extension as I'm a full-time student. I also wish you, your family and your loved ones the best during the Corona crisis. ♥**

## 2.10.0 - 2019-08-28

The latest bigger release was in December, but don't worry, in the time between I have done a lot of bug fixes. Feedback welcome (email is on 3-dot page -> About) :)

Enjoy your summer!

### Changed

- You now get a notification if a person changed his/her profile picture when watching their posts

### Bug Fixes

- A few bug fixes

## [2.9.0] - 2018-12-22

### Changed

- Stories now look different. You can find them on the right side of the screen
- They are no longer buggy and work as expected

### Bug Fixes

- Many of them (since last changelog entry)

## [2.8.3] - 2018-10-08

### Bug Fixes

- Night mode didn't work correctly

- Some colors in night mode were not readable

## [2.8.2] - 2018-09-19

### Bug Fixes

- Fixed disappearing options. That bug was really weird.

## [2.8.0] - 2018-09-04

- Great feature: You can now view your different collections!

- "Saved" is now "Collections"

- **IMPORTANT**: I know, it doesn't look pretty and the names is the ID Instagram uses. However, my time is limited currently (exams) and thus I found it more important to release the feature instead of waiting until I decided on a good design.

- Please note: You need to scroll to the bottom of the page, to view more posts. They will be added to the correct collection.

## [2.7.6] - 2018-06-28

### Added

- Options will be synced across all Chrome installations.

- Saved items can now be removed from the 3-dots page.

## [2.7.5] - 2018-06-26

### Bug Fixes

- No recent items were added to the 3-dots page.

## [2.7.3] - 2018-06-24

### Added

- On profiles, you can now click the button 'Watch' to add/remove a user to/from your watch list.

### Changed

- Notifications now arrive as long as you haven't watched the story (either in the app or online)

### Bug Fixes

- Couldn't watch old stories on profiles

## [2.7.0] - 2018-06-20

### Added

- Huge new feature: You can now add Users to your list of "Watched Posts" and/or "Watched Stories" (found on the options page on the 3-dots page)!

  - How it works: You will get a notification whenever the User posts something, and/or adds a new Story

  - You can decide whether to get notified in background, or only if you open Instagram.com (latter is default)

  - The User(s) will have a badge on his profile, so you can recognize whom you are watching

- New Changelog page (can be accessed on the 3-dots page under "?")

  - It will open automatically, whenever something bigger has changed (so not when there's only bug fixes)

## [2.6.0] - 2018-06-14

New Extension Icon and Logo by [Ibrahim Tenekeci](https://github.com/ihtiht).

Night Mode by [Kelvin R.](https://github.com/KLVN)

[unreleased]: https://github.com/kurtextrem/Improved-for-Instagram/compare/v2.7.0...HEAD
[2.7.0]: https://github.com/kurtextrem/Improved-for-Instagram/compare/v2.6.0...v2.7.0
