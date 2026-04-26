const fs = require('fs');
const get_state = require('./get_state.js').manage;

const hang_images = [
    'https://i.groupme.com/237x327.png.21a0b07957684a9e913cb9773763fbc0.large',
    'https://i.groupme.com/226x322.png.f74f56acd27e484b93f2dcd4fe1716a2.large',
    'https://i.groupme.com/231x323.png.ed9580aa8d894893a6a817e031317744.large',
    'https://i.groupme.com/242x312.png.4c4311af2ed148cbb78ff8f5dfa0918a.large',
    'https://i.groupme.com/245x322.png.6a647e2cbd454cc78d968d46fabd2532.large',
    'https://i.groupme.com/248x325.png.77fe1daaf25b4d80a9271abe52f7695e.large',
    'https://i.groupme.com/241x345.png.6b72db440ea2455bae367e703dde11f6.large'
];

const DICTIONARY = fs
    .readFileSync('./Dictionary.csv', 'utf8')
    .split(/\r?\n/)
    .map(line => line.split(',')[0].trim().toLowerCase())
    .filter(Boolean);

const select_word = () =>
    DICTIONARY[Math.floor(Math.random() * DICTIONARY.length)];

const isLetter = input => /^[a-z]$/.test((input || '').trim());

const revealLetter = (state, letter) =>
    state.chosen_word
        .split('')
        .map((c, i) => (c === letter ? letter.toUpperCase() : state.revealed[i]))
        .join('');

function get_scores(state, UserID = "", UserName = "") {
    if (!Array.isArray(state.scores)) state.scores = [];

    if (UserID) {
        let player = state.scores.find(p => p.user_id === UserID);
        if (player) {
            player.name = UserName;
            player.score = (player.score || 0) + 1;
        } else {
            state.scores.push({ user_id: UserID, name: UserName, score: 1 });
        }
    }

    return "\r\nCurrent Scores:\r\n" +
        state.scores.map(p => `${p.name} : ${p.score}`).join("\r\n");
}

const getLastUnguessedLetter = (input, state) =>
    ((input || '')
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .split(/\s+/)
        .filter(c =>
            c.length === 1 &&
            !state.guessed.includes(c)
        )
        .reverse()
        .find(Boolean)) || null;


// Single function handling message
function handleLetter(letter, state, request) {
    if (!letter) return null;

    if (state.guessed.includes(letter)) {
        return `${letter.toUpperCase()} was already guessed!\n${state.revealed}`;
    }

    state.guessed += letter;

    const prefix = request.name === "The Old Troll"
        ? "Well done, master. "
        : "";

    // WRONG LETTER
    if (!state.chosen_word.includes(letter)) {
        state.chances_left--;

        const mistakes = hang_images.length - state.chances_left - 1;
        const attach_url = hang_images[mistakes] || hang_images.at(-1);

        if (state.chances_left <= 0) {
            state.playing_game = false;
            return {
                text: `${letter.toUpperCase()} is not in the word.\nTrollbot is victorious. The word was ${state.chosen_word.toUpperCase()}`,
                attach_url
            };
        }

        return {
            text: `${letter.toUpperCase()} is not in the word.\n${state.revealed}`,
            attach_url
        };
    }

    // CORRECT LETTER
    state.revealed = revealLetter(state, letter);

    if (!state.revealed.includes('-')) {
        state.playing_game = false;
        let updated_scores = get_scores(state, request.user_id, request.name);

        return `${prefix}The word is ${state.revealed}\n${updated_scores}`;
    }

    return `${prefix}${state.revealed}`;
}


async function response(request) {
    const input = (request.text || '').toLowerCase();
    const state = await get_state("get");

    if (request.name === "TrollBot") return false;

    // Scores
    if (input.includes("scores")) {
        return { answer: true, text: get_scores(state) };
    }

    // Start game
    if (!state.playing_game) {
        if (!input.includes(state.activate)) return false;

        state.chosen_word = select_word();
        state.revealed = "-".repeat(state.chosen_word.length);
        state.chances_left = hang_images.length;
        state.guessed = "";
        state.playing_game = true;

        await get_state("update", state);

        return {
            answer: true,
            text: `I'm thinking of a word. Guess a letter:\n${state.revealed}`
        };
    }

    // Full word guess
    if (new RegExp(`\\b${state.chosen_word}\\b`).test(input)) {
        const prefix = request.name === "The Old Troll"
            ? "Well done, master. "
            : "Correct! ";

        let updated_scores = get_scores(state, request.user_id, request.name);

        state.playing_game = false;
        await get_state("update", state);

        return {
            answer: true,
            text: `${prefix}The word is ${state.chosen_word.toUpperCase()}\n${updated_scores}`
        };
    }

    // Determine letter (AI OR normal user)
    let letter =
        request.name === "Copilot"
            ? getLastUnguessedLetter(input, state)
            : (isLetter(input) ? input.trim() : null);

    if (letter) {
        const result = handleLetter(letter, state, request);

        let text = "";
        let attach_url = "";

        if (typeof result === "string") {
            text = result;
        } else {
            text = result.text;
            attach_url = result.attach_url || "";
        }

        await get_state("update", state);
        return { answer: true, text, attach_url };
    }

    // Reminder
    if (input.includes(state.activate)) {
        await get_state("update", state);
        return {
            answer: true,
            text: `Still waiting... guess a letter:\n${state.revealed}`
        };
    }

    return false;
}

exports.response = response;