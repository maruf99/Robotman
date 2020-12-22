const { Command } = require('discord-akairo');
const { trim, formatQuery, fetch } = require('../../util');

module.exports = class extends Command {
    constructor() {
        super('wiki', {
            aliases: ['wiki', 'wikipedia'],
            description: {
                info: 'Searches Wikipedia.',
                usage: '<query>',
                examples: ['comicbooks'],
            },
            args: [
                {
                    id: 'query',
                    match: 'content',
                    prompt: {
                        start: 'What would you like to search for?'
                    }
                }
            ],
            typing: true
        });

        this.badWords = null;
    }

    async exec(message, { query }) {
        const wordlist = await this.getBadWords();
        if (query.split(/ +/).some(a => wordlist.includes(a))) return message.util.send('You cannot search for that term.');

        const page = await this.search(formatQuery(query));
        if (!page) return message.util.send('No results found.');

        const embed = this.client.util.embed()
            .setColor('#F8F8F8')
            .setTitle(page.title)
            .setDescription(page.description)
            .setURL(page.url)
            .setFooter('Wikipedia', 'https://upload.wikimedia.org/wikipedia/commons/7/75/Wikipedia_mobile_app_logo.png');

        if (page.image) embed.setImage(page.image);

        return message.util.send(embed);
    }

    async search(query) {
        const params = {
            action: 'query',
            titles: query,
            prop: 'extracts|pageimages|links',
            format: 'json',
            formatversion: 2,
            exintro: true,
            redirects: true,
            explaintext: true,
            pithumbsize: 1000
        };

        const res = await fetch('https://en.wikipedia.org/w/api.php', params);

        const page = res.query.pages[0];
        if (page.missing || !page.extract) return null;
        let description = page.extract;

        if (/may (also )?refer to/gi.test(description)) {
            const links = page.links.map(l => `[${l.title}](${this.getLink(l.title)})`).join('\n');
            description = `${trim(description.trimEnd(), 1015)}\n${trim(links, 1015)}`;
        } else {
            description = trim(description.split('\n')[0].trimEnd(), 1015);
        }

        return {
            title: page.title,
            description,
            url: this.getLink(page.title),
            image: page.thumbnail ? page.thumbnail.source : null
        };
    }

    getLink(page) {
        return `https://en.wikipedia.org/wiki/${encodeURIComponent(page.replaceAll(' ', '_'))}`;
    }

    async getBadWords() {
        if (this.badWords) return this.badWords;
        const url = 'https://raw.githubusercontent.com/RobertJGabriel/Google-profanity-words/master/list.txt';
        const body = (await fetch(url, null, 'text')).split('\n');
        this.badWords = body;
        return this.badWords;
    }
};