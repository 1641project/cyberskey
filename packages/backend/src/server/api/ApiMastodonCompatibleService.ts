import { MegalodonInterface } from 'megalodon';
import { IEndpoint } from './endpoints';

export async function endpointConverter (endpoint: IEndpoint, client: MegalodonInterface): any {
	if (endpoint.name === 'v1/custom_emojis') return await client.getInstanceCustomEmojis();
	return null;
}
