const g = require('google-spreadsheet');
const j = require('google-auth-library');
require('dotenv').config();

var safety = {           
    playing_game : false,
    chosen_word : "", 
    revealed: "", 
    chances_left : 7,
    guessed : "abcdefghijklmnopqrstuvwxyz",
    activate : "trollbot",
    scores : []
}

const serviceAccountAuth = new j.JWT({
  email: process.env.DEV_EMAIL,
  key: process.env.DEV_KEY,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function manage (task, new_state = null) {
    const doc = new g.GoogleSpreadsheet(process.env.SHEET_URL, serviceAccountAuth);
    switch (task){
        case "get":
            return new Promise (async (resolve) => {
                try {
                    await doc.loadInfo();
                    const sheet = doc.sheetsByIndex[0];
                    await sheet.loadCells('A1:A1');
                    const cell = sheet.getCell(0, 0);
                    const state = JSON.parse(cell.value);
                    safety = state;
                    resolve(state);
                } catch (error) {
                    console.log("Error in spreadsheet; using safety");
                    return safety;
                }
            });
        case "update":
            return new Promise (async (resolve, reject) => {
                const temp = JSON.stringify(new_state);
                try {
                    await doc.loadInfo();
                    const sheet = doc.sheetsByIndex[0];
                    await sheet.loadCells('A1:A1');
                    const state = sheet.getCell(0, 0);
                    state.value = temp;
                    await sheet.saveUpdatedCells();
                    resolve();
                } catch (error) {
                    console.log("Error in spreadsheet");
                    reject(error);
                }
            });
    }
}

exports.manage = manage;