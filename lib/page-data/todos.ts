import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type TodoClientRow = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "NORMAL" | "HIGH";
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
};

export const getTodosPageData = cache(async (userId: string): Promise<TodoClientRow[]> => {
  const todos = await prisma.todo.findMany({
    where: { userId },
    orderBy: [{ isCompleted: "asc" }, { order: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      priority: true,
      isCompleted: true,
      completedAt: true,
      createdAt: true,
    },
  });

  return todos.map((todo) => ({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    dueDate: todo.dueDate?.toISOString() ?? null,
    priority: todo.priority,
    isCompleted: todo.isCompleted,
    completedAt: todo.completedAt?.toISOString() ?? null,
    createdAt: todo.createdAt.toISOString(),
  }));
});
