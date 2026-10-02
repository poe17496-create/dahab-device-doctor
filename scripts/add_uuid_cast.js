const fs = require('fs');

// Read the SQL file
let content = fs.readFileSync('./external_references.sql', 'utf8');

// Add ::uuid cast to all UUIDs in the first column
content = content.replace(/(\n\s+[a-f0-9-]{36},)/g, '\n  $1::uuid,');

// Write back
fs.writeFileSync('./external_references.sql', content);
console.log('Added ::uuid cast to UUIDs in external_references.sql');
