import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import megalodon, { MegalodonInterface } from '@cutls/megalodon';
import { apiAuthMastodon } from './endpoints/auth.js';
import { apiAccountMastodon } from './endpoints/account.js';
import { apiStatusMastodon } from './endpoints/status.js';
import { apiFilterMastodon } from './endpoints/filter.js';
import { apiTimelineMastodon } from './endpoints/timeline.js';
import { apiNotificationsMastodon } from './endpoints/notifications.js';
import { apiSearchMastodon } from './endpoints/search.js';

export function getClient(BASE_URL: string, authorization: string | undefined): MegalodonInterface {
	const accessTokenArr = authorization?.split(' ') ?? [null];
	const accessToken = accessTokenArr[accessTokenArr.length - 1];
	const generator = (megalodon as any).default
	const client = generator('misskey', BASE_URL, accessToken) as MegalodonInterface;
	return client
}

export function apiMastodonCompatible(fastify: FastifyInstance): void {
	apiAuthMastodon(fastify)
	apiAccountMastodon(fastify)
	apiStatusMastodon(fastify)
	apiFilterMastodon(fastify)
	apiTimelineMastodon(fastify)
	apiNotificationsMastodon(fastify)
	apiSearchMastodon(fastify)

	fastify.get('/v1/custom_emojis', async (request, reply) => {
		const BASE_URL = request.protocol + '://' + request.hostname;
		const accessTokens = request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.getInstanceCustomEmojis();
			return data.data;
		} catch (e: any) {
			console.error(e)
			reply.code(401);
			return e.response.data;
		}
	});

	fastify.get('/v1/instance', async (request, reply) => {
		const BASE_URL = request.protocol + '://' + request.hostname;
		const client = getClient(BASE_URL, undefined);
		try {
			const data = await client.getInstance();
			return data.data;
		} catch (e: any) {
			console.error(e)
			reply.code(401);
			return e.response.data;
		}
	});



}