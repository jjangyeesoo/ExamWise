import db from './src/config/db.js';

db.all("SELECT * FROM questions", [], (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log(JSON.stringify(rows, null, 2));
    }
    process.exit(0);
});
