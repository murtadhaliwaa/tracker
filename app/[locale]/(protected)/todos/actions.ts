"use server";

import { prisma } from "@/lib/prisma";
import { requireViewer } from "@/lib/action-utils";
import { awardXP } from "@/lib/xp";
import { revalidateLocalePaths } from "@/lib/revalidate-paths";
import { todoFormSchema, updateTodoSchema } from "@/lib/validators";

const TODO_COMPLETE_XP = 5;

function revalidateTodoPages() {
  revalidateLocalePaths("/todos");
}

function normalizeTodoInput(parsed: {
  title: string;
  description?: string;
  dueDate?: Date | null;
  priority: "NORMAL" | "HIGH";
}) {
  return {
    title: parsed.title.trim(),
    description: parsed.description?.trim() || null,
    dueDate: parsed.dueDate ?? null,
    priority: parsed.priority,
  };
}

export async function createTodo(input: unknown) {
  const viewer = await requireViewer();
  const parsed = todoFormSchema.parse(input);
  const data = normalizeTodoInput(parsed);

  const maxOrder = await prisma.todo.aggregate({
    where: { userId: viewer.userId, isCompleted: false },
    _max: { order: true },
  });

  const todo = await prisma.todo.create({
    data: {
      userId: viewer.userId,
      ...data,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidateTodoPages();
  return { todo };
}

export async function updateTodo(input: unknown) {
  const viewer = await requireViewer();
  const parsed = updateTodoSchema.parse(input);
  const data = normalizeTodoInput(parsed);

  await prisma.todo.updateMany({
    where: { id: parsed.id, userId: viewer.userId },
    data,
  });

  revalidateTodoPages();
  return { success: true as const };
}

export async function toggleTodoComplete(todoId: string) {
  const viewer = await requireViewer();

  const todo = await prisma.todo.findFirst({
    where: { id: todoId, userId: viewer.userId },
  });

  if (!todo) throw new Error("Todo not found");

  if (todo.isCompleted) {
    await prisma.todo.update({
      where: { id: todo.id },
      data: { isCompleted: false, completedAt: null },
    });
    revalidateTodoPages();
    return { leveledUp: false, xpAwarded: 0, newLevel: 0, newTitle: "", currentXP: 0, xpToNextLevel: 0, totalXP: 0 };
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.todo.update({
      where: { id: todo.id },
      data: { isCompleted: true, completedAt: new Date() },
    });

    return awardXP(tx, viewer.userId, TODO_COMPLETE_XP, "todo_complete", 1);
  });

  revalidateTodoPages();
  return result;
}

export async function deleteTodo(todoId: string) {
  const viewer = await requireViewer();

  await prisma.todo.deleteMany({
    where: { id: todoId, userId: viewer.userId },
  });

  revalidateTodoPages();
  return { success: true as const };
}

export async function clearCompletedTodos() {
  const viewer = await requireViewer();

  await prisma.todo.deleteMany({
    where: { userId: viewer.userId, isCompleted: true },
  });

  revalidateTodoPages();
  return { success: true as const };
}
