import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import megalodon, { MegalodonInterface } from 'megalodon';

function getClient(BASE_URL: string, authorization: string | undefined): MegalodonInterface {
	const accessTokenArr = authorization?.split(' ') ?? [null];
	const accessToken = accessTokenArr[accessTokenArr.length - 1];
	const generator = (megalodon as any).default
	const client = generator('misskey', BASE_URL, accessToken) as MegalodonInterface;
	return client
}
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
export function apiMastodonCompatible(fastify: FastifyInstance): void {

	fastify.post('/v1/apps', async (request, reply) => {
		const BASE_URL = request.protocol + '://' + request.hostname;
		const accessTokens = request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		const body: any = request.body
		try {
			let scope = body.scopes
			if (typeof scope === 'string') scope = scope.split(' ')
			const pushScope: string[] = []
			for (const s of scope) {
				if (s.match(/^read/)) for (const r of readScope) pushScope.push(r)
				if (s.match(/^write/)) for (const r of writeScope) pushScope.push(r)
			}
			let red = body.redirect_uris
			if (red === 'urn:ietf:wg:oauth:2.0:oob') {
				red = 'https://thedesk.top/hello.html'
			}
			const appData = await client.registerApp(body.client_name, { scopes: pushScope, redirect_uris: red, website: body.website });
			return {
				id: appData.id,
				name: appData.name,
				website: appData.website,
				redirect_uri: appData.redirectUri,
				client_id: Buffer.from(appData.url || '').toString('base64'),
				client_secret: appData.clientSecret,
			}
		} catch (e: any) {
			console.error(e)
			reply.code(401);
			return e.response.data;
		}
	});

	fastify.get('/v1/accounts/verify_credentials', async (request, reply) => {
		const BASE_URL = request.protocol + '://' + request.hostname;
		const accessTokens = request.headers.authorization;
		const client = getClient(BASE_URL, accessTokens);
		try {
			const data = await client.verifyAccountCredentials();
			return data.data;
		} catch (e: any) {
			console.error(e)
			reply.code(401);
			return e.response.data;
		}
	});


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



}