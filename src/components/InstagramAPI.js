import bind from 'autobind-decorator'
import { Storage, fetchFromBackground, logAndReturn } from './Utils'

/**
 * 0 -> posts + set next max id -> max id -> posts + set next max id -> repeat from 1.
 */
class InstagramAPI {
	constructor(endpoint) {
		this.endpoint = endpoint // e.g. liked
		this.action = endpoint.slice(0, -1) // e.g. like

		this.firstRun = true
		this.nextMaxId = null
		this.items = []
	}

	@bind
	async start() {
		if (this.firstRun) {
			const data = await Storage.get(this.endpoint, {
				items: [],
				nextMaxId: '',
			})
			this.nextMaxId = data.nextMaxId
			this.items = data.items
			return data
		}
		return this.items
	}

	@bind
	async fetch() {
		if (!this.firstRun && this.nextMaxId === '') return this.items // nothing more to fetch
		await this.start()

		return fetchFromBackground('private', `feed/${this.endpoint}/?${this.nextMaxId && !this.firstRun ? `max_id=${this.nextMaxId}&` : ''}`) // maxId means "show everything before X"
			.then(this.storeNext)
			.then(this.normalize)
			.then(this.setData)
			.then(this.storeItems)
			.catch(logAndReturn)
			.catch(this.storeItems)
	}

	@bind
	storeNext(data) {
		console.log(data)
		if (!this.firstRun || this.nextMaxId === '') this.nextMaxId = data.next_max_id ? `${data.next_max_id}` : ''

		return data
	}

	@bind
	normalize(data) {
		const items = data.items
		if (!Array.isArray(items)) return new Error('No items')

		const length_ = items.length

		const isSaved = length_ !== 0 && items[0].media !== undefined
		for (let i = 0; i < length_; ++i) {
			if (isSaved) items[i] = items[i].media // we need to normalize "saved"

			// @todo: Rewrite to whitelist instead of blacklist
			const item = items[i]
			delete item.preview_comments // we don't want to store too much
			delete item.organic_tracking_token
			delete item.max_num_visible_preview_comments
			delete item.location // @todo
			delete item.lng // @todo
			delete item.lat // @todo
			delete item.inline_composer_display_condition
			delete item.has_viewer_saved
			delete item.has_more_comments
			delete item.filter_type
			delete item.device_timestamp // @todo
			delete item.client_cache_key // @todo
			delete item.caption_is_edited // @todo
			delete item.can_viewer_save
			delete item.can_viewer_reshare
			delete item.can_view_more_preview_comments
			delete item.comment_count // @todo
			delete item.comment_likes_enabled // @todo
			delete item.comment_threading_enabled
			delete item.photo_of_you // @todo
			delete item.pk
			delete item.original_height
			delete item.original_width
			delete item.user.friendship_status // @todo is_bestie
			delete item.user.has_anonymous_profile_picture
			delete item.user.is_favorite
			delete item.user.is_unpublished
			delete item.user.pk
			delete item.user.profile_pic_id
			delete item.user.latest_reel_media
			delete item.can_see_insights_as_brand
			delete item.inline_composer_imp_trigger_time
			if (item.caption) {
				delete item.caption.created_at_utc
				delete item.caption.has_translation
				delete item.caption.is_covered
				delete item.caption.media_id
				delete item.caption.private_reply_status
				delete item.caption.active
				delete item.caption.user_id
				delete item.caption.bit_flags
				delete item.caption.content_type
				delete item.caption.did_report_as_spam
				delete item.caption.share_enabled
				delete item.caption.user
				delete item.caption.type
				delete item.caption.pk
			}
			delete item.video_dash_manifest
			delete item.video_duration
			delete item.video_codec
			delete item.is_dash_eligible
			delete item.deleted_reason
			delete item.is_in_profile_grid
			delete item.is_shop_the_look_eligible
			delete item.profile_grid_control_enabled
			delete item.sharing_friction_info

			if (item.image_versions2 !== undefined) {
				const el = item.image_versions2.candidates[0]
				item.image_versions2 = { candidates: [el] }
				delete el.estimated_scans_sizes
				delete el.scans_profile
			}
		}

		return data
	}

	/**
	 * Simple merging algorithm: Checks the first items of each set, if they match, replace n items of the old set, with n := length items of the new set.
	 *
	 * This has one caveat: We can't replace older items and thus there might be deleted items still left. We can not delete them.
	 *
	 * @param {object} items
	 * @return {boolean} merged
	 */
	@bind
	mergeItems(items) {
		if (!items || items.length === 0) return this.items
		if (this.items.length === 0 || items[0].id !== this.items[0].id) {
			this.items = items
			return false
		}

		// remove items.length items from this.items
		this.items.splice(0, items.length, ...this.items)
		return true
	}

	@bind
	setData(data) {
		if (this.firstRun) {
			this.firstRun = false
			if (!this.mergeItems(data.items)) this.storeNext(data)
		} else this.items = this.items.concat(data.items)

		return data
	}

	@bind
	storeItems(data) {
		Storage.set(this.endpoint, {
			items: this.items,
			nextMaxId: this.nextMaxId,
		})

		return data
	}

	@bind
	add(id) {
		let node = this.action
		if (node === 'like') node += 's'

		return fetchFromBackground('public', `${node}/${id}/${this.action}/`)
	}

	@bind
	remove(id) {
		let node = this.action
		if (node === 'like') node += 's'

		return fetchFromBackground('public', `${node}/${id}/un${this.action}/`)
	}
}

export const Instagram = {
	fetch(type) {
		if (this[type]) {
			this[type].fetch()
			return
		}

		this[type] = new InstagramAPI(type)
		this[type].fetch()
	},
	liked: new InstagramAPI('liked'),
	saved: new InstagramAPI('saved'),
}
