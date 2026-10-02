import { migrateAll } from '../src/lib/migrateData';

migrateAll()
  .then((results) => {
    console.log('Migration results:', JSON.stringify(results, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
