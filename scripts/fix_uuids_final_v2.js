const fs = require('fs');

// Read the SQL file
let content = fs.readFileSync('./external_references.sql', 'utf8');

// Replace UUIDs with proper format: 'uuid-string'::uuid
content = content.replace(/(\n\s+)([a-f0-9-]{36})(::uuid,)/g, "$1'$2'$3");

// Write back
fs.writeFileSync('./external_references.sql', content);
console.log('Added quotes to UUIDs in external_references.sql');
