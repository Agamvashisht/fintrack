import cron from 'node-cron';
import { logger } from '../config/logger';
import prisma from '../config/database';
import { TransactionService } from '../services/transaction.service';
import { BudgetService } from '../services/budget.service';
import { AuthRepository } from '../repositories/auth.repository';

const txService = new TransactionService();
const budgetService = new BudgetService();
const authRepo = new AuthRepository();

// Weekly financial summary - runs every Monday at 8 AM
export const weeklyFinancialSummaryJob = cron.schedule(
  '0 8 * * 1',
  async () => {
    logger.info('[CronJob] Starting weekly financial summary job');
    try {
      const users = await prisma.user.findMany({ select: { id: true, email: true, name: true } });

      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      const endDate = now;

      for (const user of users) {
        const summary = await txService.getWeeklySummary(
          user.id,
          startDate.toISOString(),
          endDate.toISOString(),
        );

        const totalIncome = summary.reduce((acc, day) => acc + day.income, 0);
        const totalExpense = summary.reduce((acc, day) => acc + day.expense, 0);
        const netSavings = totalIncome - totalExpense;

        logger.info({
          message: '[CronJob] Weekly summary computed',
          userId: user.id,
          email: user.email,
          week: `${startDate.toDateString()} - ${endDate.toDateString()}`,
          totalIncome,
          totalExpense,
          netSavings,
        });
      }

      logger.info('[CronJob] Weekly financial summary job completed');
    } catch (error) {
      logger.error('[CronJob] Weekly financial summary job failed', { error });
    }
  },
  { scheduled: false, timezone: 'UTC' },
);

// Budget alert job - runs every day at 9 AM
export const budgetAlertJob = cron.schedule(
  '0 9 * * *',
  async () => {
    logger.info('[CronJob] Starting budget alert job');
    try {
      const users = await prisma.user.findMany({ select: { id: true, email: true } });

      for (const user of users) {
        const alerts = await budgetService.checkBudgetAlerts(user.id);

        if (alerts.length > 0) {
          logger.warn({
            message: '[CronJob] Budget alerts triggered',
            userId: user.id,
            email: user.email,
            alerts: alerts.map((a) => ({
              category: a.categoryName,
              usage: `${a.usagePercentage}%`,
              spent: a.spent,
              budget: a.budget,
            })),
          });
          // In production: send email notification here
        }
      }

      logger.info('[CronJob] Budget alert job completed');
    } catch (error) {
      logger.error('[CronJob] Budget alert job failed', { error });
    }
  },
  { scheduled: false, timezone: 'UTC' },
);

// Token cleanup job - runs every day at midnight
export const tokenCleanupJob = cron.schedule(
  '0 0 * * *',
  async () => {
    logger.info('[CronJob] Starting token cleanup job');
    try {
      const deleted = await authRepo.deleteExpiredTokens();
      logger.info(`[CronJob] Token cleanup: removed ${deleted} expired/revoked tokens`);
    } catch (error) {
      logger.error('[CronJob] Token cleanup job failed', { error });
    }
  },
  { scheduled: false, timezone: 'UTC' },
);

export const startAllJobs = (): void => {
  weeklyFinancialSummaryJob.start();
  budgetAlertJob.start();
  tokenCleanupJob.start();
  logger.info('⏰ Background jobs started: weeklyFinancialSummary, budgetAlert, tokenCleanup');
};

export const stopAllJobs = (): void => {
  weeklyFinancialSummaryJob.stop();
  budgetAlertJob.stop();
  tokenCleanupJob.stop();
  logger.info('⏰ Background jobs stopped');
};
