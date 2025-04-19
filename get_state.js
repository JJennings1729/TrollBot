
// Get the current state from the database. See database at https://www.phpmyadmin.co/

var mysql = require('mysql');
require('dotenv').config();


var safety = {           // If database is not working, safety will be used. 
    playing_game : false,
    chosen_word : "", 
    revealed: "", 
    chances_left : 7,
    guessed : "abcdefghijklmnopqrstuvwxyz",
    scores : []
}

async function manage (task, new_state = null){  
    
    const con = mysql.createConnection({
        host: process.env.SQL_HOST, 
        port: 3306,
        user: process.env.SQL_USER,
        password: process.env.SQL_PASS,
        database: process.env.SQL_USER
    });

    switch (task){
        case "get":
            return new Promise ((resolve) => {
                con.connect(function(err) {
                    if (err) {
                        console.log("Database not working; safety state being used");
                        return safety;
                    }
                    var sql = "SELECT current FROM state";
                    con.query(sql, function (err, result) {
                        if (err) throw err;
                        var data = JSON.parse(result[0].current);
                        resolve(data);
                        con.end();
                    });
                });
            });

        case "update":
            safety = new_state;
            var temp_state = JSON.stringify(new_state);
            var sql = "UPDATE state SET current = (?)" 
            con.query(sql, [temp_state], function (err, result) {
                if (err) throw err;
                con.end();
            });
            break;
    }

}

exports.manage = manage;