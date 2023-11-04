import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import megalodon, { MegalodonInterface } from '@cutls/megalodon';
import { apiAuthMastodon } from './endpoints/auth.js';
import { apiAccountMastodon } from './endpoints/account.js';
import { apiStatusMastodon } from './endpoints/status.js';
import { apiFilterMastodon } from './endpoints/filter.js';
import { apiTimelineMastodon } from './endpoints/timeline.js';
import { apiNotificationsMastodon } from './endpoints/notifications.js';
import { apiSearchMastodon } from './endpoints/search.js';
import { getInstance } from './endpoints/meta.js';

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

	fastify.get('/api/v1/custom_emojis', async (request, reply) => {
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

	fastify.get('/api/v1/instance', async (request, reply) => {
		const BASE_URL = request.protocol + '://' + request.hostname;
		const client = getClient(BASE_URL, undefined);
		try {
			const data = await client.getInstance();
			return getInstance(data.data);
		} catch (e: any) {
			console.error(e)
			reply.code(401);
			return e.response.data;
		}
	});
	
	fastify.get<{ Querystring: { client_id: string, state: string, redirect_uri: string } }>('/oauth/authorize', async (request, reply) => {
		const { client_id, state, redirect_uri } = request.query
		const param = state ? `state=${state}&mastodon=true` : `mastodon=true`
		reply.redirect(302, Buffer.from(client_id || '', 'base64').toString() + `?${param}`)
	});

	fastify.post<{ Body: Record<string, unknown> }>('/oauth/token', async (request, reply) => {
		const body: any = request.body || request.query
		console.log('token-request', body)
		if (!body.code && body.grant_type === 'client_credentials') {
			// For Subway Tooter
			return {
				access_token: 'testAccessToken'
			};
		}
		const BASE_URL = request.protocol + '://' + request.hostname;
		const generator = (megalodon as any).default;
		const client = generator('misskey', BASE_URL, null) as MegalodonInterface;
		const m = body.code.match(/^([a-zA-Z0-9]{8})([a-zA-Z0-9]{4})([a-zA-Z0-9]{4})([a-zA-Z0-9]{4})([a-zA-Z0-9]{12})/);
		if (!m.length) return { error: 'Invalid code' }
		const token = `${m[1]}-${m[2]}-${m[3]}-${m[4]}-${m[5]}`
		try {
			const atData = await client.fetchAccessToken(null, body.client_secret, token);
			const ret = {
				access_token: atData.accessToken,
				token_type: 'Bearer',
				scope: body.scope || 'read write follow push',
				created_at: Math.floor(new Date().getTime() / 1000)
			};
			console.log('token-response', ret)
			return ret
		} catch (e: any) {
			console.error(e)
			reply.code(401);
			return e.response.data;
		}
	});

}