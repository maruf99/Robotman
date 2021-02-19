import { BASE_URL, fetchPulls, fetchUser, SortTypes, User } from 'comicgeeks';
import { Command } from 'discord-akairo';
import { APIInteractionResponseType, ApplicationCommandOptionType } from 'discord-api-types/v8';
import type { Message } from 'discord.js';
import { DateTime } from 'luxon';
import type Interaction from '../../structures/Interaction';
import { getPullDate } from '../../util';
import { colors, formats, pull } from '../../util/constants';

const { previous, next } = pull.user;

export default class extends Command {
    public constructor() {
        super('pull-user', {
            aliases: ['pull-user', 'p-u', 'pull-u', 'p-user', previous, next].flat(),
            description: {
                info: 'Gets the pull list for a user on League of Comic Geeks for a specified week.',
                usage: '<locg username> <date>',
                extended: [
                    'To get next week\'s pull list, do `{p}pullnextuser`',
                    'To get last week\'s pull list, do `{p}pulllastuser`\n',
                    'To get the pull list for a different week, you can put the date you want after the username\n',
                    `You can create a LOCG account [here](${BASE_URL})`,
                    'Once you have an account, simply subscribe to whatever series\' you are pulling to create a pull list'
                ],
                examples: [
                    'maruf99',
                    'pullnextuser maruf99',
                    'pulllastuser maruf99',
                    'pulluser maruf99 Jan 2 2021'
                ]
            },
            args: [
                {
                    id: 'username',
                    type: 'lowercase',
                    prompt: {
                        start: 'Which user\'s pull list would you like to view?'
                    }
                },
                {
                    id: 'date',
                    type: 'parsedDate',
                    match: 'rest',
                    default: () => new Date()
                }
            ],
            typing: true,
            cooldown: 4e3
        });
    }

    private readonly userCache = new Map<string, User>();

    public interactionOptions = {
        name: 'pull-user',
        description: 'Gets the pull list for a user on League of Comic Geeks for a specified week.',
        options: [
            {
                type: ApplicationCommandOptionType.STRING,
                name: 'username',
                description: 'The username to view the pull list for.',
                required: true
            },
            {
                type: ApplicationCommandOptionType.STRING,
                name: 'date',
                description: 'The week to view the pull list for.'
            }
        ]
    };

    public async exec(message: Message, { username, date }: { username: string; date: Date }) {
        let week = getPullDate(DateTime.fromJSDate(date).setZone('utc'));

        if (next.includes(message.util.parsed.alias)) {
            week = week.plus({ days: 7 });
        } else if (previous.includes(message.util.parsed.alias)) {
            week = week.minus({ days: 7 });
        }

        return message.util.send(await this.main(username, week));
    }

    public async interact(interaction: Interaction) {
        const [username, date] = interaction.findOptions('username', 'date');

        const parsed: Date = this.handler.resolver.type('parsedDate')(null, date) ?? new Date();
        const week = getPullDate(DateTime.fromJSDate(parsed).setZone('utc'));

        return interaction.respond(await this.main(username.toLowerCase(), week));
    }

    private async main(username: string, date: DateTime) {
        const week = date.toFormat(formats.locg);

        const user: User = this.userCache.has(username)
            ? this.userCache.get(username)
            : await fetchUser(username).catch(() => null);

        if (!user) return { content: 'That user does not exist', type: APIInteractionResponseType.ChannelMessage, ephemeral: true };

        if (!this.userCache.has(username)) this.userCache.set(username, user);

        const pulls = await fetchPulls(user.id, week, { sort: SortTypes.AlphaAsc });
        const prices = pulls.length ? pulls.map(p => Number(p.price.replaceAll('$', ''))).reduce((a, b) => a + b).toFixed(2) : null;

        const embed = this.client.util
            .embed()
            .setColor(colors.LOCG)
            .setAuthor(`${user.name}'s Pull List for the Week of ${week}`, user.avatar, `${user.url}/pull-list`)
            .setDescription(pulls.length ? pulls.map(p => p.name).join('\n') : 'No pulls for this week')
            .setFooter('League of Comic Geeks', `${BASE_URL}/assets/images/user-menu-logo-icon.png`);

        if (prices) embed.addField('Total', `$${prices} USD`);

        return embed;
    }
}