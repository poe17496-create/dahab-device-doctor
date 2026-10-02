const fs = require('fs');
const crypto = require('crypto');

function generateUUID() {
  return crypto.randomUUID();
}

// Read the original SQL file
const sqlContent = fs.readFileSync('./external_references.sql', 'utf8');

// Replace all UUID placeholders with actual UUIDs
let newContent = sqlContent;
const uuidPlaceholders = sqlContent.match(/md5\(random\(\)::text \|\| clock_timestamp\(\)::text\)::uuid/g);

if (uuidPlaceholders) {
  uuidPlaceholders.forEach(() => {
    const uuid = generateUUID();
    newContent = newContent.replace('md5(random()::text || clock_timestamp()::text)::uuid', `'${uuid}'`);
  });
}

// Write the new SQL file
fs.writeFileSync('./external_references_fixed.sql', newContent);
console.log('Generated external_references_fixed.sql with actual UUIDs');
console.log(`Replaced ${uuidPlaceholders?.length || 0} UUID placeholders`);
