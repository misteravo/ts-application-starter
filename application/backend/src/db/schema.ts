import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  recoveryCode: text('recovery_code').notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  expiresAt: timestamp('expires_at').notNull(),
  twoFactorVerified: boolean('two_factor_verified').notNull().default(false),
});

export const emailVerificationRequest = pgTable('email_verification_request', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const passwordResetSession = pgTable('password_reset_session', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  email: text('email').notNull(),
  code: text('code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  twoFactorVerified: boolean('two_factor_verified').notNull().default(false),
});

export const totpCredential = pgTable('totp_credential', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => user.id),
  key: text('key').notNull(),
});

export const passkeyCredential = pgTable('passkey_credential', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  algorithm: integer('algorithm').notNull(),
  publicKey: text('public_key').notNull(),
});

export const securityKeyCredential = pgTable('security_key_credential', {
  id: text('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  algorithm: integer('algorithm').notNull(),
  publicKey: text('public_key').notNull(),
});
