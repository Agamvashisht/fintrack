import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinTrack API',
      version: '1.0.0',
      description: 'Personal Finance Tracker REST API',
      contact: {
        name: 'FinTrack Team',
        email: 'api@fintrack.dev',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}/api/${config.API_VERSION}`,
        description: 'Development server',
      },
      {
        url: `https://api.fintrack.dev/api/${config.API_VERSION}`,
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            description: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            category: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                color: { type: 'string' },
                icon: { type: 'string' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Budget: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            amount: { type: 'number' },
            month: { type: 'integer', minimum: 1, maximum: 12 },
            year: { type: 'integer' },
            category: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            spent: { type: 'number' },
            remaining: { type: 'number' },
            usagePercentage: { type: 'number' },
            exceeded: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
