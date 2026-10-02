const fs = require('fs');
const crypto = require('crypto');

// Read the original SQL file with UUID placeholders
const content = fs.readFileSync('./external_references.sql', 'utf8');

// Generate a new SQL file with proper UUID format
const lines = content.split('\n');
const newLines = [];

for (let line of lines) {
  // Check if line contains a UUID string
  const uuidMatch = line.match(/'([a-f0-9-]{36})'/);
  if (uuidMatch) {
    // Replace with UUID without quotes
    line = line.replace(/'([a-f0-9-]{36})'/, uuidMatch[1]);
  }
  newLines.push(line);
}

fs.writeFileSync('./external_references_fixed.sql', newLines.join('\n'));
console.log('Generated external_references_fixed.sql');
console.log('UUIDs are now without quotes');
