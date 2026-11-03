const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const search = `  // Admin Verify Host Endpoint`;
if (content.includes(search)) {
    console.log("Admin Verify Host Endpoint already exists");
} else {
    console.log("Admin Verify Host Endpoint does not exist");
}
