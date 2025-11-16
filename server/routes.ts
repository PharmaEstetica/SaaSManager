import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCategorySchema, 
  insertTransactionSchema,
  updateAccountTypeSchema,
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ============= AUTH SETUP =============
  // Setup Replit Auth (adds /api/login, /api/callback, /api/logout routes)
  await setupAuth(app);
  
  // ============= AUTH ROUTES =============
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // ============= ACCOUNT SETTINGS =============
  app.patch("/api/account-settings", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const data = updateAccountTypeSchema.parse(req.body);
      const user = await storage.updateAccountType(req.user.claims.sub, data);
      
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("Error updating account settings:", error);
      res.status(500).json({ error: "Erro ao atualizar configurações" });
    }
  });
  
  // ============= CATEGORIES =============
  app.get("/api/categories", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const categories = await storage.getCategories(req.user.claims.sub);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Erro ao buscar categorias" });
    }
  });
  
  app.get("/api/categories/:id", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const category = await storage.getCategory(req.params.id, req.user.claims.sub);
      
      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Erro ao buscar categoria" });
    }
  });
  
  app.post("/api/categories", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const data = insertCategorySchema.parse({
        ...req.body,
        userId: req.user.claims.sub,
      });
      
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Erro ao criar categoria" });
    }
  });
  
  app.patch("/api/categories/:id", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const data = insertCategorySchema.partial().omit({ userId: true, isDefault: true }).parse(req.body);
      const category = await storage.updateCategory(req.params.id, req.user.claims.sub, data);
      
      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Erro ao atualizar categoria" });
    }
  });
  
  app.delete("/api/categories/:id", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const success = await storage.deleteCategory(req.params.id, req.user.claims.sub);
      
      if (!success) {
        return res.status(404).json({ error: "Categoria não encontrada ou não pode ser excluída" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Erro ao excluir categoria" });
    }
  });
  
  // ============= TRANSACTIONS =============
  app.get("/api/transactions", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const filters: any = {};
      
      if (req.query.categoryId) {
        filters.categoryId = req.query.categoryId as string;
      }
      if (req.query.status) {
        filters.status = req.query.status as "paid" | "unpaid";
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      
      const transactions = await storage.getTransactions(req.user.claims.sub, filters);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Erro ao buscar transações" });
    }
  });
  
  app.get("/api/transactions/:id", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const transaction = await storage.getTransaction(req.params.id, req.user.claims.sub);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ error: "Erro ao buscar transação" });
    }
  });
  
  app.post("/api/transactions", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const data = insertTransactionSchema.parse({
        ...req.body,
        userId: req.user.claims.sub,
      });
      
      const transaction = await storage.createTransaction(data);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("Error creating transaction:", error);
      res.status(500).json({ error: "Erro ao criar transação" });
    }
  });
  
  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const data = insertTransactionSchema.partial().omit({ 
        userId: true,
        isRecurring: true,
        recurrenceType: true,
        recurrenceDay: true
      }).parse(req.body);
      const transaction = await storage.updateTransaction(req.params.id, req.user.claims.sub, data);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Dados inválidos", details: error.errors });
      }
      console.error("Error updating transaction:", error);
      res.status(500).json({ error: "Erro ao atualizar transação" });
    }
  });
  
  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const success = await storage.deleteTransaction(req.params.id, req.user.claims.sub);
      
      if (!success) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ error: "Erro ao excluir transação" });
    }
  });
  
  // ============= RECURRENCE =============
  app.post("/api/transactions/process-recurrence", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const targetDate = req.body.targetDate ? new Date(req.body.targetDate) : new Date();
      const createdCount = await storage.processRecurringTransactions(req.user.claims.sub, targetDate);
      
      res.json({ 
        success: true, 
        createdCount,
        message: `${createdCount} transação(ões) criada(s) a partir de recorrências`
      });
    } catch (error) {
      console.error("Error processing recurring transactions:", error);
      res.status(500).json({ error: "Erro ao processar transações recorrentes" });
    }
  });
  
  app.get("/api/transactions/recurring", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const recurringTransactions = await storage.getRecurringTransactions(req.user.claims.sub);
      res.json(recurringTransactions);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
      res.status(500).json({ error: "Erro ao buscar transações recorrentes" });
    }
  });
  
  // ============= REPORTS =============
  app.get("/api/reports/monthly", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const report = await storage.getMonthlyReport(req.user.claims.sub, year, month);
      res.json(report);
    } catch (error) {
      console.error("Error generating monthly report:", error);
      res.status(500).json({ error: "Erro ao gerar relatório" });
    }
  });
  
  app.get("/api/reports/weekly", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const weeklyData = await storage.getWeeklyData(req.user.claims.sub, year, month);
      res.json(weeklyData);
    } catch (error) {
      console.error("Error generating weekly report:", error);
      res.status(500).json({ error: "Erro ao gerar relatório semanal" });
    }
  });
  
  app.get("/api/reports/advanced", async (req, res) => {
    try {
      if (!req.user?.claims?.sub) {
        return res.status(401).json({ error: "Não autenticado" });
      }
      
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const advancedReport = await storage.getAdvancedReport(req.user.claims.sub, year, month);
      res.json(advancedReport);
    } catch (error) {
      console.error("Error generating advanced report:", error);
      res.status(500).json({ error: "Erro ao gerar relatório avançado" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
