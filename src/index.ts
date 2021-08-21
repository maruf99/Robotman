// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
require('dotenv').config();

import 'reflect-metadata';

import type { Command, Listener } from '#util/commands';
import { assignOptions } from '#util/commands';
import { PRODUCTION, ScheduleTime, Tables } from '#util/constants';
import { log } from '#util/logger';
import { Client, Collection, Constants, Intents, Options } from 'discord.js';
import { RecurrenceRule, scheduleJob } from 'node-schedule';
import { join } from 'node:path';
import readdirp from 'readdirp';
import { container } from 'tsyringe';
import type { Notice } from 'postgres';
import postgres from 'postgres';
import { formatTable } from '#util/misc';

const client = new Client({
	makeCache: Options.cacheWithLimits({
		MessageManager: 25,
		StageInstanceManager: 0,
		VoiceStateManager: 0,
		GuildStickerManager: 0,
		BaseGuildEmojiManager: 0
	}),
	allowedMentions: {
		parse: ['users']
	},
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_MESSAGES]
});

const sql = postgres(process.env.POSTGRES_URL, {
	onnotice: (notice: Notice) => {
		if (notice.code === '42P07') return;
		log(notice, 'info', { code: true }, { title: 'Postgres Notice' });
	}
});

const commands = new Collection<string, Command>();

container.register(Client, { useValue: client });
container.register('sql', { useValue: sql });
container.register('commands', { useValue: commands });

async function init() {
	log('Initializing...');

	await sql.begin(async (sql) => {
		await sql.unsafe(`create table if not exists auto_responses(${formatTable(Tables.AUTO_RESPONSES)})`);
	});

	client
		.on(Constants.Events.ERROR, (e) => log(e.stack, 'error', { ping: true }))
		.on(Constants.Events.WARN, (info) => log(info, 'warn'))
		.on(Constants.Events.SHARD_RECONNECTING, () => log('Attempting to reconnect...', 'info', { logToWebhook: false }))
		.on(Constants.Events.SHARD_RESUME, () => log('Reconnected', 'log', { logToWebhook: false }));

	const commandFiles = readdirp(join(__dirname, 'commands'), { fileFilter: '*.js' });
	const listenerFiles = readdirp(join(__dirname, 'listeners'), { fileFilter: '*.js' });

	for await (const commandFile of commandFiles) {
		const command = container.resolve<Command>((await import(commandFile.fullPath)).default);

		assignOptions(command, commandFile.fullPath);

		commands.set(command.options.name, command);
	}

	for await (const listenerFile of listenerFiles) {
		const listener = container.resolve<Listener>((await import(listenerFile.fullPath)).default);

		client[listener.event === 'ready' ? 'once' : 'on'](listener.event, listener.handle.bind(listener));
	}

	log(`Loaded ${commands.size} commands`);

	if (PRODUCTION && commands.has('release-list')) {
		scheduleJob(new RecurrenceRule(null, null, null, ScheduleTime.DAY, ScheduleTime.HOUR, ScheduleTime.MINUTE), () =>
			commands.get('release-list').exec()
		);
	}

	await client.login();
}

void init().catch((e) => log(e, 'error'));
