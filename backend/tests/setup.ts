import 'dotenv/config';

// Override env for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';

export default async function setup(): Promise<void> {
  console.log('\n🧪 Setting up test environment...');
}
