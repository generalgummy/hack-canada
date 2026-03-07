// Script to delete all users from the database
// Run with: mongosh -f delete-users.js

db = db.getSiblingDB('northern-harvest');

try {
  const result = db.users.deleteMany({});
  console.log(`✅ Deleted ${result.deletedCount} users from the database`);
} catch (error) {
  console.error('❌ Error deleting users:', error);
}
