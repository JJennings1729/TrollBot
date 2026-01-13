const g = require('google-spreadsheet');
const j = require('google-auth-library');
require('dotenv').config();

let safety = {           
  playing_game : false,
  chosen_word  : "", 
  revealed     : "", 
  chances_left : 7,
  guessed      : "abcdefghijklmnopqrstuvwxyz",
  activate     : "trollbot",
  scores       : []
};

const serviceAccountAuth = new j.JWT({
  email: process.env.DEV_EMAIL,
  key: process.env.DEV_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function manage(task, new_state = null) {
  const doc = new g.GoogleSpreadsheet(process.env.SHEET_URL, serviceAccountAuth);

  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  switch (task) {

    case "get": {
      try {
        await sheet.loadCells('B2:B8');

        const state = {
          playing_game : sheet.getCell(1, 1).value === true,
          chosen_word  : sheet.getCell(2, 1).value || "",
          revealed     : sheet.getCell(3, 1).value || "",
          chances_left : Number(sheet.getCell(4, 1).value) || 0,
          guessed      : sheet.getCell(5, 1).value || "",
          activate     : sheet.getCell(6, 1).value || "",
          scores       : parseScores(sheet.getCell(7, 1).value || "")
        };

        safety = state;
        return state;

      } catch (error) {
        console.log("Error in spreadsheet; using safety");
        return safety;
      }
    }

    case "update": {
      try {
        await sheet.loadCells('B2:B8');

        sheet.getCell(1, 1).value = new_state.playing_game;
        sheet.getCell(2, 1).value = new_state.chosen_word;
        sheet.getCell(3, 1).value = new_state.revealed;
        sheet.getCell(4, 1).value = new_state.chances_left;
        sheet.getCell(5, 1).value = new_state.guessed;
        sheet.getCell(6, 1).value = new_state.activate;
        sheet.getCell(7, 1).value = stringifyScores(new_state.scores);

        await sheet.saveUpdatedCells();

      } catch (error) {
        console.log("Error in spreadsheet");
        throw error;
      }
    }
  }
}

exports.manage = manage;