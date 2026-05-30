import { getViewerContext } from "@/lib/viewer";
import { prisma } from "@/lib/prisma";
import { TodosClient } from "@/components/todos/todos-client";

export default async function TodosPage() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return <div className="text-sm text-foreground/70">No user context found.</div>;
  }

  const todos = await prisma.todo.findMany({
    where: { userId: viewer.userId },
    orderBy: [{ isCompleted: "asc" }, { order: "asc" }, { createdAt: "desc" }],
  });

  return (
    <TodosClient
      todos={todos.map((todo) => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        dueDate: todo.dueDate?.toISOString() ?? null,
        priority: todo.priority,
        isCompleted: todo.isCompleted,
        completedAt: todo.completedAt?.toISOString() ?? null,
        createdAt: todo.createdAt.toISOString(),
      }))}
    />
  );
}
