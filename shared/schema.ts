// Based on javascript_log_in_with_replit and javascript_database blueprints
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  accountType: varchar("account_type", { enum: ["personal", "business"] }).default("personal"),
  companyName: varchar("company_name"),
  cnpj: varchar("cnpj"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table - user-created and default categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  color: varchar("color").default("#10B981"), // Default green
  icon: varchar("icon"), // Optional icon name from lucide-react
  isDefault: boolean("is_default").default(false), // Default categories can't be deleted
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table - all financial transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: "set null" }),
  title: varchar("title").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  status: varchar("status", { enum: ["paid", "unpaid"] }).default("unpaid"),
  notes: text("notes"),
  // Recurrence settings
  recurrenceType: varchar("recurrence_type", { 
    enum: ["none", "monthly", "weekly", "biweekly", "monthly_variable"] 
  }).default("none"),
  recurrenceDay: integer("recurrence_day"), // Day of month (1-31) or day of week (0-6)
  isRecurring: boolean("is_recurring").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  accountType: true,
  companyName: true,
  cnpj: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.string().or(z.number()),
  date: z.string().or(z.date()),
});

export const updateAccountTypeSchema = z.object({
  accountType: z.enum(["personal", "business"]),
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
});

// TypeScript types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type UpdateAccountType = z.infer<typeof updateAccountTypeSchema>;

// Default categories for new users
export const defaultCategories = [
  { name: "Gasto Fixo", color: "#3B82F6", icon: "Home" },
  { name: "Folha de Pagamento", color: "#8B5CF6", icon: "Users" },
  { name: "Assinaturas", color: "#EC4899", icon: "CreditCard" },
  { name: "Contas Recorrentes", color: "#F59E0B", icon: "Calendar" },
  { name: "Alimentação", color: "#10B981", icon: "UtensilsCrossed" },
  { name: "Transporte", color: "#06B6D4", icon: "Car" },
  { name: "Saúde", color: "#EF4444", icon: "Heart" },
  { name: "Educação", color: "#6366F1", icon: "GraduationCap" },
  { name: "Lazer", color: "#F97316", icon: "Smile" },
  { name: "Outros", color: "#64748B", icon: "MoreHorizontal" },
];
