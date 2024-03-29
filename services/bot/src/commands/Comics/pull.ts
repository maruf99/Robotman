import { resolveArgument } from '#util/arguments';
import { Embed } from '#util/builders';
import type { Command, CommandOptions, MessageContext } from '#util/commands';
import type { Publisher, PublisherData } from '#util/constants';
import { DateFormats, Publishers, Pull } from '#util/constants';
import { getPullDate } from '#util/misc';
import { reply } from '@skyra/editable-commands';
import { fetchReleases, FilterTypes, SortTypes } from 'comicgeeks';
import type { ApplicationCommandOptionData, CommandInteraction, Message } from 'discord.js';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { PREVIOUS, NEXT } = Pull.DEFAULT;

export default class implements Command {
	public options: CommandOptions = {
		aliases: ['pull', 'p', 'releases', PREVIOUS, NEXT].flat(),
		description: 'Gets the pull list for a publisher for a specified week.',
		extended: [
			'Defaults to DC\n',
			`To get next week's pull list, do \`${process.env.BOT_PREFIX}pullnext\``,
			`To get last week's pull list, do \`${process.env.BOT_PREFIX}pulllast\`\n`,
			'To get the pull list for a different week, you can put the date you want after the publisher\n',
			'Publisher codes are in codeblocks:\n',
			[...Publishers].map(([k, { name }]) => `${name} \`${k}\``).join('\n')
		],
		usage: '<publisher> [date]',
		example: ['dc', 'pulllast marvel', 'pullnext archie', 'idw December 2 2020', 'darkhorse 17 Jan 2021', 'boom 2021-02-13'],
		args: [
			{
				name: 'publisher',
				type: (_, arg) => Publishers.get((arg?.toLowerCase() as Publisher) ?? 'dc') ?? null,
				otherwise: 'Invalid publisher.'
			},
			{
				name: 'date',
				type: 'date',
				match: 'rest',
				default: () => new Date()
			}
		],
		cooldown: 2,
		typing: true
	};

	public interactionOptions: ApplicationCommandOptionData[] = [
		{
			name: 'publisher',
			description: 'The publisher to view the pull list for.',
			type: 'STRING',
			choices: [...Publishers].map(([value, { name }]) => ({ name, value })).slice(0, 25),
			required: true
		},
		{
			name: 'date',
			description: 'The week to view the pull list for.',
			type: 'STRING'
		}
	];

	public async exec(message: Message, { publisher, date }: { publisher: PublisherData; date: Date }, context: MessageContext) {
		let week = getPullDate(dayjs(date));

		const alias = context.alias.replace(/pull(last|next)/gi, 'pull-$1');

		if (NEXT.includes(alias)) {
			week = week.add(7, 'day');
		} else if (PREVIOUS.includes(alias)) {
			week = week.subtract(7, 'day');
		}

		return reply(message, await this.run(publisher, week));
	}

	public async interact(interaction: CommandInteraction, { publisher, date }: { publisher: Publisher; date: string }) {
		const parsed = resolveArgument(date, 'date') ?? new Date();
		const day = getPullDate(dayjs(parsed));

		return interaction.reply(await this.run(Publishers.get(publisher), day));
	}

	private async run(publisher: PublisherData, date: Dayjs) {
		const pull = await fetchReleases(date.format(DateFormats.LOCG), {
			publishers: [publisher.id],
			filter: [FilterTypes.Regular, FilterTypes.Digital, FilterTypes.Annual],
			sort: SortTypes.AlphaAsc
		});

		const week = (publisher.id === 1 ? date.subtract(1, 'day') : date).format(DateFormats.LOCG);

		return {
			embeds: [
				new Embed()
					.setColor(publisher.color)
					.setTitle(`${publisher.name} Pull List for the Week of ${week}`)
					.setDescription(pull.length ? pull.map((p) => p.name).join('\n') : 'No comics for this week (yet).')
					.setThumbnail(publisher.thumbnail)
			]
		};
	}
}
