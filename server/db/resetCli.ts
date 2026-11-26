import { getDb, closeDb } from './database.js';
import { resetDemoData } from './seed.js';

const db = getDb();
resetDemoData(db);
console.log('CARE BRIDGE demo database reset and seeded successfully.');
closeDb();
