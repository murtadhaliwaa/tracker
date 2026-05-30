export const TODO_ACCENT = "#f0c040";

export type TodoPriority = "NORMAL" | "HIGH";

export type TodoFormValues = {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TodoPriority;
};

export const emptyTodoForm: TodoFormValues = {
  title: "",
  description: "",
  dueDate: "",
  priority: "NORMAL",
};

export function todoToFormValues(todo: {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  priority: TodoPriority;
}): TodoFormValues {
  const due =
    todo.dueDate instanceof Date
      ? todo.dueDate.toISOString().slice(0, 10)
      : todo.dueDate
        ? todo.dueDate.slice(0, 10)
        : "";
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description ?? "",
    dueDate: due,
    priority: todo.priority,
  };
}

export function parseTodoDueDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(`${trimmed}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}
