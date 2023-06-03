import { Webhook } from './webhook';
import config from '../config.json';
import Client from './client';

Client.connect();

const webhook = new Webhook(config.errors?.webhook);

process.on('uncaughtException', (error, origin) => {
	if (config.errors.catch) {
		webhook.send({
			content: [
				'**An error occured inside twitter-search-to-discord**',
				'',
				`Origin: \`${origin ?? 'Unknown'}\``,
				`Cause: \`${error.cause ?? 'Unknown'}\``,
				`Type: \`${error.name}\``,
				`Stack: \`\`\`\n${error.stack}\n\`\`\``,
			].join('\n')
		});
	};

	process.exit(1);
});
