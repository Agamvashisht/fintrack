import { PrismaClient, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany({ where: { email: 'demo@fintrack.dev' } });

  // Create demo user
  const hashedPassword = await bcrypt.hash('Demo123456', 12);
  const user = await prisma.user.create({
    data: {
      email: 'demo@fintrack.dev',
      password: hashedPassword,
      name: 'Alex Demo',
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create categories
  const categoryData = [
    { name: 'Salary', icon: '💼', color: '#22c55e' },
    { name: 'Freelance', icon: '💻', color: '#3b82f6' },
    { name: 'Investments', icon: '📈', color: '#8b5cf6' },
    { name: 'Food & Dining', icon: '🍽️', color: '#f97316' },
    { name: 'Transportation', icon: '🚗', color: '#06b6d4' },
    { name: 'Housing', icon: '🏠', color: '#ec4899' },
    { name: 'Entertainment', icon: '🎬', color: '#f59e0b' },
    { name: 'Healthcare', icon: '⚕️', color: '#ef4444' },
    { name: 'Shopping', icon: '🛍️', color: '#a855f7' },
    { name: 'Utilities', icon: '⚡', color: '#6b7280' },
  ];

  const categories = await Promise.all(
    categoryData.map((cat) =>
      prisma.category.create({ data: { ...cat, userId: user.id } }),
    ),
  );

  console.log(`✅ Created ${categories.length} categories`);

  // Create sample transactions for last 3 months
  const txData: {
    amount: number;
    type: TransactionType;
    description: string;
    daysAgo: number;
    categoryIndex: number;
  }[] = [
    { amount: 5000, type: 'INCOME', description: 'Monthly salary', daysAgo: 0, categoryIndex: 0 },
    { amount: 5000, type: 'INCOME', description: 'Monthly salary', daysAgo: 31, categoryIndex: 0 },
    { amount: 5000, type: 'INCOME', description: 'Monthly salary', daysAgo: 62, categoryIndex: 0 },
    { amount: 1200, type: 'INCOME', description: 'Freelance project - Website redesign', daysAgo: 5, categoryIndex: 1 },
    { amount: 800, type: 'INCOME', description: 'Freelance project - API integration', daysAgo: 40, categoryIndex: 1 },
    { amount: 250, type: 'INCOME', description: 'Dividend payment', daysAgo: 15, categoryIndex: 2 },
    { amount: 1200, type: 'EXPENSE', description: 'Monthly rent', daysAgo: 1, categoryIndex: 5 },
    { amount: 1200, type: 'EXPENSE', description: 'Monthly rent', daysAgo: 32, categoryIndex: 5 },
    { amount: 1200, type: 'EXPENSE', description: 'Monthly rent', daysAgo: 63, categoryIndex: 5 },
    { amount: 85, type: 'EXPENSE', description: 'Grocery run - Whole Foods', daysAgo: 2, categoryIndex: 3 },
    { amount: 42, type: 'EXPENSE', description: 'Pizza night', daysAgo: 4, categoryIndex: 3 },
    { amount: 120, type: 'EXPENSE', description: 'Weekly groceries', daysAgo: 9, categoryIndex: 3 },
    { amount: 35, type: 'EXPENSE', description: 'Sushi lunch', daysAgo: 12, categoryIndex: 3 },
    { amount: 95, type: 'EXPENSE', description: 'Grocery shopping', daysAgo: 16, categoryIndex: 3 },
    { amount: 60, type: 'EXPENSE', description: 'Monthly metro pass', daysAgo: 1, categoryIndex: 4 },
    { amount: 25, type: 'EXPENSE', description: 'Uber ride', daysAgo: 3, categoryIndex: 4 },
    { amount: 45, type: 'EXPENSE', description: 'Gas refill', daysAgo: 8, categoryIndex: 4 },
    { amount: 15, type: 'EXPENSE', description: 'Movie tickets', daysAgo: 5, categoryIndex: 6 },
    { amount: 45, type: 'EXPENSE', description: 'Netflix + Spotify subscriptions', daysAgo: 10, categoryIndex: 6 },
    { amount: 80, type: 'EXPENSE', description: 'Concert tickets', daysAgo: 20, categoryIndex: 6 },
    { amount: 150, type: 'EXPENSE', description: 'Electricity bill', daysAgo: 5, categoryIndex: 9 },
    { amount: 85, type: 'EXPENSE', description: 'Internet bill', daysAgo: 8, categoryIndex: 9 },
    { amount: 200, type: 'EXPENSE', description: 'Doctor visit', daysAgo: 15, categoryIndex: 7 },
    { amount: 320, type: 'EXPENSE', description: 'New shoes and jeans', daysAgo: 7, categoryIndex: 8 },
  ];

  await Promise.all(
    txData.map((tx) => {
      const date = new Date();
      date.setDate(date.getDate() - tx.daysAgo);
      return prisma.transaction.create({
        data: {
          amount: tx.amount,
          type: tx.type,
          description: tx.description,
          date,
          userId: user.id,
          categoryId: categories[tx.categoryIndex].id,
        },
      });
    }),
  );

  console.log(`✅ Created ${txData.length} transactions`);

  // Create budgets for current month
  const now = new Date();
  const budgetData = [
    { categoryIndex: 3, amount: 500 },
    { categoryIndex: 4, amount: 200 },
    { categoryIndex: 5, amount: 1300 },
    { categoryIndex: 6, amount: 150 },
    { categoryIndex: 7, amount: 300 },
    { categoryIndex: 8, amount: 200 },
    { categoryIndex: 9, amount: 250 },
  ];

  await Promise.all(
    budgetData.map((b) =>
      prisma.budget.create({
        data: {
          amount: b.amount,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          userId: user.id,
          categoryId: categories[b.categoryIndex].id,
        },
      }),
    ),
  );

  console.log(`✅ Created ${budgetData.length} budgets`);
  console.log('\n🎉 Seeding complete!');
  console.log('   Demo login: demo@fintrack.dev / Demo123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
