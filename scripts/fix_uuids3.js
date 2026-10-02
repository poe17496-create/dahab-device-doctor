const fs = require('fs');

// Read the SQL file
let content = fs.readFileSync('./external_references.sql', 'utf8');

// Replace UUID strings with proper PostgreSQL format (no quotes, with ::uuid cast)
content = content.replace(/'([a-f0-9-]{36})'/g, '$1::uuid');

// Write back
fs.writeFileSync('./external_references.sql', content);
console.log('Fixed UUID format in external_references.sql');
