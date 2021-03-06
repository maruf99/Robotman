import { Argument, Category, Command } from 'discord-akairo';
import { Message } from 'discord.js';
import { plural, title } from '../../util';

const INVALID = 'Invalid command or group';

export default class extends Command {
    public constructor() {
        super('help', {
            aliases: ['help', 'command', 'category', 'group'],
            description: 'Shows information on a command or category.',
            args: [
                {
                    id: 'mod',
                    type: Argument.union('commandAlias', 'commandCategory')
                }
            ]
        });
    }

    public data = {
        usage: '<command or category>'
    };

    public exec(message: Message, { mod }: { mod: Command | Category<string, Command> }) {
        const embed = this.client.util.embed();
        let disabled: string[] = [];
        let prefix = process.env.BOT_PREFIX;

        if (message instanceof Message) {
            disabled = this.client.settings.get(message.guild.id, 'disabled_commands', []) ?? [];
            prefix = this.client.util.getPrefix(message);
        }

        const hidden = (c: Command): boolean => !c.ownerOnly && !c.mod && !c.data?.disableHelp && !disabled.includes(c.id);

        if (!mod) {
            embed
                .setTitle('Commands')
                .setDescription(`Do \`${prefix}${message.util?.parsed?.command ?? this.id} ${this.data.usage}\` for more info on a command or category`)
                .setFooter(`Hover over a command for descriptions`);

            for (let category of this.handler.categories.values()) {
                category = category.filter(hidden);
                if (!category.size) continue;

                embed.addField(
                    title(category.first().categoryID.replace('-', ' & ')).replace('Tv', 'TV'),
                    category.map(c => `[\`${c.id}\`](https://notarealwebsi.te/ '${c.description}')`).join(' '),
                    true
                );
            }

            embed.inlineFields();
        } else if (mod instanceof Command) {
            if (mod.ownerOnly || mod.mod || mod.data?.disableHelp || disabled.includes(mod.id)) return message.util.send(INVALID);
            const desc = this.client.util.getExtended(mod, prefix);

            embed
                .setTitle(`${prefix}${mod.id} ${mod.data.usage || ''}`)
                .setDescription(desc)
                .setFooter(`Category: ${title(mod.categoryID)}${this.cooldown > 2e3 ? ` | This command has a ${this.cooldown / 1000} second cooldown.` : ''}`);

            if (mod.data.examples?.length) embed.addField(plural('Example', mod.data.examples.length), this.client.util.formatExamples(mod, prefix));
            if (mod.aliases.length > 1) embed.addField('Aliases', mod.aliases.filter(a => a !== mod.id).join(', '));

            if (mod.interactionOptions) {
                embed.addFields({
                    name: 'Slash Command',
                    value: `/${mod.interactionOptions.name} ${mod.interactionOptions.options
                        ?.map(o => {
                            let name = `[${o.name}]`;
                            if (o.required) name = `<${o.name}>`;
                            return `[${name}](https://notarealwebsi.te/ '${o.description}')`;
                        })
                        .join(' ') ?? ''}`
                });
            }
        } else {
            const filtered = mod.filter(hidden);
            if (!filtered.size) return message.util.send(INVALID);

            embed.setTitle(`${title(filtered.first().categoryID)} Commands`);

            for (const c of filtered.values()) {
                embed.addField(`${prefix}${c.id} ${c.data.usage ?? ''}`, c.description);
            }
        }

        return message.util.send({ embeds: [embed] });
    }
}