import { SnowflakeUtil, Guild } from 'discord.js';
import { DateTime } from 'luxon';
import { basename, dirname } from 'path';
import request from './request';
import { formats, EPOCH } from './constants';

interface WebhookCredentials {
    id: string;
    token: string;
}

export function parseWebhook(url: string): WebhookCredentials {
    return {
        id: basename(dirname(url)),
        token: basename(url)
    };
}

export function resolveGuild(guild: string | Guild): string {
    return guild instanceof Guild ? guild.id : guild;
}

export function title(str: string): string {
    return str.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function trim(str: string, max: number): string {
    return (str.length > max) ? `${str.slice(0, max - 3).trimEnd()}...` : str;
}

export function plural(word: string, length: number): string {
    return `${word}${length === 1 ? '' : 's'}`;
}

export function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function formatDate(date: Date, format: string = formats.log): string {
    return DateTime.fromJSDate(date, { zone: 'utc' }).toFormat(format);
}

export function difference(date: Date, format: string = formats.days) {
    return DateTime.local().diff(DateTime.fromJSDate(date), 'days').toFormat(format);
}

export function formatQuery(str: string): string {
    return title(str).split(' ').join('_');
}

export function codeblock(str: any, lang = '') {
    if (typeof str !== 'string') str = String(str);
    if (!str.length) str = String.fromCharCode(8203);
    return `\`\`\`${lang}\n${str}\`\`\``;
}

export function redact(str: string): string {
    if (typeof str !== 'string') return str;
    const tokens = [
        'WEBHOOK_URL',
        'DISCORD_TOKEN',
        'DATABASE_URL',
        'GOOGLE_SEARCH_KEY',
        'GOOGLE_ENGINE_KEY',
        'SERVICE_ACCOUNT_EMAIL',
        'SERVICE_ACCOUNT_KEY',
        'SPREADSHEET',
        'COMICVINE_KEY',
        'PASTE_KEY',
        'DICTIONARY_KEY',
        'MOVIEDB_KEY'
    ];
    return str.replaceAll(new RegExp(tokens.map(t => escapeRegex(process.env[t])).join('|'), 'gi'), '[REDACTED]');
}

export function wait(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export function randomDate(amount = 1) {
    const arr = [];
    for (let i = 0; i < amount; i++) arr.push(EPOCH + (Math.random() * (Date.now() - EPOCH)));
    return arr;
}

export function randomID(amount = 1) {
    const dates = randomDate(amount);
    const arr = [];
    for (const date of dates) arr.push(SnowflakeUtil.generate(date));
    return arr;
}

export function randomToken(amount = 1) {
    const final = [];

    const a = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    const b = ['_', '-'];

    const ids = randomID(amount);

    for (const id of ids) {
        let current = `${Buffer.from(id).toString('base64')}.C`;

        for (let i = 0; i < 5; i++) {
            if (i === 0) current += Math.round(Math.random() * 9);
            else current += (Math.random() > 0.4) ? a[Math.round(Math.random() * 25)].toUpperCase() : (Math.random() > 0.9) ? b[Math.round(Math.random())] : a[Math.round(Math.random() * 25)];
        }

        current += '.';

        for (let i = 0; i < 27; i++) {
            if (Math.random() > 0.4) current += a[Math.round(Math.random() * 25)].toUpperCase();
            else if (Math.random() > 0.3) current += a[Math.round(Math.random() * 25)];
            else if (Math.random() > 0.5) current += b[Math.round(Math.random())];
            else current += Math.round(Math.random() * 9);
        }

        final.push(current);
    }

    return amount === 1 ? final[0] : final;
}

export function split(arr: any[], max: number): any[] {
    const newArray = [];
    for (let i = 0; i < arr.length; i += max) newArray.push(arr.slice(i, i += max));
    return newArray;
}

export function removeArticles(str: string): string {
    const words = str.split(' ');
    if (['a', 'the', 'an'].includes(words[0]) && words[1]) return words.slice(1).join(' ');
    return str;
}

export function sort(arr: any[]) {
    return arr.sort((a, b) => {
        a = removeArticles((a.name ?? a).toLowerCase());
        b = removeArticles((b.name ?? b).toLowerCase());

        if (a > b) return 1;
        if (a < b) return -1;

        return 0;
    });
}

export function compare(first: string, second: string) {
    first = first.replace(/\s+/g, '');
    second = second.replace(/\s+/g, '');

    if (first === second) return 1;
    if ((!first.length || !second.length) || (first.length < 2 || second.length < 2)) return 0;

    const compared = new Map();

    for (let i = 0; i < first.length - 1; i++) {
        const compare = first.substring(i, i + 2);
        let num = 0;
        if (compared.has(compare)) num = compared.get(compare);
        compared.set(compare, num + 1);
    }

    let size = 0;

    for (let i = 0; i < second.length - 1; i++) {
        const compare = second.substring(i, i + 2);
        const count = compared.get(compare) ?? 0;

        if (count > 0) {
            compared.set(compare, count - 1);
            size++;
        }
    }

    return (2.0 * size) / (first.length + second.length - 2);
}

export function closest(target: string, arr: string[]) {
    const compared = [];
    let match = 0;

    for (const str of arr) {
        const rating = compare(target, str);
        compared.push({ str, rating });
        if (rating > compared[match].rating) match = arr.indexOf(str);
    }

    return compared[match].str;
}

export async function paste(text: string, format = 'js', url = 'https://starb.in', raw = false) {
    if (!text) throw new Error('No text provided');

    const { body } = await request
            .post(`${url}/documents`)
            .set('Content-Type', 'text/plain')
            .send(text);

    return `${url}/${raw ? 'raw/' : ''}${body.key as string}.${format}`;
}

export async function pastee(contents: string, title = 'Paste', lang = 'autodetect', raw = false) {
    if (!contents || !title) throw new Error('No text or title provided.');

    const { body } = await request
            .post('https://api.paste.ee/v1/pastes')
            .set({
                'X-Auth-Token': process.env.PASTE_KEY,
                'Content-Type': 'application/json'
            })
            .send({ sections: [{ name: title, syntax: lang, contents }] });

    if (!body.success) throw new Error(body.errors[0].message);

    return raw ? body.link.replace('/p/', '/r/') : body.link;
}

export function randomResponse(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export async function dadJoke() {
    const { text } = await request
            .get('https://icanhazdadjoke.com/')
            .set('Accept', 'text/plain');

    return text;
}

export async function google(query: string, safe = false): Promise<Record<string, any> | null> {
    const { body } = await request
            .get('https://www.googleapis.com/customsearch/v1')
            .query({
                key: process.env.GOOGLE_SEARCH_KEY,
                cx: process.env.GOOGLE_ENGINE_KEY,
                safe: safe ? 'active' : 'off',
                q: query
            });

    if (body.queries.request[0].totalResults === 0 || !body.items) return null;

    return body;
}

export async function youtube(params: Record<string, any>, mode = 'search'): Promise<Record<string, any> | null> {
    params.key = process.env.GOOGLE_SEARCH_KEY;

    const { body } = await request
            .get(`https://www.googleapis.com/youtube/v3/${mode}`)
            .query(params);

    if (body.pageInfo.totalResults === 0 || !body.items?.length) return null;

    return body.items[0];
}

interface DictionaryBase {
    word: string;
}

export interface Definition extends DictionaryBase {
    type: string;
    definitions: string[];
    date: string;
}

export interface Synonyms extends DictionaryBase {
    synonyms: string[];
}

export async function define(word: string, synonym = false): Promise<Definition | Synonyms | null> {
    if (!word?.length) throw new Error('No query provided');
    const url = `https://www.dictionaryapi.com/api/v3/references/${synonym ? 'thesaurus' : 'collegiate'}/json/${encodeURIComponent(word)}`;

    const { body } = await request
        .get(url)
        .query('key', process.env[`${synonym ? 'THESAURUS' : 'DICTIONARY'}_KEY`]);

    if (!body.length) return null;
    const result = body[0];
    if (typeof result[0] === 'string') return body.slice(0, 3);

    if (synonym) {
        const found = body[0].meta;
        return {
            word: found.stems?.[0],
            synonyms: found?.syns?.flat(3)
        };
    }

    return {
        word: result.meta.stems[0],
        type: result.fl,
        definitions: result.shortdef,
        date: result.date?.replace(/\{(.*?)\}/gi, '')
    };
}