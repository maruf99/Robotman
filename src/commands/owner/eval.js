const { Command } = require('discord-akairo');
const { inspect } = require('util');
const util = require('../../util');

const parse = obj => JSON.parse(JSON.stringify(obj));

module.exports = class extends Command {
    constructor() {
        super('eval', {
            aliases: ['eval', 'async'],
            description: {
                info: 'Evaluates code.',
                usage: '<code>'
            },
            ownerOnly: true,
            args: [
                {
                    id: 'depth',
                    type: 'integer',
                    match: 'option',
                    flag: ['--inspect=', '-inspect=', '--depth='],
                    default: 0
                },
                {
                    id: 'code',
                    type: 'string',
                    match: 'rest',
                    prompt: {
                        start: 'What code would you like to evaluate?'
                    }
                }
            ]
        });
    }

    lastInput = null;
    lastResult = null;

    async exec(message, { code, depth }) {
        /* eslint-disable no-unused-vars */
        const { lastInput, lastResult, client } = this;
        const { interactionHandler } = client;
        /* eslint-enable no-unused-vars */

        code = code
            .replace(/^\s*```(js|javascript)?/, '')
            .replace(/```$/, '');

        if (/while\s*\(\s*true\s*\)\s*/gi.test(code)) return message.util.send('No.');

        const msg = await message.util.send('Evaluating...');

        const input = code.length > 950 ? `Too Long to Display (${code.length} chars)` : util.beautify(code);

        let str = `**Input**\n\`\`\`js\n${this.clean(input)}\`\`\``;
        const maxLength = 2000 - input.length;

        const start = process.hrtime();
        let executionTime;

        try {
            const oldInput = code;
            
            code = code.replaceAll(/(\S*\.)?(client|config).token$/gi, 'util.randomToken()');
            code = /(await|async)/g.test(code) || message.util.parsed.alias === 'async' ? `(async () => {${code}})();` : code;

            let evaled = eval(code);

            executionTime = (process.hrtime(start)[1] / 1000000).toFixed(3);
            
            if (evaled instanceof Promise) evaled = await evaled;
            const type = evaled?.constructor?.name ? evaled?.constructor?.name : (evaled?.constructor ? Object.getPrototypeOf(evaled.constructor).name : null);

            if (evaled instanceof Object && typeof evaled !== 'function') evaled = inspect(evaled, { depth });

            if (evaled === null) evaled = 'null';
            if (evaled === undefined) evaled = 'undefined';

            if (typeof evaled === 'string' && !evaled.length) evaled = '\u200b';

            evaled = util.redact(this.clean(
                evaled.toString?.() ?? inspect(parse(evaled))
                ));

            this.lastInput = oldInput;
            this.lastResult = evaled;

            if (evaled.length > maxLength) evaled = `Too long to display (${evaled.length} chars). Output was uploaded to hastebin: ${await util.paste(evaled)}\n`;
            else evaled = `\`\`\`js\n${evaled}\`\`\``;

            str += `\n**Output${type ? ` <${type}>` : ''}**\n${evaled}`;
        } catch (e) {
            executionTime = (process.hrtime(start)[1] / 1000000).toFixed(3);

            e = util.redact(this.clean(e.toString()), this.client);
            if (e.length > maxLength) e = `Too long to display (${e.length} chars). Error was uploaded to hastebin: ${await util.paste(e, 'js')}\n`;
            else e = `\`\`\`js\n${e}\`\`\``;

            str += `\n**Error**\n${e}`;
        }

        str += `\nExecuted in ${executionTime}ms`;

        return msg.edit(str);
    }

    clean(str) {
        return str.replace(/`/g, '`' + String.fromCharCode(8203));
    }
};