const fs = require('fs');

// Read the SQL file
let content = fs.readFileSync('./external_references.sql', 'utf8');

// Remove quotes from UUIDs in the first column (id field)
content = content.replace(/\(\s*'([a-f0-9-]{36})',/g, '(\n  $1,');
content = content.replace(/\(\n\s*'([a-f0-9-]{36})',/g, '(\n  $1,');

// Write back
fs.writeFileSync('./external_references.sql', content);
console.log('Removed quotes from UUIDs in external_references.sql');
