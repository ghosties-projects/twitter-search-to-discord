import { TweetV2, UserV1 } from 'twitter-api-v2';
import confidence from './actions/confidence';
import request from './actions/request';
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

		const stream = await request(() => client.instance.v2.get(`/search/adaptive.json?q=${encodeURIComponent(client.config.query)}&tweet_mode=extended&tweet_search_mode=live`));

		const entries = Object.entries(stream.globalObjects?.tweets ?? {}) as unknown as [string, TweetV2][];
		const tweets = entries.filter(([id]) => !this.posted.includes(id));

		for (const [id, payload] of tweets) {
			try {
				const parsed = moment(Date.parse((payload as any).created_at));
				const date = moment(parsed);

				if (date.isBefore(client.started)) {
					this.cache(id);
					continue;
				}

				const percentage = await confidence((payload as any).full_text);
				if (percentage < client.config.ai.minimum_confidence) {
					this.cache(id);
					continue;
				}

				const author = await client.instance.v1.user({ user_id: (payload as any).user_id_str });

				await Webhook.send({ content: `https://twitter.com/${author.screen_name}/status/${id}` });

				this.cache(id);
			} catch (e) {
				console.error(`Couldn\'t handle tweet ${id} (${e.message})`);
			}
		}

		this.loop();
	}

	cache(id: string) {
		this.posted.push(id);
		fs.writeFileSync(this.cachePath, JSON.stringify(this.posted), 'utf-8');
	}
};

export default new Interval();