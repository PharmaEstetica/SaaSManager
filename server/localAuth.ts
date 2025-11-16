import { Router } from "express";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Extend express-session types
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().optional(),
  accountType: z.enum(["personal", "business"]).default("personal"),
  companyName: z.string().optional(),
  cnpj: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Default categories to create for new users
const DEFAULT_CATEGORIES = [
  { name: "Salário", color: "#10B981", icon: "DollarSign" },
  { name: "Alimentação", color: "#F59E0B", icon: "UtensilsCrossed" },
  { name: "Transporte", color: "#3B82F6", icon: "Car" },
  { name: "Moradia", color: "#8B5CF6", icon: "Home" },
  { name: "Saúde", color: "#EF4444", icon: "Heart" },
  { name: "Educação", color: "#06B6D4", icon: "GraduationCap" },
  { name: "Lazer", color: "#EC4899", icon: "Gamepad2" },
  { name: "Gastos Fixos", color: "#6366F1", icon: "Receipt" },
  { name: "Outros", color: "#64748B", icon: "MoreHorizontal" },
];

// Register endpoint
router.post("/register", async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);
      
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email já cadastrado" });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName || null,
        accountType: validatedData.accountType,
        companyName: validatedData.companyName || null,
        cnpj: validatedData.cnpj || null,
      })
      .returning();
      
    // Create default categories for the user
    const { categories } = await import("@shared/schema");
    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map(cat => ({
        userId: newUser.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        isDefault: true,
      }))
    );
    
    // Set session
    req.session.userId = newUser.id;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error("Registration error:", error);
    res.status(500).json({ message: "Erro ao criar conta" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);
      
    if (!user || !user.password) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Email ou senha incorretos" });
    }
    
    // Set session
    req.session.userId = user.id;
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    console.error("Login error:", error);
    res.status(500).json({ message: "Erro ao fazer login" });
  }
});

// Logout endpoint (accepts both GET and POST, returns JSON)
const logoutHandler = (req: any, res: any) => {
  req.session.destroy((err: any) => {
    if (err) {
      return res.status(500).json({ message: "Erro ao fazer logout" });
    }
    res.clearCookie("connect.sid");
    // Return JSON success - let frontend handle redirect
    res.json({ message: "Logout realizado com sucesso", redirect: "/" });
  });
};

router.post("/logout", logoutHandler);
router.get("/logout", logoutHandler);

// Get current user endpoint
router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Não autenticado" });
  }
  
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.session.userId))
      .limit(1);
      
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: "Usuário não encontrado" });
    }
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Erro ao buscar usuário" });
  }
});

export default router;
