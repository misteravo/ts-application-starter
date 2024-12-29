import { blob, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const user = sqliteTable('user', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  emailVerified: integer('email_verified').notNull().default(0),
  recoveryCode: blob('recovery_code').$type<Uint8Array>().notNull(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  expiresAt: integer('expires_at').notNull(),
  twoFactorVerified: integer('two_factor_verified').notNull().default(0),
});

export const emailVerificationRequest = sqliteTable('email_verification_request', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: integer('expires_at').notNull(),
});

export const passwordResetSession = sqliteTable('password_reset_session', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: integer('expires_at').notNull(),
  emailVerified: integer('email_verified').notNull().default(0),
  twoFactorVerified: integer('two_factor_verified').notNull().default(0),
});

export const totpCredential = sqliteTable('totp_credential', {
  id: integer('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => user.id),
  key: blob('key').$type<Uint8Array>().notNull(),
});

export const passkeyCredential = sqliteTable('passkey_credential', {
  id: blob('id').$type<Uint8Array>().primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  algorithm: integer('algorithm').notNull(),
  publicKey: blob('public_key').$type<Uint8Array>().notNull(),
});

export const securityKeyCredential = sqliteTable('security_key_credential', {
  id: blob('id').$type<Uint8Array>().primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  algorithm: integer('algorithm').notNull(),
  publicKey: blob('public_key').$type<Uint8Array>().notNull(),
});
