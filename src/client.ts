import { CONSUMER_SECRET, CONSUMER_KEY } from './constants';
import { TwitterApi } from 'twitter-api-v2';
import { xauthLogin } from 'xauth-login';
import config from '../config.json';
import Interval from './interval';
import moment from 'moment';

export class Client {
	public instance: InstanceType<typeof TwitterApi>;
	public started: ReturnType<typeof moment>;
	public config = config;

	async connect() {
		const { oauth_token, oauth_token_secret } = await xauthLogin({
			username: this.config.listener.username,
			password: this.config.listener.password,
			appKey: CONSUMER_KEY,
			appSecret: CONSUMER_SECRET
		});

		this.instance = new TwitterApi({
			appKey: CONSUMER_KEY,
			appSecret: CONSUMER_SECRET,
			accessToken: oauth_token,
			accessSecret: oauth_token_secret,
		});

		this.started = moment();

		await Interval.loop();
	}
};

export default new Client();