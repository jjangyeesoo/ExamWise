import db from './src/config/db.js';

db.serialize(() => {
    // Attempt to alter the table to add the 'number' column.
    db.run("ALTER TABLE questions ADD COLUMN number INTEGER", (err) => {
        if (err) {
            if (err.message.includes('duplicate column name')) {
                console.log("Column 'number' already exists.");
            } else {
                console.error("Error altering table:", err.message);
            }
        } else {
            console.log("Column 'number' added successfully.");
        }
    });
});
