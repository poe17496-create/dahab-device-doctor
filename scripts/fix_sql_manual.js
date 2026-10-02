const fs = require('fs');

// Read the SQL file
let content = fs.readFileSync('./external_references.sql', 'utf8');

// Remove id column from INSERT statement
content = content.replace(
  /INSERT INTO engineering_references \(id, title, description, reference_type, manufacturer, part_number, category, url, language, tags, source, reliability_score, is_official, metadata\) VALUES/,
  'INSERT INTO engineering_references (title, description, reference_type, manufacturer, part_number, category, url, language, tags, source, reliability_score, is_official, metadata) VALUES'
);

// Remove the first UUID from each row (the id field)
// Pattern: newline, opening paren, optional spaces, UUID with quotes and ::uuid, comma
content = content.replace(/\(\s*'[^']+'::uuid,/g, '(');

// Write back
fs.writeFileSync('./external_references.sql', content);
console.log('Fixed SQL file manually');
