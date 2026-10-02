const fs = require('fs');

// Read the SQL file
let content = fs.readFileSync('./external_references.sql', 'utf8');

// Add quotes and ::uuid cast to all UUIDs
content = content.replace(/([a-f0-9-]{36})/g, "'$1'::uuid");

// But fix double replacements (don't replace inside quotes already)
// Reset and do it properly
content = fs.readFileSync('./external_references.sql', 'utf8');

// Replace UUIDs that are NOT already quoted with ::uuid
content = content.replace(/(\n\s+)([a-f0-9-]{36})(,)/g, '$1$2::uuid$3');

// Write back
fs.writeFileSync('./external_references.sql', content);
console.log('Added ::uuid cast to UUIDs in external_references.sql');
