const fs  = require('fs');
const csv = require('csv-parser');
const get_state = require('./get_state.js').manage;
const activate = "shit";

const hang_images = [
    'https://i.groupme.com/237x327.png.de80008f463a4069b6705116567d7c3e.large',
    'https://i.groupme.com/226x322.png.030bee74c5354789bc1a928706f0ce46.large',
    'https://i.groupme.com/231x323.png.36679e99f3f2415e9c42c0c124092994.large',
    'https://i.groupme.com/242x312.png.3e148fdc68cd4faa9b9dd105f5f2fa45.large',
    'https://i.groupme.com/245x322.png.f4375227a4ea4c25ad63d27490d3494c.large',
    'https://i.groupme.com/248x325.png.bddb763bc79346f4ab637b739836704f.large',
    'https://i.groupme.com/241x345.png.3746e285191c49d793542533c3625a35.large'
]


async function response (request) {

    var input = request.text.toLowerCase();
    const state = await get_state("get");

    var answer = true;
    var text = "";
    var attach_url = "";

    function select_word (){
        var index = Math.round(Math.random() * 38894);
        var chosen_word = "Word not yet chosen";
        return new Promise ((resolve) => {
            const stream = fs.createReadStream('./Dictionary.csv')
            .pipe(csv({ skipLines : index }))
            .on('data', (row) => {
                chosen_word = Object.keys(row)[0].trim();
                stream.destroy();
                resolve(chosen_word);
            });
        });
    }

    function get_scores (UserID="", UserName=""){
        var new_player = Boolean(UserID);
        var record = "\r\nCurrent Scores:\r\n";
        for (let i = 0; i < state.scores.length; i++){
            if (state.scores[i]['user_id'] == UserID){
                new_player = false;
                state.scores[i]['name'] = UserName;
                state.scores[i]['score']++;
            }
            record += state.scores[i]['name'] + " : " + state.scores[i]['score'].toString() + "\r\n";
        }
        if (new_player){
            state.scores.push({ 'user_id' : UserID, 'name' : UserName, 'score' : 1 })
            record += UserName + " : 1";
        }
        
        return record;
    }

    if (request.sender_type == 'bot'){
        console.log("Bot detected")
        answer = false;
    } else if (state.playing_game == false){
        if (input.includes(activate)){
            if (input.includes("scores")){
                text = get_scores();
            } else {
            
                state.chosen_word = await select_word();
                state.revealed = "-".repeat(state.chosen_word.length);
                state.chances_left = 7;
                state.guessed = "abcdefghijklmnopqrstuvwxyz";
                state.playing_game = true;
                text = "I'm thinking of a word. Guess a letter: \r\n" + state.revealed;
            }

        } else {
            console.log("Didn't say the magic word!")
            answer = false;
        }
    } else {
        if (input.length == 1){
            if (state.guessed.includes(input)){
                state.guessed = state.guessed.replace(input, "");
                if (state.chosen_word.includes(input)){
                    state.revealed = state.revealed.split('');
                    for (var i=0; i<state.chosen_word.length; i++) {
                        if (state.chosen_word[i] == input){
                            state.revealed[i] = input.toUpperCase();
                        }
                    }
                    state.revealed = state.revealed.join('');
                    text = state.revealed;
                    if (state.revealed.toLowerCase() == state.chosen_word){
                        text = "Correct! The word is " + state.revealed + "\r\n" + 
                            get_scores(request.user_id, request.name);
                        state.playing_game = false;
                    }
                } else {
                    text = "No " + input.toUpperCase() + "!    ";
                    attach_url = hang_images[7-state.chances_left];
                    state.chances_left -= 1;
                    if (state.chances_left == 0){
                        text += " Trollbot is victorious. The word is ";
                        text += state.chosen_word.toUpperCase();
                        text += get_scores();
                        state.playing_game = false;
                    } else {
                        text += state.revealed;
                    }
                }
            } else {
                text = input.toUpperCase() + " was already guessed! \r\n" + state.revealed;
            }
        } else if (input == state.chosen_word){
            text = "Correct! The word is " + state.chosen_word.toUpperCase() + 
                get_scores(request.user_id, request.name);
            state.playing_game = false;
        } else if (input.includes(activate)){
            text = "Still waiting, guess a letter \r\n" + state.revealed;
        } else {
            console.log("Not a letter!")
            answer = false;
        }
    }

    console.log(state);
    get_state("update", state);
    return {answer : answer, text : text, attach_url : attach_url};
}

exports.response = response;