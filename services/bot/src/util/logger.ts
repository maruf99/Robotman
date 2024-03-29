import { DateFormats, LogTypes } from '#util/constants';
import { codeBlock, time, TimestampStyles } from '@discordjs/builders';
import * as colorette from 'colorette';
import dayjs from 'dayjs';
import type { MessageEmbedOptions } from 'discord.js';
import { Util, WebhookClient } from 'discord.js';
import { inspect } from 'node:util';

const { NODE_ENV, BOT_OWNER, WEBHOOK_URL } = process.env;

type ConsoleType = 'log' | 'error' | 'info' | 'warn';
type ColoretteType = 'green' | 'red' | 'blue' | 'yellow';

interface LogOptions {
	logToWebhook?: boolean;
	logToConsole?: boolean;
	code?: boolean | string;
	ping?: boolean;
	extra?: MessageEmbedOptions;
}

let webhook: WebhookClient = null;

if (WEBHOOK_URL) {
	webhook = new WebhookClient({ url: WEBHOOK_URL });
}

export function log(
	text: any,
	logType: ConsoleType = 'log',
	{ logToWebhook = true, logToConsole = true, code = false, ping = false, extra = {} }: LogOptions = {}
): void {
	if (Array.isArray(text)) {
		text = text.join('\n');
	}

	if (typeof text === 'object') {
		text = inspect(text);
	}

	if (!Reflect.has(LogTypes, logType.toLowerCase())) {
		logType = 'log';
	}

	if (logToConsole) {
		consoleLog(text?.replaceAll(/(```(\w+)?|`|\*|__|~~)/g, ''), logType);
	}

	if (logToWebhook && webhook) {
		webhookLog(text, logType, ping, code, extra);
	}
}

function consoleLog(text: string, logType: ConsoleType): void {
	console[logType](
		colorette.gray(`[${dayjs().format(DateFormats.LOG)}] `),
		colorette.bold(colorette[LogTypes[logType].name as ColoretteType](text))
	);
}

function webhookLog(text: string, logType: ConsoleType, ping: boolean, code: boolean | string, extra: MessageEmbedOptions): void {
	const mode = LogTypes[logType];
	const embed: MessageEmbedOptions = {
		title: `${mode.title} ${NODE_ENV === 'development' ? '(Development)' : ''}`,
		color: mode.color
	};

	if (typeof extra === 'object') Object.assign(embed, extra);

	const content = `${ping ? `<@${BOT_OWNER}>` : ''}\n${time(dayjs().unix(), TimestampStyles.ShortDateTime)}`;

	try {
		if (text.length < 2040) {
			if (logType === 'error') {
				text = codeBlock('xl', text);
			} else if (code) {
				text = codeBlock(typeof code === 'string' ? code : 'js', text);
			}

			if (typeof embed.description === 'undefined') embed.description = text;

			void webhook.send({
				content,
				embeds: [embed]
			});
		} else {
			void webhook.send({
				content,
				embeds: [embed]
			});

			const texts = Util.splitMessage(text, { maxLength: 1980, char: '' });

			for (const item of texts) {
				void webhook.send(codeBlock(logType === 'error' ? 'xl' : code === true ? 'js' : (code as string), item));
			}
		}
	} catch (e: any) {
		consoleLog(e, 'error');
	}
}
