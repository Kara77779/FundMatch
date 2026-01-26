import { z } from 'zod';
import { insertProjectSchema, insertStarSchema, insertInvestmentInterestSchema, insertQuestionSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// Message schema for AI conversation
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

// Health scores schema
const healthScoresSchema = z.object({
  problem: z.number().min(0).max(100),
  solution: z.number().min(0).max(100),
  customer: z.number().min(0).max(100),
  founder: z.number().min(0).max(100),
  market: z.number().min(0).max(100),
  suggestions: z.array(z.string()),
});

export const api = {
  projects: {
    list: {
      method: 'GET' as const,
      path: '/api/projects',
      input: z.object({
        search: z.string().optional(),
        fundingType: z.enum(['equity', 'debt', 'all']).optional(),
        status: z.enum(['draft', 'published', 'funded']).optional(),
        sortBy: z.enum(['newest', 'views', 'score']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.any()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id',
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/projects',
      input: z.object({ name: z.string() }),
      responses: {
        201: z.any(),
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/projects/:id',
      input: insertProjectSchema.partial(),
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    publish: {
      method: 'POST' as const,
      path: '/api/projects/:id/publish',
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    myProjects: {
      method: 'GET' as const,
      path: '/api/my-projects',
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  conversation: {
    get: {
      method: 'GET' as const,
      path: '/api/projects/:id/conversation',
      responses: {
        200: z.object({
          messages: z.array(messageSchema),
          currentStage: z.string(),
        }),
        404: errorSchemas.notFound,
      },
    },
    sendMessage: {
      method: 'POST' as const,
      path: '/api/projects/:id/conversation',
      input: z.object({ message: z.string() }),
      responses: {
        200: z.object({
          message: z.string(),
          stage: z.string(),
          collected: z.record(z.string()).optional(),
          complete: z.boolean(),
        }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  onePager: {
    generate: {
      method: 'POST' as const,
      path: '/api/projects/:id/one-pager',
      responses: {
        200: z.object({
          content: z.string(),
        }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  healthScore: {
    analyze: {
      method: 'POST' as const,
      path: '/api/projects/:id/health-score',
      responses: {
        200: healthScoresSchema,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  stars: {
    toggle: {
      method: 'POST' as const,
      path: '/api/projects/:id/star',
      responses: {
        200: z.object({ starred: z.boolean() }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/starred',
      responses: {
        200: z.array(z.any()),
        401: errorSchemas.unauthorized,
      },
    },
  },
  interests: {
    create: {
      method: 'POST' as const,
      path: '/api/projects/:id/interest',
      input: insertInvestmentInterestSchema.pick({ amount: true, message: true }),
      responses: {
        201: z.any(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/projects/:id/interests',
      responses: {
        200: z.array(z.any()),
      },
    },
  },
  questions: {
    create: {
      method: 'POST' as const,
      path: '/api/projects/:id/questions',
      input: insertQuestionSchema.pick({ question: true, isAnonymous: true }),
      responses: {
        201: z.any(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/projects/:id/questions',
      responses: {
        200: z.array(z.any()),
      },
    },
    answer: {
      method: 'POST' as const,
      path: '/api/questions/:id/answer',
      input: z.object({ answer: z.string() }),
      responses: {
        200: z.any(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type ProjectInput = z.infer<typeof api.projects.create.input>;
export type ConversationMessageInput = z.infer<typeof api.conversation.sendMessage.input>;
export type InvestmentInterestInput = z.infer<typeof api.interests.create.input>;
export type QuestionInput = z.infer<typeof api.questions.create.input>;
