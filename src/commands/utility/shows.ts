import { Command } from 'discord-akairo';
import type { Message } from 'discord.js';
import { DateTime } from 'luxon';
import { codeblock, pad, pastee as paste } from '../../util';
import { Formats, shows } from '../../util/constants';
import request from '../../util/request';

export default class extends Command {
    public constructor() {
        super('shows', {
            aliases: ['shows'],
            description: 'Displays the upcoming shows for the specified week.',
            args: [
                {
                    id: 'date',
                    type: 'parsedDate',
                    match: 'content',
                    default: () => new Date()
                }
            ],
            typing: true
        });
    }

    public mod = true;

    public async exec(message: Message, { date }: { date: Date }) {
        const dtf = DateTime.fromJSDate(date, { zone: 'utc' });

        const final = [];
        let firstDay;

        for (let i = 1; i < 8; i++) {
            const date = dtf
                .set({ weekday: i })
                .toFormat(Formats.LOCG);

            if (i === 1) firstDay = date;

            const { body } = await request
                .get('http://api.tvmaze.com/schedule')
                .query({ country: 'US', date });

            const found = body.filter((e: Record<string, any>) => shows.has(e.show.id));
            if (!found.length) continue;

            for (const episode of found) {
                if (episode.number === null) continue;

                const day = DateTime.fromJSDate(new Date(episode.airdate), { zone: 'utc' });

                const season = pad(episode.season);
                const number = pad(episode.number);

                final.push(`* **${day.toFormat(Formats.DAY)}:** [***${episode.show.name}*** **s${season}e${number}** - *${episode.name}*](${episode.show.image.original})`);
            }
        }

        if (!final.length) return message.channel.send(`There are no episodes scheduled for the week of ${firstDay}`);

        const str = `Episodes scheduled for the week of ${firstDay}`;

        let joined = final.join('\n');

        joined = joined.length > 1900
            ? await paste(joined, str, 'markdown', true)
            : codeblock(joined, 'md');

        return message.util.send(`${str}\n${joined}`);
    }
}