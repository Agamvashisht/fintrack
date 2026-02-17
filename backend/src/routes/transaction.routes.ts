import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getMonthlySummary,
  getCategoryBreakdown,
  getWeeklySummary,
  getRolling3MonthAverage,
} from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  monthlySummarySchema,
  weeklySummarySchema,
} from '../validators/schemas';

const router = Router();

router.use(authenticate);

// Summary endpoints
router.get('/summary/monthly', validate(monthlySummarySchema), getMonthlySummary);
router.get('/summary/weekly', validate(weeklySummarySchema), getWeeklySummary);
router.get('/summary/category-breakdown', getCategoryBreakdown);
router.get('/summary/rolling-average', getRolling3MonthAverage);

// CRUD endpoints
router.get('/', validate(transactionQuerySchema), getTransactions);
router.post('/', validate(createTransactionSchema), createTransaction);
router.get('/:id', getTransactionById);
router.put('/:id', validate(updateTransactionSchema), updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
