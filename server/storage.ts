import { 
  type User, 
  type InsertUser,
  type UpsertUser,
  type Category, 
  type InsertCategory,
  type Transaction,
  type InsertTransaction,
  type UpdateAccountType,
  users,
  categories,
  transactions,
  defaultCategories,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";

function safeParseAmount(amount: string | number | null | undefined): number {
  if (amount === null || amount === undefined) return 0;
  const parsed = parseFloat(amount.toString());
  return isNaN(parsed) ? 0 : parsed;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateAccountType(userId: string, data: UpdateAccountType): Promise<User | undefined>;
  
  // Categories
  getCategories(userId: string): Promise<Category[]>;
  getCategory(id: string, userId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, userId: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string, userId: string): Promise<boolean>;
  createDefaultCategories(userId: string): Promise<void>;
  
  // Transactions
  getTransactions(userId: string, filters?: TransactionFilters): Promise<Transaction[]>;
  getTransaction(id: string, userId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, userId: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string, userId: string): Promise<boolean>;
  
  // Recurrence
  processRecurringTransactions(userId: string, targetDate?: Date): Promise<number>;
  getRecurringTransactions(userId: string): Promise<Transaction[]>;
  
  // Reports
  getMonthlyReport(userId: string, year: number, month: number): Promise<MonthlyReport>;
  getWeeklyData(userId: string, year: number, month: number): Promise<WeeklyData>;
  getAdvancedReport(userId: string, year: number, month: number): Promise<AdvancedReport>;
}

export interface TransactionFilters {
  categoryId?: string;
  status?: "paid" | "unpaid";
  startDate?: Date;
  endDate?: Date;
}

export interface MonthlyReport {
  currentMonth: {
    total: number;
    paid: number;
    unpaid: number;
    transactionCount: number;
    byCategory: CategorySummary[];
  };
  previousMonth: {
    total: number;
    paid: number;
    unpaid: number;
    transactionCount: number;
  };
  comparison: {
    totalChange: number;
    totalChangePercent: number;
    paidChange: number;
    unpaidChange: number;
  };
}

export interface AdvancedReport {
  overview: {
    totalExpenses: number;
    paidExpenses: number;
    unpaidExpenses: number;
    recurringExpenses: number;
    oneTimeExpenses: number;
    averageTransactionValue: number;
  };
  categoryRankings: CategoryRanking[];
  trends: {
    monthOverMonthChange: number;
    monthOverMonthChangePercent: number;
    paymentComplianceRate: number;
    recurringVsOneTimeRatio: number;
  };
  kpis: {
    topSpendingCategory: string;
    topSpendingCategoryAmount: number;
    categoryDiversity: number;
    projectedMonthlyTotal: number;
  };
}

export interface CategoryRanking {
  rank: number;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
  transactionCount: number;
  averageValue: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
}

export interface CategorySummary {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  total: number;
  count: number;
  percentage: number;
}

export interface WeeklyData {
  weeks: WeekData[];
  monthTotal: number;
}

export interface WeekData {
  weekNumber: number;
  label: string;
  total: number;
  transactions: Transaction[];
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, username),
    });
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // Create default categories for new user
    await this.createDefaultCategories(user.id);
    
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateAccountType(userId: string, data: UpdateAccountType): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        accountType: data.accountType,
        companyName: data.companyName,
        cnpj: data.cnpj,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }

  async createDefaultCategories(userId: string): Promise<void> {
    const categoriesToInsert = defaultCategories.map(cat => ({
      userId,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      isDefault: true,
    }));
    
    await db.insert(categories).values(categoriesToInsert);
  }

  async getCategories(userId: string): Promise<Category[]> {
    const result = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
      orderBy: [desc(categories.createdAt)],
    });
    return result;
  }

  async getCategory(id: string, userId: string): Promise<Category | undefined> {
    const result = await db.query.categories.findFirst({
      where: and(
        eq(categories.id, id),
        eq(categories.userId, userId)
      ),
    });
    return result;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [result] = await db.insert(categories).values(category).returning();
    return result;
  }

  async updateCategory(id: string, userId: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [result] = await db
      .update(categories)
      .set(category)
      .where(and(
        eq(categories.id, id),
        eq(categories.userId, userId)
      ))
      .returning();
    
    return result;
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    const category = await this.getCategory(id, userId);
    if (!category) return false;
    if (category.isDefault) return false;
    
    const result = await db
      .delete(categories)
      .where(and(
        eq(categories.id, id),
        eq(categories.userId, userId)
      ));
    
    return true;
  }

  async getTransactions(userId: string, filters?: TransactionFilters): Promise<Transaction[]> {
    const conditions = [eq(transactions.userId, userId)];
    
    if (filters?.categoryId) {
      conditions.push(eq(transactions.categoryId, filters.categoryId));
    }
    if (filters?.status) {
      conditions.push(eq(transactions.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(transactions.date, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(transactions.date, filters.endDate));
    }
    
    const result = await db.query.transactions.findMany({
      where: and(...conditions),
      orderBy: [desc(transactions.date)],
      with: {
        category: true,
      },
    });
    
    return result;
  }

  async getTransaction(id: string, userId: string): Promise<Transaction | undefined> {
    const result = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, id),
        eq(transactions.userId, userId)
      ),
    });
    return result;
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const transactionData = {
      ...transaction,
      date: new Date(transaction.date),
      amount: transaction.amount.toString(),
    };
    
    const [result] = await db.insert(transactions).values(transactionData).returning();
    return result;
  }

  async updateTransaction(id: string, userId: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const updateData: any = { ...transaction };
    
    if (transaction.date) {
      updateData.date = new Date(transaction.date);
    }
    if (transaction.amount !== undefined) {
      updateData.amount = transaction.amount.toString();
    }
    updateData.updatedAt = new Date();
    
    const [result] = await db
      .update(transactions)
      .set(updateData)
      .where(and(
        eq(transactions.id, id),
        eq(transactions.userId, userId)
      ))
      .returning();
    
    return result;
  }

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    await db
      .delete(transactions)
      .where(and(
        eq(transactions.id, id),
        eq(transactions.userId, userId)
      ));
    
    return true;
  }

  async getMonthlyReport(userId: string, year: number, month: number): Promise<MonthlyReport> {
    const currentMonthStart = new Date(year, month - 1, 1);
    const currentMonthEnd = new Date(year, month, 0, 23, 59, 59);
    
    const previousMonthStart = new Date(year, month - 2, 1);
    const previousMonthEnd = new Date(year, month - 1, 0, 23, 59, 59);
    
    const currentTransactions = await this.getTransactions(userId, {
      startDate: currentMonthStart,
      endDate: currentMonthEnd,
    });
    
    const previousTransactions = await this.getTransactions(userId, {
      startDate: previousMonthStart,
      endDate: previousMonthEnd,
    });
    
    const currentTotal = currentTransactions.reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    const currentPaid = currentTransactions.filter(t => t.status === "paid").reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    const currentUnpaid = currentTransactions.filter(t => t.status === "unpaid").reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    
    const previousTotal = previousTransactions.reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    const previousPaid = previousTransactions.filter(t => t.status === "paid").reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    const previousUnpaid = previousTransactions.filter(t => t.status === "unpaid").reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    
    const categoryMap = new Map<string, CategorySummary>();
    const userCategories = await this.getCategories(userId);
    const categoryLookup = new Map(userCategories.map(c => [c.id, c]));
    
    for (const transaction of currentTransactions) {
      const catId = transaction.categoryId || "uncategorized";
      const category = transaction.categoryId ? categoryLookup.get(transaction.categoryId) : null;
      
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, {
          categoryId: transaction.categoryId,
          categoryName: category?.name || "Sem Categoria",
          categoryColor: category?.color || "#64748B",
          total: 0,
          count: 0,
          percentage: 0,
        });
      }
      
      const summary = categoryMap.get(catId)!;
      summary.total += safeParseAmount(transaction.amount);
      summary.count += 1;
    }
    
    const byCategory = Array.from(categoryMap.values()).map(cat => ({
      ...cat,
      percentage: currentTotal > 0 ? (cat.total / currentTotal) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
    
    return {
      currentMonth: {
        total: currentTotal,
        paid: currentPaid,
        unpaid: currentUnpaid,
        transactionCount: currentTransactions.length,
        byCategory,
      },
      previousMonth: {
        total: previousTotal,
        paid: previousPaid,
        unpaid: previousUnpaid,
        transactionCount: previousTransactions.length,
      },
      comparison: {
        totalChange: currentTotal - previousTotal,
        totalChangePercent: previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0,
        paidChange: currentPaid - previousPaid,
        unpaidChange: currentUnpaid - previousUnpaid,
      },
    };
  }

  async getWeeklyData(userId: string, year: number, month: number): Promise<WeeklyData> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    
    const monthTransactions = await this.getTransactions(userId, {
      startDate: monthStart,
      endDate: monthEnd,
    });
    
    const weeks: WeekData[] = [
      { weekNumber: 1, label: "Semana 1 (1-7)", total: 0, transactions: [] },
      { weekNumber: 2, label: "Semana 2 (8-14)", total: 0, transactions: [] },
      { weekNumber: 3, label: "Semana 3 (15-21)", total: 0, transactions: [] },
      { weekNumber: 4, label: "Semana 4 (22-28)", total: 0, transactions: [] },
      { weekNumber: 5, label: "Semana 5 (29+)", total: 0, transactions: [] },
    ];
    
    for (const transaction of monthTransactions) {
      const day = new Date(transaction.date).getDate();
      let weekIndex = 0;
      
      if (day >= 1 && day <= 7) weekIndex = 0;
      else if (day >= 8 && day <= 14) weekIndex = 1;
      else if (day >= 15 && day <= 21) weekIndex = 2;
      else if (day >= 22 && day <= 28) weekIndex = 3;
      else weekIndex = 4;
      
      weeks[weekIndex].transactions.push(transaction);
      weeks[weekIndex].total += safeParseAmount(transaction.amount);
    }
    
    const monthTotal = monthTransactions.reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    
    return {
      weeks,
      monthTotal,
    };
  }

  async getRecurringTransactions(userId: string): Promise<Transaction[]> {
    const result = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, userId),
        eq(transactions.isRecurring, true)
      ),
      orderBy: [desc(transactions.createdAt)],
    });
    return result;
  }

  async processRecurringTransactions(userId: string, targetDate: Date = new Date()): Promise<number> {
    const recurringTransactions = await this.getRecurringTransactions(userId);
    let createdCount = 0;
    
    for (const template of recurringTransactions) {
      const nextDates = this.calculateNextRecurrenceDates(template, targetDate);
      
      for (const nextDate of nextDates) {
        const nextDateStr = nextDate.toISOString().split('T')[0];
        
        const conditions = [
          eq(transactions.userId, userId),
          eq(transactions.title, template.title),
          sql`DATE(${transactions.date}) = ${nextDateStr}`
        ];
        
        if (template.categoryId) {
          conditions.push(eq(transactions.categoryId, template.categoryId));
        }
        
        const existingTransaction = await db.query.transactions.findFirst({
          where: and(...conditions),
        });
        
        if (!existingTransaction) {
          const newTransaction = {
            userId: template.userId,
            categoryId: template.categoryId || null,
            title: template.title,
            amount: template.amount,
            date: nextDate.toISOString(),
            status: "unpaid" as const,
            notes: template.notes || null,
            recurrenceType: "none" as const,
            recurrenceDay: null,
            isRecurring: false,
          };
          
          await db.insert(transactions).values({
            ...newTransaction,
            date: nextDate,
            amount: template.amount.toString(),
          });
          createdCount++;
        }
      }
    }
    
    return createdCount;
  }

  private calculateNextRecurrenceDates(template: Transaction, targetDate: Date): Date[] {
    const dates: Date[] = [];
    const templateDate = new Date(template.date);
    
    const startMonth = templateDate.getMonth();
    const startYear = templateDate.getFullYear();
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    
    const monthsDiff = (targetYear - startYear) * 12 + (targetMonth - startMonth);
    
    switch (template.recurrenceType) {
      case "monthly":
      case "monthly_variable":
        const dayOfMonth = template.recurrenceDay || templateDate.getDate();
        
        for (let monthOffset = 0; monthOffset <= monthsDiff; monthOffset++) {
          const date = new Date(startYear, startMonth + monthOffset, 1);
          const year = date.getFullYear();
          const month = date.getMonth();
          const lastDay = new Date(year, month + 1, 0).getDate();
          const actualDay = Math.min(dayOfMonth, lastDay);
          const occurrenceDate = new Date(year, month, actualDay);
          
          if (occurrenceDate >= templateDate && occurrenceDate <= targetDate) {
            dates.push(occurrenceDate);
          }
        }
        break;
        
      case "weekly":
        const dayOfWeek = template.recurrenceDay !== null ? template.recurrenceDay : templateDate.getDay();
        let currentDate = new Date(templateDate);
        currentDate.setDate(templateDate.getDate() + ((dayOfWeek - templateDate.getDay() + 7) % 7));
        
        while (currentDate <= targetDate) {
          if (currentDate >= templateDate) {
            dates.push(new Date(currentDate));
          }
          currentDate.setDate(currentDate.getDate() + 7);
        }
        break;
        
      case "biweekly":
        const biweeklyDay = template.recurrenceDay !== null ? template.recurrenceDay : templateDate.getDay();
        let biweeklyDate = new Date(templateDate);
        biweeklyDate.setDate(templateDate.getDate() + ((biweeklyDay - templateDate.getDay() + 7) % 7));
        
        while (biweeklyDate <= targetDate) {
          if (biweeklyDate >= templateDate) {
            dates.push(new Date(biweeklyDate));
          }
          biweeklyDate.setDate(biweeklyDate.getDate() + 14);
        }
        break;
    }
    
    return dates;
  }

  async getAdvancedReport(userId: string, year: number, month: number): Promise<AdvancedReport> {
    const currentMonthStart = new Date(year, month - 1, 1);
    const currentMonthEnd = new Date(year, month, 0, 23, 59, 59);
    const previousMonthStart = new Date(year, month - 2, 1);
    const previousMonthEnd = new Date(year, month - 1, 0, 23, 59, 59);
    
    const currentTransactions = await this.getTransactions(userId, {
      startDate: currentMonthStart,
      endDate: currentMonthEnd,
    });
    
    const previousTransactions = await this.getTransactions(userId, {
      startDate: previousMonthStart,
      endDate: previousMonthEnd,
    });
    
    const totalExpenses = currentTransactions.reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    const paidExpenses = currentTransactions.filter(t => t.status === "paid").reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    const unpaidExpenses = currentTransactions.filter(t => t.status === "unpaid").reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    const recurringExpenses = currentTransactions.filter(t => t.isRecurring || t.recurrenceType !== "none").reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    const oneTimeExpenses = totalExpenses - recurringExpenses;
    const averageTransactionValue = currentTransactions.length > 0 ? totalExpenses / currentTransactions.length : 0;
    
    const previousTotal = previousTransactions.reduce((sum, t) => sum + safeParseAmount(t.amount), 0);
    
    const userCategories = await this.getCategories(userId);
    const categoryLookup = new Map(userCategories.map(c => [c.id, c]));
    
    const currentCategoryMap = new Map<string, { total: number; count: number; categoryId: string | null; name: string; color: string }>();
    const previousCategoryMap = new Map<string, number>();
    
    for (const transaction of currentTransactions) {
      const catId = transaction.categoryId || "uncategorized";
      const category = transaction.categoryId ? categoryLookup.get(transaction.categoryId) : null;
      
      if (!currentCategoryMap.has(catId)) {
        currentCategoryMap.set(catId, {
          total: 0,
          count: 0,
          categoryId: transaction.categoryId,
          name: category?.name || "Sem Categoria",
          color: category?.color || "#64748B",
        });
      }
      
      const summary = currentCategoryMap.get(catId)!;
      summary.total += safeParseAmount(transaction.amount);
      summary.count += 1;
    }
    
    for (const transaction of previousTransactions) {
      const catId = transaction.categoryId || "uncategorized";
      const current = previousCategoryMap.get(catId) || 0;
      previousCategoryMap.set(catId, current + safeParseAmount(transaction.amount));
    }
    
    const categoryRankings: CategoryRanking[] = Array.from(currentCategoryMap.entries()).map(([catId, data], index) => {
      const previousAmount = previousCategoryMap.get(catId) || 0;
      const change = data.total - previousAmount;
      const changePercent = previousAmount > 0 ? (change / previousAmount) * 100 : 0;
      
      let trend: "up" | "down" | "stable" = "stable";
      if (changePercent > 5) trend = "up";
      else if (changePercent < -5) trend = "down";
      
      return {
        rank: index + 1,
        categoryId: data.categoryId,
        categoryName: data.name,
        categoryColor: data.color,
        total: data.total,
        percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
        transactionCount: data.count,
        averageValue: data.count > 0 ? data.total / data.count : 0,
        trend,
        trendPercent: changePercent,
      };
    }).sort((a, b) => b.total - a.total);
    
    categoryRankings.forEach((cat, index) => {
      cat.rank = index + 1;
    });
    
    const topCategory = categoryRankings[0];
    const monthOverMonthChange = totalExpenses - previousTotal;
    const monthOverMonthChangePercent = previousTotal > 0 ? (monthOverMonthChange / previousTotal) * 100 : 0;
    const paymentComplianceRate = totalExpenses > 0 ? (paidExpenses / totalExpenses) * 100 : 0;
    const recurringVsOneTimeRatio = oneTimeExpenses > 0 ? recurringExpenses / oneTimeExpenses : 0;
    const categoryDiversity = currentCategoryMap.size;
    
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = new Date().getDate();
    const projectedMonthlyTotal = currentDay > 0 ? (totalExpenses / currentDay) * daysInMonth : totalExpenses;
    
    return {
      overview: {
        totalExpenses,
        paidExpenses,
        unpaidExpenses,
        recurringExpenses,
        oneTimeExpenses,
        averageTransactionValue,
      },
      categoryRankings,
      trends: {
        monthOverMonthChange,
        monthOverMonthChangePercent,
        paymentComplianceRate,
        recurringVsOneTimeRatio,
      },
      kpis: {
        topSpendingCategory: topCategory?.categoryName || "N/A",
        topSpendingCategoryAmount: topCategory?.total || 0,
        categoryDiversity,
        projectedMonthlyTotal,
      },
    };
  }
}

export const storage = new DatabaseStorage();
