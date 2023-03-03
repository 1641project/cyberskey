import { Inject, Injectable } from '@nestjs/common';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import { ModuleRef } from '@nestjs/core';
import type { Config } from '@/config.js';
import type { UsersRepository, InstancesRepository, AccessTokensRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import endpoints from '../endpoints.js';
import { ApiCallService } from '../ApiCallService.js';
import { SignupApiService } from '../SignupApiService.js';
import { SigninApiService } from '../SigninApiService.js';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { apiMastodonCompatible } from './ApiMastodonCompatibleCallService.js';
import { createTemp } from '@/misc/create-temp.js';
import { pipeline } from 'node:stream';
import * as fs from 'node:fs';
import { promisify } from 'node:util';
const pump = promisify(pipeline);

@Injectable()
export class ApiMastodonCompatibleService {
	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private userEntityService: UserEntityService,
		private apiCallService: ApiCallService,
		private signupApiService: SignupApiService,
		private signinApiService: SigninApiService,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		fastify.register(cors, {
			origin: '*',
		});
		async function onFile(part: any) {
			const [path] = await createTemp();
			await pump(part.file, fs.createWriteStream(path))
			part.value = [part.filename, path]
		}
		fastify.register(multipart, {
			attachFieldsToBody: 'keyValues',
			onFile,
			limits: {
				fileSize: this.config.maxFileSize ?? 262144000,
				files: 1,
			},
		});

		fastify.register(fastifyCookie, {});

		// Prevent cache
		fastify.addHook('onRequest', (request, reply, done) => {
			reply.header('Cache-Control', 'private, max-age=0, must-revalidate');
			done();
		});

		apiMastodonCompatible(fastify)

		done();
	}
}