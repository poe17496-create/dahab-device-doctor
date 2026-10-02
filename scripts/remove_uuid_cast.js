const fs = require('fs');

// Read the SQL file
let content = fs.readFileSync('./external_references.sql', 'utf8');

// Remove ::uuid cast from all UUIDs
content = content.replace(/'([a-f0-9-]{36})'::uuid/g, "'$1'");

// Write back
fs.writeFileSync('./external_references.sql', content);
console.log('Removed ::uuid cast from UUIDs in external_references.sql');
