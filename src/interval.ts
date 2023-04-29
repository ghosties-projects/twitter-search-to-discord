import { TweetV2, UserV1 } from 'twitter-api-v2';
import request from './actions/request';
import sleep from './actions/sleep';
import Webhook from './webhook';
import client from './client';
import moment from 'moment';
import path from 'path';
import fs from 'fs';

class Interval {
	public cachePath = path.join(__dirname, '..', 'cache.json');
	public followed = new Map();
	public posted: string[];
	public timeout: number;
	public me: UserV1;

	constructor() {
		if (!fs.existsSync(this.cachePath)) {
			fs.writeFileSync(this.cachePath, JSON.stringify([]), 'utf-8');
		}

		try {
			this.posted = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8'));
		} catch {
			this.posted = [];
		}
	}

	async loop() {
		if (this.timeout && (this.timeout - moment().unix() > 0)) {
			const ms = (this.timeout - moment().unix()) * 100;
			console.log(`Waiting ${ms}ms for timeout to expire...`);
			await new Promise(r => setTimeout(r, ms));
		}

		this.check();
	}

	async check() {
		const timeout = moment();

		timeout.add(client.config.delay, 'milliseconds');

		this.timeout = timeout.unix();

		const query = `(${client.config.whitelist.join(' OR ')})` + ' ' + client.config.blacklist.map(b => `-${b}`).join(' ') + ' -is:nullcast';
		const stream = await request(() => client.instance.v2.get(`/search/adaptive.json?q=${encodeURIComponent(query)}&cards_platform=iPhone-13&contributor_details=1&query_source=typed_query&tweet_mode=extended&tweet_search_mode=live&ext=altText%2CeditControl%2Cenrichments%2ChighlightedLabel%2CisBlueVerified%2CmediaColor%2CmediaRestrictions%2CmediaStats%2CpreviousCounts%2CprofileImageShape%2CverifiedType%2CvoiceInfo&include_cards=1&include_carousels=1&include_composer_source=true&include_entities=1&include_ext_edit_control=true&include_ext_enrichments=true&include_ext_is_blue_verified=true&include_ext_is_tweet_translatable=true&include_ext_media_availability=true&include_ext_media_color=true&include_ext_previous_counts=true&include_ext_profile_image_shape=true&include_ext_sensitive_media_warning=1&include_ext_super_follow_metadata=true&include_ext_trusted_friends_metadata=true`));

		const entries = Object.entries(stream.globalObjects?.tweets ?? {});
		const tweets = entries.filter(([id, payload]) => !this.posted.includes(id) && !payload.source.includes('advertiser-interface'));

		for (const [id, payload] of tweets) {
			try {
				const parsed = new Date(Date.parse((payload as any).created_at));
				const date = moment(parsed);

				if (date.isBefore(client.started)) continue;

				const author = await client.instance.v1.user({ user_id: (payload as any).user_id_str });

				await Webhook.send({
					content: `https://twitter.com/${author.screen_name}/status/${id}`
				});

				this.cache(id);
			} catch (e) {
				console.error(`Couldn\'t handle tweet ${id} (${e.message})`);
			}

			await sleep(1000);
		}

		this.loop();
	}

	cache(id: string) {
		this.posted.push(id);
		fs.writeFileSync(this.cachePath, JSON.stringify(this.posted), 'utf-8');
	}
};

export default new Interval();