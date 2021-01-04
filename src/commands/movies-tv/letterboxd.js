const { Command } = require('discord-akairo');
const letterboxd = require('letterboxd');
const { DateTime } = require('luxon');
const { randomResponse, closest, trim } = require('../../util');
const { formats } = require('../../util/constants');

const COLORS = [
    16087596,
    5029107,
    3334244
];

module.exports = class extends Command {
    constructor() {
        super('letterboxd', {
            aliases: ['letterboxd', 'letterbox'],
            description: {
                info: 'Shows movie reviews on a letterboxd account.',
                usage: '<user> <film>'
            },
            args: [
                {
                    id: 'username',
                    prompt: {
                        start: 'What is the name of the account you\'d like to view?'
                    }
                },
                {
                    id: 'film',
                    type: 'lowercase'
                }
            ],
            cooldown: 7e3,
            typing: true
        });
    }

    async exec(message, { username, film }) {
        try {
            const list = (await letterboxd(username))?.filter?.(a => a.type === 'diary');
            if (!list?.length) return message.util.send('That user does not have any reviews.');

            let rating;

            const embed = this.client.util.embed()
                .setColor(randomResponse(COLORS))
                .setAuthor('Letterboxd', 'https://i.imgur.com/2nQftA2.png', 'https://letterboxd.com/');

            if (!film || film === 'all') {
                const films = list.map(r => `[${r.film.title} (${r.film.year})](${r.uri}) ${r.rating?.text ?? ''}`);

                embed
                    .setTitle(`${username}'s Latest Reviews`)
                    .setURL(`https://letterboxd.com/${username}/films/reviews/`)
                    .setDescription(trim(films.slice(0, 23).join('\n'), 2048));
            } else {
                if (['latest', 'recent'].includes(film)) rating = list[0];
                else {
                    film = closest(film, list.map(a => a.film?.title).filter(a => a));
                    rating = list.find(m => m.film?.title === film);
                }

                if (!rating) return message.util.send('Cannot find a recent review for that film.');

                embed
                    .setTitle(`${rating.film.title} (${rating.film.year})`)
                    .setURL(rating.uri)
                    .setThumbnail(rating.film.image.large)
                    .setFooter(`Review by ${username}`)
                    .setTimestamp(rating.date?.published);

                if (rating.date?.watched) embed.addField('Watched On', DateTime.fromJSDate(new Date(rating.date?.watched)).toFormat(formats.locg));

                if (rating.review?.length) {
                    let desc = rating.review;
                    if (rating.spoiler) desc = desc.split('\n').map(d => `||${d}||`).join('\n');
                    embed.setDescription(desc);
                }

                if (rating.rating?.text) embed.addField('Rating', rating.rating.text);
            }

            return message.util.send(embed);
        } catch {
            return message.util.send('That user does not exist.');
        }
    }
};