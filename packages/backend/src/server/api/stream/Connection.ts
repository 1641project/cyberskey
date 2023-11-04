/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as WebSocket from 'ws';
import type { MiUser } from '@/models/User.js';
import type { MiAccessToken } from '@/models/AccessToken.js';
import type { Packed } from '@/misc/json-schema.js';
import type { NoteReadService } from '@/core/NoteReadService.js';
import type { NotificationService } from '@/core/NotificationService.js';
import { bindThis } from '@/decorators.js';
import { CacheService } from '@/core/CacheService.js';
import { MiFollowing, MiUserProfile } from '@/models/_.js';
import type { StreamEventEmitter, GlobalEvents } from '@/core/GlobalEventService.js';
import { ChannelFollowingService } from '@/core/ChannelFollowingService.js';
import type { ChannelsService } from './ChannelsService.js';
import type { EventEmitter } from 'events';
import type Channel from './channel.js';
import { Converter } from '@cutls/megalodon'
import { getClient } from '../mastodon/ApiMastodonCompatibleCallService.js';
import { toTextWithReaction } from '../mastodon/endpoints/timeline.js';

/**
 * Main stream connection
 */
// eslint-disable-next-line import/no-default-export
export default class Connection {
	public user?: MiUser;
	public token?: MiAccessToken;
	private wsConnection: WebSocket.WebSocket;
	public subscriber: StreamEventEmitter;
	private channels: Channel[] = [];
	private subscribingNotes: any = {};
	private cachedNotes: Packed<'Note'>[] = [];
	private isMastodonCompatible: boolean = false;
	private host: string;
	private accessToken: string;
	private currentSubscribe: string[][] = [];
	public userProfile: MiUserProfile | null = null;
	public following: Record<string, Pick<MiFollowing, 'withReplies'> | undefined> = {};
	public followingChannels: Set<string> = new Set();
	public userIdsWhoMeMuting: Set<string> = new Set();
	public userIdsWhoBlockingMe: Set<string> = new Set();
	public userIdsWhoMeMutingRenotes: Set<string> = new Set();
	private fetchIntervalId: NodeJS.Timeout | null = null;

	constructor(
		private channelsService: ChannelsService,
		private noteReadService: NoteReadService,
		private notificationService: NotificationService,
		private cacheService: CacheService,
		private channelFollowingService: ChannelFollowingService,

		host: string,
		accessToken: string,
		prepareStream: string | undefined,
		user: MiUser | null | undefined,
		token: MiAccessToken | null | undefined,
	) {
		console.log('constructor', host)
		this.wsConnection = this.wsConnection;
		this.subscriber = this.subscriber;
		if (user) this.user = user;
		if (token) this.token = token;
		if (host) this.host = host;
		if (accessToken) this.accessToken = accessToken;
		console.log('prepare', prepareStream);
		if (prepareStream) {
			this.onWsConnectionMessage(Buffer.from(JSON.stringify({ stream: prepareStream, type: 'subscribe' })))
		}
	}

	@bindThis
	public async fetch() {
		if (this.user == null) return;
		const [userProfile, following, followingChannels, userIdsWhoMeMuting, userIdsWhoBlockingMe, userIdsWhoMeMutingRenotes] = await Promise.all([
			this.cacheService.userProfileCache.fetch(this.user.id),
			this.cacheService.userFollowingsCache.fetch(this.user.id),
			this.channelFollowingService.userFollowingChannelsCache.fetch(this.user.id),
			this.cacheService.userMutingsCache.fetch(this.user.id),
			this.cacheService.userBlockedCache.fetch(this.user.id),
			this.cacheService.renoteMutingsCache.fetch(this.user.id),
		]);
		this.userProfile = userProfile;
		this.following = following;
		this.followingChannels = followingChannels;
		this.userIdsWhoMeMuting = userIdsWhoMeMuting;
		this.userIdsWhoBlockingMe = userIdsWhoBlockingMe;
		this.userIdsWhoMeMutingRenotes = userIdsWhoMeMutingRenotes;
	}

	@bindThis
	public async init() {
		if (this.user != null) {
			await this.fetch();

			if (!this.fetchIntervalId) {
				this.fetchIntervalId = setInterval(this.fetch, 1000 * 10);
			}
		}
	}

	@bindThis
	public async listen(subscriber: EventEmitter, wsConnection: WebSocket.WebSocket) {
		this.subscriber = subscriber;

		this.wsConnection = wsConnection;
		this.wsConnection.on('message', this.onWsConnectionMessage);

		this.subscriber.on('broadcast', data => {
			this.onBroadcastMessage(data);
		});
	}

	/**
	 * クライアントからメッセージ受信時
	 */
	@bindThis
	private async onWsConnectionMessage(data: WebSocket.RawData) {
		let object: Record<string, any>;
		let objs: Record<string, any>[] = [];
		try {
			object = JSON.parse(data.toString());
		} catch (e) {
			return;
		}
		objs = [object]
		const simpleObj = object
		if (simpleObj.stream) {
			// is Mastodon Compatible
			this.isMastodonCompatible = true
			if (simpleObj.type === 'subscribe') {
				let forSubscribe = []
				if (simpleObj.stream === 'user') {
					this.currentSubscribe.push(['user'])
					objs = [{
						type: 'connect',
						body: {
							channel: 'main',
							id: simpleObj.stream
						}
					},
					{
						type: 'connect',
						body: {
							channel: 'homeTimeline',
							id: simpleObj.stream,
							params: { withReplies: false }
						}
					}
					]
					const client = getClient(this.host, this.accessToken);
					try {
						const tl = await client.getHomeTimeline()
						for (const t of tl.data) forSubscribe.push(t.id)

					} catch (e: any) {
						console.log(e)
						console.error(e.response.data)
					}
				} else if (simpleObj.stream === 'public:local') {
					this.currentSubscribe.push(['public:local'])
					objs = [
						{
							type: 'connect',
							body: {
								channel: 'localTimeline',
								id: simpleObj.stream
							}
						}
					]
					const client = getClient(this.host, this.accessToken);
					const tl = await client.getLocalTimeline()
					for (const t of tl.data) forSubscribe.push(t.id)
				} else if (simpleObj.stream === 'public') {
					this.currentSubscribe.push(['public'])
					objs = [
						{
							type: 'connect',
							body: {
								channel: 'globalTimeline',
								id: simpleObj.stream
							}
						}
					]
					const client = getClient(this.host, this.accessToken);
					const tl = await client.getPublicTimeline()
					for (const t of tl.data) forSubscribe.push(t.id)
				} else if (simpleObj.stream === 'list') {
					this.currentSubscribe.push(['list', simpleObj.list])
					objs = [
						{
							type: 'connect',
							body: {
								channel: 'list',
								id: simpleObj.stream,
								params: {
									listId: simpleObj.list
								}
							}
						}
					]
					const client = getClient(this.host, this.accessToken);
					const tl = await client.getListTimeline(simpleObj.list)
					for (const t of tl.data) forSubscribe.push(t.id)
				}
				for (const s of forSubscribe) {
					objs.push({
						type: 's',
						body: {
							id: s
						}
					})
				}
			}
		}

		for (const obj of objs) {
			const { type, body } = obj;
			console.log(type, body)
			switch (type) {
				case 'readNotification': this.onReadNotification(body); break;
				case 'subNote': this.onSubscribeNote(body); break;
				case 's': this.onSubscribeNote(body); break; // alias
				case 'sr': this.onSubscribeNote(body); this.readNote(body); break;
				case 'unsubNote': this.onUnsubscribeNote(body); break;
				case 'un': this.onUnsubscribeNote(body); break; // alias
				case 'connect': this.onChannelConnectRequested(body); break;
				case 'disconnect': this.onChannelDisconnectRequested(body); break;
				case 'channel': this.onChannelMessageRequested(body); break;
				case 'ch': this.onChannelMessageRequested(body); break; // alias
			}
		}
	}

	@bindThis
	private onBroadcastMessage(data: GlobalEvents['broadcast']['payload']) {
		this.sendMessageToWs(data.type, data.body);
	}

	@bindThis
	public cacheNote(note: Packed<'Note'>) {
		const add = (note: Packed<'Note'>) => {
			const existIndex = this.cachedNotes.findIndex(n => n.id === note.id);
			if (existIndex > -1) {
				this.cachedNotes[existIndex] = note;
				return;
			}

			this.cachedNotes.unshift(note);
			if (this.cachedNotes.length > 32) {
				this.cachedNotes.splice(32);
			}
		};

		add(note);
		if (note.reply) add(note.reply);
		if (note.renote) add(note.renote);
	}

	@bindThis
	private readNote(body: any) {
		const id = body.id;

		const note = this.cachedNotes.find(n => n.id === id);
		if (note == null) return;

		if (this.user && (note.userId !== this.user.id)) {
			this.noteReadService.read(this.user.id, [note]);
		}
	}

	@bindThis
	private onReadNotification(payload: any) {
		this.notificationService.readAllNotification(this.user!.id);
	}

	/**
	 * 投稿購読要求時
	 */
	@bindThis
	private onSubscribeNote(payload: any) {
		if (!payload.id) return;

		if (this.subscribingNotes[payload.id] == null) {
			this.subscribingNotes[payload.id] = 0;
		}

		this.subscribingNotes[payload.id]++;

		if (this.subscribingNotes[payload.id] === 1) {
			this.subscriber.on(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}
	}

	/**
	 * 投稿購読解除要求時
	 */
	@bindThis
	private onUnsubscribeNote(payload: any) {
		if (!payload.id) return;

		this.subscribingNotes[payload.id]--;
		if (this.subscribingNotes[payload.id] <= 0) {
			delete this.subscribingNotes[payload.id];
			this.subscriber.off(`noteStream:${payload.id}`, this.onNoteStreamMessage);
		}
	}

	@bindThis
	private async onNoteStreamMessage(data: GlobalEvents['note']['payload']) {
		this.sendMessageToWs('noteUpdated', {
			id: data.body.id,
			type: data.type,
			body: data.body.body,
		});
	}

	/**
	 * チャンネル接続要求時
	 */
	@bindThis
	private onChannelConnectRequested(payload: any) {
		const { channel, id, params, pong } = payload;
		this.connectChannel(id, params, channel, pong);
	}

	/**
	 * チャンネル切断要求時
	 */
	@bindThis
	private onChannelDisconnectRequested(payload: any) {
		const { id } = payload;
		this.disconnectChannel(id);
	}
	/**
	 * クライアントにメッセージ送信
	 */
	@bindThis
	public sendMessageToWs(type: string, payload: any) {
		console.log('sending', this.isMastodonCompatible, payload)
		if (this.isMastodonCompatible) {
			if (payload.type === 'note') {
				this.wsConnection.send(JSON.stringify({
					stream: [payload.id],
					event: 'update',
					payload: JSON.stringify(toTextWithReaction([Converter.note(payload.body, this.host)], this.host)[0])
				}));
				this.onSubscribeNote({
					id: payload.body.id
				})
			} else if (payload.type === 'reacted' || payload.type === 'unreacted') {
				// reaction
				const client = getClient(this.host, this.accessToken);
				client.getStatus(payload.id).then((data) => {
					const newPost = toTextWithReaction([data.data], this.host);
					const targetPost = newPost[0]
					for (const stream of this.currentSubscribe) {
						this.wsConnection.send(JSON.stringify({
							stream,
							event: 'status.update',
							payload: JSON.stringify(targetPost)
						}));
					}
				})
			} else if (payload.type === 'deleted') {
				// delete
				for (const stream of this.currentSubscribe) {
					this.wsConnection.send(JSON.stringify({
						stream,
						event: 'delete',
						payload: payload.id
					}));
				}
			} else if (payload.type === 'unreadNotification') {
				if (payload.id === 'user') {
					const body = Converter.notification(payload.body, this.host)
					if (body.type === 'reaction') body.type = 'favourite'
					body.status = toTextWithReaction(body.status ? [body.status] : [], '')[0]
					this.wsConnection.send(JSON.stringify({
						stream: ['user'],
						event: 'notification',
						payload: JSON.stringify(body)
					}));
				}
			}

		} else {
			this.wsConnection.send(JSON.stringify({
				type: type,
				body: payload,
			}));
		}
	}

	/**
	 * チャンネルに接続
	 */
	@bindThis
	public connectChannel(id: string, params: any, channel: string, pong = false) {
		const channelService = this.channelsService.getChannelService(channel);
		console.log('channelSubscribe', params, channel)

		if (channelService.requireCredential && this.user == null) {
			return;
		}
		console.log('channelSubscribe2', params, channel)

		// 共有可能チャンネルに接続しようとしていて、かつそのチャンネルに既に接続していたら無意味なので無視
		if (channelService.shouldShare && this.channels.some(c => c.chName === channel)) {
			return;
		}
		console.log('channelSubscribe3', params, channel)

		const ch: Channel = channelService.create(id, this);
		this.channels.push(ch);
		ch.init(params ?? {});

		if (pong) {
			this.sendMessageToWs('connected', {
				id: id,
			});
		}
	}

	/**
	 * チャンネルから切断
	 * @param id チャンネルコネクションID
	 */
	@bindThis
	public disconnectChannel(id: string) {
		const channel = this.channels.find(c => c.id === id);

		if (channel) {
			if (channel.dispose) channel.dispose();
			this.channels = this.channels.filter(c => c.id !== id);
		}
	}

	/**
	 * チャンネルへメッセージ送信要求時
	 * @param data メッセージ
	 */
	@bindThis
	private onChannelMessageRequested(data: any) {
		const channel = this.channels.find(c => c.id === data.id);
		if (channel != null && channel.onMessage != null) {
			channel.onMessage(data.type, data.body);
		}
	}

	/**
	 * ストリームが切れたとき
	 */
	@bindThis
	public dispose() {
		if (this.fetchIntervalId) clearInterval(this.fetchIntervalId);
		for (const c of this.channels.filter(c => c.dispose)) {
			if (c.dispose) c.dispose();
		}
	}
}
