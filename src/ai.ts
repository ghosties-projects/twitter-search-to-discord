import { OpenAIChat } from 'langchain/llms/openai';
import { PromptTemplate } from 'langchain/prompts';
import { BufferMemory } from 'langchain/memory';
import { LLMChain } from 'langchain/chains';
import config from './config';

class AI {
	public memory = new BufferMemory({ memoryKey: 'chat_history' });
	public prompt: ReturnType<typeof PromptTemplate.fromTemplate>;
	public model: InstanceType<typeof OpenAIChat>;
	public chain: InstanceType<typeof LLMChain>;

	constructor() {
		this.model = new OpenAIChat({
			openAIApiKey: config.ai.key,
			modelName: 'gpt-3.5-turbo',
			streaming: true,
			verbose: true,
			temperature: config.ai.temperature,
			cache: true,
			maxTokens: 50
		});

		this.prompt = PromptTemplate.fromTemplate(config.ai.template);
		this.chain = new LLMChain({ llm: this.model, prompt: this.prompt, memory: this.memory });
	}

	async call(input: string) {
		const res = await this.chain.call({ input });

		return res?.text ?? '';
	}
}

export default new AI();