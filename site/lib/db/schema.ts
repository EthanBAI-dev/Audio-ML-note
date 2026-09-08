import { integer, pgTable, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date', withTimezone: true }),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable('accounts', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
}, (token) => [primaryKey({ columns: [token.identifier, token.token] })]);

export const courses = pgTable('courses', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  status: text('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  courseId: text('course_id').references(() => courses.id),
  name: text('name').notNull(),
  accessType: text('access_type').notNull().default('lifetime'),
  active: integer('active').notNull().default(1),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  productId: text('product_id').notNull().references(() => products.id),
  provider: text('provider').notNull(),
  externalOrderId: text('external_order_id').notNull(),
  status: text('status').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull(),
  paidAt: timestamp('paid_at', { mode: 'date', withTimezone: true }),
  refundedAt: timestamp('refunded_at', { mode: 'date', withTimezone: true }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
}, (order) => [uniqueIndex('orders_provider_external_unique').on(order.provider, order.externalOrderId)]);

export const entitlements = pgTable('entitlements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  sourceOrderId: text('source_order_id').references(() => orders.id),
  grantedAt: timestamp('granted_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date', withTimezone: true }),
  revokedAt: timestamp('revoked_at', { mode: 'date', withTimezone: true }),
}, (entitlement) => [uniqueIndex('entitlements_user_product_unique').on(entitlement.userId, entitlement.productId)]);

export const lessonProgress = pgTable('lesson_progress', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  courseId: text('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  lessonId: text('lesson_id').notNull(),
  percent: integer('percent').notNull().default(0),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
}, (progress) => [primaryKey({ columns: [progress.userId, progress.courseId, progress.lessonId] })]);
