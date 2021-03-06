import cheerio from 'cheerio';
import { Command } from 'discord-akairo';
import { CommandInteraction, Constants, Message } from 'discord.js';
import { google, title, trim } from '../../util';
import { colors } from '../../util/constants';
import request from '../../util/request';

interface ComixologyData {
    publisher: {
        name: string;
        image: string;
    };
    name: string;
    description: string;
    cover: string;
    url: string;
    credits: {
        written: string[];
        art: string[];
        pencils: string[];
        inks: string[];
        colors: string[];
        cover: string[];
    };
    pageCount: number;
    releaseDate: string;
}

export default class extends Command {
    public constructor() {
        super('comic', {
            aliases: ['comic', 'comixology', 'issue', 'trade'],
            description: 'Searches ComiXology for an issue/trade.',
            args: [
                {
                    id: 'query',
                    match: 'content',
                    prompt: {
                        start: 'What would you like to search for?'
                    }
                }
            ],
            typing: true,
            cooldown: 10e3
        });
    }

    public data = {
        usage: '<query>',
        extended: ['More specific queries will give a more accurate result (e.g. including the launch year of the book, the writer, etc)'],
        examples: [
            'daredevil 1 zdarsky',
            'batman 50'
        ]
    };

    public interactionOptions = {
        name: 'comic',
        description: 'Searches ComiXology for an issue/trade.',
        options: [
            {
                type: Constants.ApplicationCommandOptionTypes.STRING,
                name: 'query',
                description: 'The issue/trade to search for.',
                required: true
            }
        ]
    };

    public async exec(message: Message, { query }: { query: string }) {
        return message.util.send(await this.run(query));
    }

    public async interact(interaction: CommandInteraction, { query }: { query: string }) {
        return interaction.reply(await this.run(query));
    }

    private async run(query: string) {
        const comic = await this.search(query);
        if (!comic) return { content: 'No results found', ephemeral: true };

        const embed = this.client.util
            .embed()
            .setColor(colors.COMIXOLOGY)
            .setAuthor(comic.publisher.name, comic.publisher.image)
            .setTitle(comic.name)
            .setURL(comic.url)
            .setDescription(trim(comic.description, 2048))
            .setThumbnail(comic.cover)
            .setFooter('ComiXology', 'https://i.imgur.com/w8RoAMX.png');

        for (const [name, credits] of Object.entries(comic.credits)) {
            if (credits.length) embed.addField(`${title(name)} By`, credits.join('\n'), true);
        }

        const { releaseDate, pageCount } = comic;

        if (pageCount) embed.addField('Page Count', pageCount.toString(), true);
        if (releaseDate) embed.addField('Release Date', releaseDate, true);

        return { embeds: [embed.inlineFields()] };
    }

    private async search(query: string): Promise<ComixologyData> {
        const res = await google(`site:https://comixology.com/ ${query}`);
        if (!res) return null;

        const found = res.items.find((i: Record<string, string>): boolean => i.link.includes('digital-comic'));
        if (!found) return null;

        const link = found.link.replace('https://m.', 'https://www.');
        const { text } = await request.get(link);

        const $ = cheerio.load(text);
        if (!$('img.icon').length) return null;

        const credits = $('div.credits')[0];

        const findData = (type: string): string[] => $(credits).find(`h2[title='${type}']`).map((_: number, el: cheerio.Element) => $(el).find('a').text().trim()).get();

        const written = findData('Written by');
        const art = findData('Art by');
        const pencils = findData('Pencils');
        const inks = findData('Inks');
        const colors = findData('Colored by');
        const cover = findData('Cover by');

        const otherDetails = $('div.aboutText');
        const pageCount = Number(otherDetails.get(0).children[0].data);
        const releaseDate = otherDetails.get(1).children[0].data;

        return {
            publisher: { name: $('h3.name').text(), image: $('img.icon').eq(1).attr('src') },
            name: $('h1.title').text(),
            description: $('.item-description').text(),
            cover: encodeURI($('img.cover').first().attr('src')).replace('%', ''),
            url: link,
            credits: { written, art, pencils, inks, colors, cover },
            pageCount,
            releaseDate
        };
    }
}