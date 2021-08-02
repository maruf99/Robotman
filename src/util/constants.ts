import { oneLine } from 'common-tags';
import type { MessageButtonStyleResolvable, Snowflake, User } from 'discord.js';
import Colors from './json/colors.json';
import Pokemon from './json/pokemon.json';
import Timezones from './json/timezones.json';
import Words from './json/words.json';
import publishers from './json/publishers.json';

export { Colors, Pokemon, Timezones, Words };

export const Akinator = {
	MAX_TIME: 60000,
	IMAGES: {
		END: 'https://i.imgur.com/m3nIXvs.png',
		RANDOM: ['https://i.imgur.com/2xGxFEr.png', 'https://i.imgur.com/8P54YME.png']
	},
	replace: {
		's/724826__99926454.jpg': 'tttQgxw.jpg',
		'o/790322__776944019.jpg': 'jCb7p4V.png'
	},
	RESPONSES: {
		KEEP_GOING: 'Hmmm, Should I keep going then?',
		WIN: [
			"Great! I've guessed right once again!",
			'Great! I have won once again!',
			'Nice, guessed right one more time!',
			"Yes! I'm victorious once again!",
			"Looks like I've won!"
		],
		LOSS: [
			"Seems that I've been beaten. Till next time!",
			'Bravo, you have defeated me!',
			"Damn, you're good. Till next time!",
			"Darn, looks like I've been beaten!",
			"I've lost! You truly are a worthy opponent. Till next time!"
		],
		TIMEOUT: ["Silence. Looks like I've won!", "Time's up! Seems like I've won!"]
	}
};

export const ALIAS_REPLACEMENT_REGEX = /-/g;

export const Channels = {
	RECOMMENDATION: ['538424492544884738', '248985053441294337', '763091344590897182'],
	NEWS: {
		COMICS: '768918224170647566',
		TV_MOVIES: '625755932663480320'
	}
} as {
	RECOMMENDATION: Snowflake[];
	NEWS: Record<string, Snowflake>;
};

export const ConnectFour = {
	PIECES: {
		default: '<:blank:769981408990068836>',
		yellow: '<:yellow:769980715697700874>',
		red: '<:red:769980739361570836>'
	},
	NUMBERS: [
		'<:c1:771557387944722462>',
		'<:c2:771557387907104779>',
		'<:c3:771557387798577183>',
		'<:c4:771557387634606091>',
		'<:c5:771557388108955679>',
		'<:c6:771557388057706538>',
		'<:c7:771557387814567939>'
	],
	INDICATORS: {
		RED: '🔴',
		YELLOW: '🟡'
	},
	CANCEL_TIME: 15,
	WAIT_TIME: 1
};

export const DateFormats = {
	LOG: "MMMM d yyyy, 'at' tt",
	UPTIME: "d'd', h'h', m'm', s's'",
	LOCG: 'y-MM-dd',
	DAY: 'EEEE',
	CLOCK: "h':'mm a",
	REGULAR: "MMMM d',' y",
	DAYS: 'd',
	TEMPLATE: 'MMMM d'
};

export const Emojis = {
	SUCCESS: `✅`,
	FAIL: '❌',
	DELETE: '🗑️',
	TIMER: '<a:Timer:654794151841366058>',
	LOADING: '<a:slashloading:869272562272714763>'
};

export const Hangman = {
	WAIT_TIME: 60000,
	EMOJIS: {
		HEAD: '😐',
		SHIRT: '👕',
		LEFT_HAND: '🤚',
		RIGHT_HAND: '🖐️',
		PANTS: '🩳',
		SHOE: '👞'
	}
};

export const Links = {
	BULBAPEDIA: 'https://bulbapedia.bulbagarden.net',
	LETTERBOXD: 'https://letterboxd.com',
	HASTEBIN: 'https://starb.in',
	PASTE_EE: 'https://api.paste.ee/v1/pastes',
	GOOGLE: 'https://www.googleapis.com',
	MERIAM_WEBSTER: 'https://www.merriam-webster.com',
	DICTIONARY: 'https://www.dictionaryapi.com/api/v3/references',
	DAD_JOKE: 'https://icanhazdadjoke.com/',
	DISCORD: 'https://discord.com',
	IMGUR: 'https://api.imgur.com',
	REDDIT: 'https://www.reddit.com',
	COMICVINE: 'https://comicvine.gamespot.com',
	TV_MAZE: 'https://api.tvmaze.com',
	WIKIPEDIA: 'https://en.wikipedia.org'
} as const;

export const LogTypes = {
	log: {
		name: 'green',
		title: 'Log',
		color: 56374
	},
	error: {
		name: 'red',
		title: 'Error',
		color: 14429952
	},
	info: {
		name: 'blue',
		title: 'Info',
		color: 26844
	},
	warn: {
		name: 'yellow',
		title: 'Warning',
		color: 14458880
	}
} as const;

export const NO_RESULTS_FOUND = { content: 'No results found', ephemeral: true };

export const PRODUCTION = process.env.NODE_ENV === 'production';

export const PromptOptions = {
	MAX_RETRIES: 3,
	TIME: 30000,
	TEXT: {
		START: (text: string) => `${text}\n\nTo cancel the command, type \`cancel\`.`,
		RETRY: (text: string) => `Please try again. ${text}\n\nTo cancel the command, type \`cancel\`.`,
		TIMEOUT: 'You took too long to respond. The command has been cancelled.',
		FAIL: "You've retried too many times. The command has been cancelled.",
		CANCEL: 'Cancelled the command.'
	},
	ERRORS: {
		RETRY_LIMIT: 'retries',
		TIMEOUT: 'timeout',
		INCORRECT_TYPE: 'type',
		CANCELLED: 'cancel'
	}
} as const;

export type Publisher =
	| 'dc'
	| 'marvel'
	| 'image'
	| 'darkhorse'
	| 'idw'
	| 'boom'
	| 'valiant'
	| 'archie'
	| 'dynamite'
	| 'vault'
	| 'milestone'
	| 'aftershock'
	| 'zenescope'
	| 'ahoy';

export interface PublisherData {
	id: number;
	name: string;
	color: number;
	thumbnail: string;
}

export const Publishers = new Map(Object.entries(publishers as Record<Publisher, PublisherData>));

export const Pull = {
	DEFAULT: {
		PREVIOUS: ['pull-last', 'pl', 'plast'],
		NEXT: ['pull-next', 'pn', 'pnext']
	},
	USER: {
		PREVIOUS: ['pull-last-user', 'plu', 'plastuser', 'pluser'],
		NEXT: ['pull-next-user', 'pnu', 'pnextuser', 'pnuser']
	}
};

export const ScheduleTime = {
	DAY: 0,
	HOUR: 1,
	MINUTE: 0
};

export const Shows = new Set([
	13, // The Flash
	689, // Young Justice
	706, // Teen Titans Go!
	1850, // Supergirl
	1851, // Legends of Tomorrow
	1859, // Lucifer
	20683, // Black Lightning
	27557, // Titans
	36745, // Doom Patrol
	36774, // Pennyworth
	37776, // Batwoman
	37809, // Stargirl
	39764, // Sweet Tooth
	42668, // Y: The Last Man
	42827, // The Sandman
	44751, // Superman and Lois
	44776, // Green Lantern
	44777, // Strange Adventures
	47261, // Justice League Dark
	51042 // Batwheels
]);

export const Recommendations = {
	TEXT: {
		LIST: oneLine`
        Welcome to **Taste Test**, where you can sample our mods' and boosters' 
        personal recommendations and personal taste! Feel free to engage us on a discussion, 
        and please, have fun discovering what we love.`,
		MOD: oneLine`
        Welcome to **Taste Test**, where you can sample our mods' personal 
        recommendations and personal taste! Feel free to engage us on a discussion, 
        and please, have fun discovering what we love.`,
		BOOSTER: oneLine`
        Welcome to a special **Taste Test**, where you can sample our **Boosters'** personal 
        recommendations and personal taste! Feel free to engage us on a discussion, and please, 
        have fun discovering what we love.`
	},
	REGEX: {
		TASTE_TEST: /^taste test$/i,
		WRITERS: /^writers? rec(ommendation)?s$/i
	}
} as const;

export const TicTacToe = {
	EMOJIS: {
		O: '⭕',
		X: '❌'
	},
	STYLES: {
		O: 'SUCCESS',
		X: 'DANGER'
	},
	MESSAGES: {
		match: (player1, player2) => `**${player1.tag}** vs. **${player2.tag}**`,
		turn: (player1, player2, current) => `${TicTacToe.MESSAGES.match(player1, player2)}\n\n${current.username}'s turn. You have 20 seconds.`,
		forfeit: (loser, winner) =>
			`${TicTacToe.MESSAGES.match(winner, loser)}\n\n**${loser.username}** has failed to make a move. **${winner.username}** wins!`,
		draw: (player1, player2) => `${TicTacToe.MESSAGES.match(player1, player2)}\n\nThe game is a draw!`,
		win: (winner, loser) => `${TicTacToe.MESSAGES.match(winner, loser)}\n\n**${winner.username}** wins!`
	}
} as {
	EMOJIS: Record<string, string>;
	STYLES: Record<string, MessageButtonStyleResolvable>;
	MESSAGES: Record<string, (player1?: User, player2?: User, current?: User) => string>;
};

export const Trivia = {
	CATEGORIES: {
		dccomics: 'DC Comics',
		marvelcomics: 'Marvel Comics',
		dctv: 'DC Television'
	},
	DEFAULT_AMOUNT: 30,
	MAX_UNANSWERED: 15,
	MAX_TIME: 20000
};