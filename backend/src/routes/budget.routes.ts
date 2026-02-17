import { Router } from 'express';
import {
  createBudget,
  getBudgets,
  getBudgetById,
  updateBudget,
  deleteBudget,
} from '../controllers/budget.controller';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createBudgetSchema,
  updateBudgetSchema,
  createCategorySchema,
} from '../validators/schemas';

const budgetRouter = Router();
budgetRouter.use(authenticate);

budgetRouter.get('/', getBudgets);
budgetRouter.post('/', validate(createBudgetSchema), createBudget);
budgetRouter.get('/:id', getBudgetById);
budgetRouter.put('/:id', validate(updateBudgetSchema), updateBudget);
budgetRouter.delete('/:id', deleteBudget);

const categoryRouter = Router();
categoryRouter.use(authenticate);

categoryRouter.get('/', getCategories);
categoryRouter.post('/', validate(createCategorySchema), createCategory);
categoryRouter.get('/:id', getCategoryById);
categoryRouter.put('/:id', validate(createCategorySchema), updateCategory);
categoryRouter.delete('/:id', deleteCategory);

export { budgetRouter, categoryRouter };
