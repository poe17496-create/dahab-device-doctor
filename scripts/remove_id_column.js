const fs = require('fs');

// Read the SQL file
let content = fs.readFileSync('./external_references.sql', 'utf8');

// Remove id column from INSERT statement
content = content.replace(
  /INSERT INTO engineering_references \(id, title, description, reference_type, manufacturer, part_number, category, url, language, tags, source, reliability_score, is_official, metadata\) VALUES/,
  'INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, language, tags, source, reliability_score, is_official, metadata) VALUES'
);

// Remove UUID from each row
content = content.replace(/\(\s*'[a-f0-9-]{36}',/g, '(');

// Write back
fs.writeFileSync('./external_references.sql', content);
console.log('Removed id column from INSERT statement');
console.log('PostgreSQL will auto-generate UUIDs');
