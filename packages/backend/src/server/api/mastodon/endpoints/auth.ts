import type { FastifyInstance } from 'fastify';
import megalodon, { MegalodonInterface } from '@cutls/megalodon';
import { getClient } from '../ApiMastodonCompatibleCallService.js';

const readScope = [
	'read:account',
	'read:drive',
	'read:blocks',
	'read:favorites',
	'read:following',
	'read:messaging',
	'read:mutes',
	'read:notifications',
	'read:reactions',
	'read:pages',
	'read:page-likes',
	'read:user-groups',
	'read:channels',
	'read:gallery',
	'read:gallery-likes'
]
const writeScope = [
	'write:account',
	'write:drive',
	'write:blocks',
	'write:favorites',
	'write:following',
	'write:messaging',
	'write:mutes',
	'write:notes',
	'write:notifications',
	'write:reactions',
	'write:votes',
	'write:pages',
	'write:page-likes',
	'write:user-groups',
	'write:channels',
	'write:gallery',
	'write:gallery-likes'
]

export function apiAuthMastodon(fastify: FastifyInstance): void {

	fastify.get('/api/v1/apps/verify_credentials', async (request, reply) => {
		reply.code(400)
		return {}
	})

	fastify.post('/api/v1/apps', async (request, reply) => {
		const BASE_URL = request.protocol + '://' + request.hostname;
		const client = getClient(BASE_URL, '');
		const body: any = request.body || request.query
		console.log('appRequest', body)
		try {
			let scope = body.scopes
			if (typeof scope === 'string') scope = scope.split(' ')
			const pushScope = new Set<string>()
			for (const s of scope) {
				if (s.match(/^read/)) for (const r of readScope) pushScope.add(r)
				if (s.match(/^write/)) for (const r of writeScope) pushScope.add(r)
			}
			const scopeArr = Array.from(pushScope)

			let red = body.redirect_uris
			if (red === 'urn:ietf:wg:oauth:2.0:oob') red = 'https://thedesk.top/hello.html'
			if (red === 'https://mastodon-app.covelline.com/callback feather-mastodon://') red = 'feather-mastodon://'
			const appData = await client.registerApp(body.client_name, { scopes: scopeArr, redirect_uris: red, website: body.website });
			const returns = {
				id: Math.floor(Math.random() * 100).toString(),
				name: appData.name,
				website: body.website,
				redirect_uri: red,
				client_id: Buffer.from(appData.url || '').toString('base64'),
				client_secret: appData.clientSecret
			}
			console.log('appsResponse', returns)
			return returns
		} catch (e: any) {
			console.error(e)
			reply.code(401);
			console.error(e.response.data)
			return e.response.data;
		}
	});

}