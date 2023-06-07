import config from '../config';
import AI from '../ai';

async function confidence(text: string) {
	const wrapper = config.ai.wrapper.join('\n');
	const formatted = wrapper.replace('$$$tweet$$$', text);

	const response = await AI.call(formatted);
	const result = Number(response);
	if (!result || Number.isNaN(result)) {
		console.log('nope', { confidence: result, text });
		return 0;
	}

	console.log({ confidence: result, text });
	return result;
}

export default confidence;