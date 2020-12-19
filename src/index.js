const Robotman = require('./structures/Client');
const client = new Robotman({
    restTimeOffset: 250,
    messageCacheMaxSize: 150,
    messageEditHistoryMaxSize: 0,
    allowedMentions: {
        parse: ['users'], 
        repliedUser: true
    },
    ws: {
        intents: [
            'GUILDS', 
            'GUILD_MEMBERS', 
            'GUILD_BANS', 
            'GUILD_WEBHOOKS', 
            'GUILD_MESSAGES',
            'GUILD_MESSAGE_REACTIONS'
        ]
    }
});

process.on('unhandledRejection', e => client.log(`Unhandled Promise Rejection: ${e.stack}`, 'error', { ping: true }));

client.init();