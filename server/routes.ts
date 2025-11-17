import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCategorySchema, 
  insertTransactionSchema,
  updateAccountTypeSchema,
} from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated, getOidcConfig } from "./replitAuth";
import localAuthRoutes from "./localAuth";

// Hybrid auth middleware - supports both local auth (session) and Replit Auth (OIDC)
// Checks both methods and sets req.userId if either is valid
async function hybridAuth(req: any, res: Response, next: NextFunction) {
  // Method 1: Check local auth (session-based)
  if (req.session?.userId) {
    req.userId = req.session.userId;
    return next();
  }
  
  // Method 2: Check Replit Auth (OIDC via passport)
  // req.isAuthenticated() checks if passport session exists
  // req.user populated by passport deserializeUser
  if (req.isAuthenticated() && req.user?.claims?.sub) {
    // Verify token hasn't expired (Replit Auth specific)
    const user = req.user as any;
    const now = Math.floor(Date.now() / 1000);
    
    if (user.expires_at && now > user.expires_at) {
      // Token expired, try to refresh
      const refreshToken = user.refresh_token;
      if (refreshToken) {
        try {
          const config = await getOidcConfig();
          const client = await import("openid-client");
          const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
          
          // Update session with new tokens
          user.claims = tokenResponse.claims();
          user.access_token = tokenResponse.access_token;
          user.refresh_token = tokenResponse.refresh_token;
          user.expires_at = user.claims?.exp;
          
          req.userId = user.claims.sub;
          return next();
        } catch (error) {
          return res.status(401).json({ error: "Token expirado e não pôde ser renovado" });
        }
      }
      return res.status(401).json({ error: "Token expirado" });
    }
    
    // Token still valid
    req.userId = user.claims.sub;
    return next();
  }
  
  // No valid authentication found
  return res.status(401).json({ error: "Não autenticado" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ============= AUTH SETUP =============
  // Setup Replit Auth (legacy - adds /api/login, /api/callback, /api/logout routes)
  await setupAuth(app);
  
  // Setup Local Auth (new - adds /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/me)
  app.use("/api/auth", localAuthRoutes);
  
  // ============= AUTH ROUTES =============
  // Legacy Replit Auth endpoint (kept for backward compatibility)
  app.get('/api/auth/user', hybridAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // ============= ACCOUNT SETTINGS =============
  app.patch("/api/account-settings", hybridAuth, async (req: any, res) => {
    try {
      const data = updateAccountTypeSchema.parse(req.body);
      const user = await storage.updateAccountType(req.userId, data);
      
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
  app.get("/api/categories", hybridAuth, async (req: any, res) => {
    try {
      const categories = await storage.getCategories(req.userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Erro ao buscar categorias" });
    }
  });
  
  app.get("/api/categories/:id", hybridAuth, async (req: any, res) => {
    try {
      const category = await storage.getCategory(req.params.id, req.userId);
      
      if (!category) {
        return res.status(404).json({ error: "Categoria não encontrada" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Erro ao buscar categoria" });
    }
  });
  
  app.post("/api/categories", hybridAuth, async (req: any, res) => {
    try {
      const data = insertCategorySchema.parse({
        ...req.body,
        userId: req.userId,
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
  
  app.patch("/api/categories/:id", hybridAuth, async (req: any, res) => {
    try {
      const data = insertCategorySchema.partial().omit({ userId: true, isDefault: true }).parse(req.body);
      const category = await storage.updateCategory(req.params.id, req.userId, data);
      
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
  
  app.delete("/api/categories/:id", hybridAuth, async (req: any, res) => {
    try {
      const success = await storage.deleteCategory(req.params.id, req.userId);
      
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
  app.get("/api/transactions", hybridAuth, async (req: any, res) => {
    try {
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
      
      const transactions = await storage.getTransactions(req.userId, filters);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Erro ao buscar transações" });
    }
  });
  
  app.get("/api/transactions/:id", hybridAuth, async (req: any, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id, req.userId);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transação não encontrada" });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      res.status(500).json({ error: "Erro ao buscar transação" });
    }
  });
  
  app.post("/api/transactions", hybridAuth, async (req: any, res) => {
    try {
      const data = insertTransactionSchema.parse({
        ...req.body,
        userId: req.userId,
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
  
  app.patch("/api/transactions/:id", hybridAuth, async (req: any, res) => {
    try {
      const data = insertTransactionSchema.partial().omit({ 
        userId: true,
        isRecurring: true,
        recurrenceType: true,
        recurrenceDay: true
      }).parse(req.body);
      const transaction = await storage.updateTransaction(req.params.id, req.userId, data);
      
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
  
  app.delete("/api/transactions/:id", hybridAuth, async (req: any, res) => {
    try {
      const success = await storage.deleteTransaction(req.params.id, req.userId);
      
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
  app.post("/api/transactions/process-recurrence", hybridAuth, async (req: any, res) => {
    try {
      const targetDate = req.body.targetDate ? new Date(req.body.targetDate) : new Date();
      const createdCount = await storage.processRecurringTransactions(req.userId, targetDate);
      
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
  
  app.get("/api/transactions/recurring", hybridAuth, async (req: any, res) => {
    try {
      const recurringTransactions = await storage.getRecurringTransactions(req.userId);
      res.json(recurringTransactions);
    } catch (error) {
      console.error("Error fetching recurring transactions:", error);
      res.status(500).json({ error: "Erro ao buscar transações recorrentes" });
    }
  });
  
  // ============= REPORTS =============
  app.get("/api/reports/monthly", hybridAuth, async (req: any, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const report = await storage.getMonthlyReport(req.userId, year, month);
      res.json(report);
    } catch (error) {
      console.error("Error generating monthly report:", error);
      res.status(500).json({ error: "Erro ao gerar relatório" });
    }
  });
  
  app.get("/api/reports/weekly", hybridAuth, async (req: any, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const weeklyData = await storage.getWeeklyData(req.userId, year, month);
      res.json(weeklyData);
    } catch (error) {
      console.error("Error generating weekly report:", error);
      res.status(500).json({ error: "Erro ao gerar relatório semanal" });
    }
  });
  
  app.get("/api/reports/advanced", hybridAuth, async (req: any, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      
      const advancedReport = await storage.getAdvancedReport(req.userId, year, month);
      res.json(advancedReport);
    } catch (error) {
      console.error("Error generating advanced report:", error);
      res.status(500).json({ error: "Erro ao gerar relatório avançado" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
