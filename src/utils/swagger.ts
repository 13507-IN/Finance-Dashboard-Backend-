import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../config/env';

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Financial Dashboard API',
      version: '1.0.0',
      description: 'Production-ready backend for financial records, analytics, and RBAC.',
    },
    servers: [
      {
        url: `https://finance-dashboard-backend-kti2.onrender.com/api`,
        description: 'Local development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        RegisterPayload: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            role: { type: 'string', enum: ['VIEWER', 'ANALYST'] },
          },
        },
        LoginPayload: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        CreateFinancialRecordPayload: {
          type: 'object',
          required: ['amount', 'type', 'category', 'date'],
          properties: {
            amount: { type: 'number', minimum: 0.01 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
            userId: { type: 'integer' },
          },
        },
        UpdateFinancialRecordPayload: {
          type: 'object',
          properties: {
            amount: { type: 'number', minimum: 0.01 },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
            category: { type: 'string' },
            date: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
            userId: { type: 'integer' },
          },
        },
        CreateCategoryPayload: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
          },
        },
        UpdateUserPayload: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'ADMIN'] },
            isActive: { type: 'boolean' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          tags: ['Health'],
          responses: {
            '200': {
              description: 'Service health',
            },
          },
        },
      },
      '/auth/register': {
        post: {
          summary: 'Register a user',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterPayload' },
              },
            },
          },
          responses: {
            '201': { description: 'User registered' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Login and receive JWT',
          tags: ['Auth'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginPayload' },
              },
            },
          },
          responses: {
            '200': { description: 'Login successful' },
          },
        },
      },
      '/auth/me': {
        get: {
          summary: 'Get current user profile',
          tags: ['Auth'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Profile fetched' },
            '401': { description: 'Unauthorized' },
          },
        },
      },
      '/records': {
        get: {
          summary: 'Get financial records (ANALYST, ADMIN)',
          tags: ['Financial Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'type', schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] } },
            { in: 'query', name: 'category', schema: { type: 'string' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'userId', schema: { type: 'integer' } },
            { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
            { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['date', 'amount', 'createdAt'] } },
            { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
          ],
          responses: {
            '200': { description: 'Records fetched' },
            '403': { description: 'Forbidden' },
          },
        },
        post: {
          summary: 'Create financial record (ADMIN only)',
          tags: ['Financial Records'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateFinancialRecordPayload' },
              },
            },
          },
          responses: {
            '201': { description: 'Record created' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/records/{id}': {
        patch: {
          summary: 'Update financial record (ADMIN only)',
          tags: ['Financial Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateFinancialRecordPayload' },
              },
            },
          },
          responses: {
            '200': { description: 'Record updated' },
            '403': { description: 'Forbidden' },
          },
        },
        delete: {
          summary: 'Delete financial record (ADMIN only)',
          tags: ['Financial Records'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'Record deleted' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/dashboard': {
        get: {
          summary: 'Get dashboard analytics (VIEWER, ANALYST, ADMIN)',
          tags: ['Dashboard'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'startDate', schema: { type: 'string', format: 'date-time' } },
            { in: 'query', name: 'endDate', schema: { type: 'string', format: 'date-time' } },
          ],
          responses: {
            '200': { description: 'Dashboard analytics fetched' },
          },
        },
      },
      '/categories': {
        get: {
          summary: 'Get categories (all authenticated roles)',
          tags: ['Categories'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'type', schema: { type: 'string', enum: ['INCOME', 'EXPENSE'] } },
          ],
          responses: {
            '200': { description: 'Categories fetched' },
          },
        },
        post: {
          summary: 'Create custom category (all authenticated roles)',
          tags: ['Categories'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCategoryPayload' },
              },
            },
          },
          responses: {
            '201': { description: 'Category created' },
          },
        },
      },
      '/users': {
        get: {
          summary: 'List users (ADMIN only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Users fetched' },
            '403': { description: 'Forbidden' },
          },
        },
      },
      '/users/{id}': {
        get: {
          summary: 'Get user by id (ADMIN only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'User fetched' },
          },
        },
        patch: {
          summary: 'Update user role/status (ADMIN only)',
          tags: ['Users'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateUserPayload' },
              },
            },
          },
          responses: {
            '200': { description: 'User updated' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
