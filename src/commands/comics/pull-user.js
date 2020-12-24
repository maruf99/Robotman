const { Command } = require('discord-akairo');
const moment = require('moment');
const { pull: { user: { previous, next } }, formats, colors } = require('../../util/constants');
const { getPulls, resolveUser } = require('../../util/locg');

module.exports = class extends Command {
    constructor() {
        super('pulluser', {
            aliases: ['pull-user', 'p-u', 'pull-u', 'p-user', previous, next].flat(),
            description: {
                info: 'Gets the pull list for a user on League of Comic Geeks for a specified week.',
                usage: '<locg username> <date>',
                extended: [
                    'To get next week\'s pull list, do `{p}pullnextuser`',
                    'To get last week\'s pull list, do `{p}pulllastuser`\n',
                    'To get the pull list for a different week, you can put the date you want after the username\n',
                    "You can create a LOCG account [here](https://leagueofcomicgeeks.com/)",
                    'Once you have an account, simply subscribe to whatever series\' you are pulling to create a pull list'
                ],
                examples: [
                    "maruf99",
                    "pullnextuser maruf99",
                    "pulllastuser maruf99",
                    "pulluser maruf99 Jan 2 2021"
                ]
            },
            args: [
                {
                    id: 'username',
                    type: 'string',
                    prompt: {
                        start: 'Which user\'s pull list would you like to view?'
                    }
                },
                {
                    id: 'date',
                    type: 'parsedDate',
                    match: 'rest'
                }
            ],
            typing: true,
            ratelimit: 4
        });
    }

    async exec(message, { username, date }) {
        date = date ? moment(date).day(3) : (moment().weekday() <= 3 ? moment().day(3) : moment().day(3).add(7, 'days'));

        if (next.includes(message.util.parsed.alias)) date = date.add(7, 'days');
        else if (previous.includes(message.util.parsed.alias)) date = date.subtract(7, 'days');

        date = date.format(formats.locg);

        const user = await resolveUser(username);
        if (!user) return message.util.send('Invalid username.');

        const pulls = await getPulls(user.id, date);
        const prices = pulls.length ? pulls.map(p => Number(p.price.replaceAll("$", ""))).reduce((a, b) => a + b).toFixed(2) : null;

        const embed = this.client.util.embed()
            .setColor(colors.LOCG)
            .setTitle(`${user.name}'s Pull List for the Week of ${date}`)
            .setURL(user.url)
            .setDescription(pulls.length ? pulls.map(p => p.name).join('\n') : 'No pulls for this week')
            .setFooter("League of Comic Geeks", "https://leagueofcomicgeeks.com/assets/images/user-menu-logo-icon.png");

        if (prices) embed.addField('Total', `$${prices} USD`);

        return message.util.send(embed);
    }
};