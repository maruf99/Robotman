import { Command } from 'discord-akairo';
import type { Message } from 'discord.js';
import { DateTime } from 'luxon';
import { closest, randomResponse, split, trim } from '../../util';
import { colors, Formats } from '../../util/constants';
import letterboxd, { ReviewEntry } from '../../util/letterboxd';

export default class extends Command {
    public constructor() {
        super('letterboxd', {
            aliases: ['letterboxd', 'letterbox'],
            description: 'Shows movie reviews on a letterboxd account.',
            args: [
                {
                    id: 'username',
                    prompt: {
                        start: 'What is the name of the account you\'d like to view?'
                    }
                },
                {
                    id: 'film',
                    type: 'lowercase',
                    match: 'rest'
                }
            ],
            cooldown: 6e3,
            typing: true
        });
    }

    public data = {
        usage: '<user> <film>'
    };

    public async exec(message: Message, { username, film }: { username: string; film: string }) {
        const { user, diaries: list } = await letterboxd.get(username);

        if (!list) return message.util.send('That user does not exist.');
        if (!list.length) return message.util.send('That user does not have any reviews.');

        let rating;

        const embed = this.client.util
            .embed()
            .setColor(
                randomResponse([
                    colors.LETTERBOXD_BLUE,
                    colors.LETTERBOXD_GREEN,
                    colors.LETTERBOXD_ORANGE
                ])
            )
            .setAuthor('Letterboxd', 'https://i.imgur.com/2nQftA2.png', 'https://letterboxd.com/');

        if (!film || film === 'all') {
            const films = list.map(r => `[${this.getFilm(r)}](${r.url}) ${r.rating ?? ''}`);
            const chunks = split(films, 10).entries();

            for (let [i, chunk] of chunks) {
                embed.addField(`Page ${++i}`, trim(chunk.join('\n'), 1024), true);
            }

            embed
                .setTitle(`${user}'s Latest Reviews`)
                .setURL(`https://letterboxd.com/${username}/films/reviews/`);
        } else {
            if (['latest', 'recent'].includes(film)) {
                rating = list[0];
            } else {
                film = closest(film, list.map(a => a.film?.title).filter(Boolean));
                rating = list.find(m => m.film?.title === film);
            }

            if (!rating) return message.util.send('Cannot find a recent review for that film.');

            embed
                .setTitle(this.getFilm(rating))
                .setURL(rating.url)
                .setThumbnail(rating.film.image)
                .setFooter(`Review by ${user}`)
                .setTimestamp(rating.published);

            if (!isNaN(rating.watched.getTime())) embed.addField('Watched On', DateTime.fromJSDate(rating.watched).toFormat(Formats.REGULAR));

            if (rating.review?.length) {
                let desc = rating.review;
                if (rating.spoiler) desc = desc.split('\n').map(d => `||${d}||`).join('\n');
                embed.setDescription(trim(desc, 2048));
            }

            if (rating.rating) embed.addField('Rating', rating.rating);
        }

        return message.util.send({ embeds: [embed] });
    }

    private getFilm(rating: ReviewEntry) {
        return `${rating.film.title} (${rating.film.year})`;
    }
}