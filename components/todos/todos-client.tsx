"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  ListTodo,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { RPGCard } from "@/components/ui/rpg-card";
import { RPGEmptyState } from "@/components/ui/rpg-empty-state";
import { RPGPageHeader } from "@/components/ui/rpg-page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { todoToFormValues, type TodoPriority } from "@/lib/todo-display";
import { patchShellFromAward } from "@/lib/shell-stats-client";
import { LevelUpModal } from "@/components/shared/level-up-modal";
import { TodoFormDialog } from "@/components/todos/todo-form-dialog";
import {
  clearCompletedTodos,
  deleteTodo,
  toggleTodoComplete,
} from "@/app/[locale]/(protected)/todos/actions";

export type TodoItem = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: TodoPriority;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
};

type Filter = "active" | "completed" | "all";

type Props = {
  todos: TodoItem[];
};

function formatDueLabel(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  if (isToday(date)) return "today";
  if (isTomorrow(date)) return "tomorrow";
  return format(date, "MMM d, yyyy");
}

export function TodosClient({ todos: initialTodos }: Props) {
  const t = useTranslations("todos");
  const tc = useTranslations("common");
  const [todos, setTodos] = useState(initialTodos);
  const [filter, setFilter] = useState<Filter>("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editTodo, setEditTodo] = useState<TodoItem | null>(null);
  const [pending, startTransition] = useTransition();
  const [levelUp, setLevelUp] = useState<{ level: number; title: string } | null>(null);

  useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos]);

  const counts = useMemo(
    () => ({
      active: todos.filter((todo) => !todo.isCompleted).length,
      completed: todos.filter((todo) => todo.isCompleted).length,
    }),
    [todos],
  );

  const visibleTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (filter === "active") return !todo.isCompleted;
      if (filter === "completed") return todo.isCompleted;
      return true;
    });
  }, [todos, filter]);

  const openCreate = () => {
    setEditTodo(null);
    setFormOpen(true);
  };

  const openEdit = (todo: TodoItem) => {
    setEditTodo(todo);
    setFormOpen(true);
  };

  const handleToggle = (todo: TodoItem) => {
    startTransition(async () => {
      try {
        const result = await toggleTodoComplete(todo.id);
        setTodos((prev) =>
          prev.map((item) =>
            item.id === todo.id
              ? {
                  ...item,
                  isCompleted: !item.isCompleted,
                  completedAt: item.isCompleted ? null : new Date().toISOString(),
                }
              : item,
          ),
        );
        if (!todo.isCompleted) {
          toast.success(tc("xpAwarded", { xp: result.xpAwarded }));
          patchShellFromAward(result);
          if (result.leveledUp) setLevelUp({ level: result.newLevel, title: result.newTitle });
        } else {
          toast.success(t("todoReopened"));
        }
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  const handleDelete = (todoId: string) => {
    startTransition(async () => {
      try {
        await deleteTodo(todoId);
        setTodos((prev) => prev.filter((item) => item.id !== todoId));
        toast.success(t("todoDeleted"));
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  const handleClearCompleted = () => {
    startTransition(async () => {
      try {
        await clearCompletedTodos();
        setTodos((prev) => prev.filter((item) => !item.isCompleted));
        toast.success(t("completedCleared"));
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  const dueLabel = (iso: string | null) => {
    const key = formatDueLabel(iso);
    if (!key) return null;
    if (key === "today") return t("dueToday");
    if (key === "tomorrow") return t("dueTomorrow");
    return key;
  };

  const isOverdue = (todo: TodoItem) => {
    if (!todo.dueDate || todo.isCompleted) return false;
    const date = new Date(todo.dueDate);
    return isPast(date) && !isToday(date);
  };

  return (
    <div className="space-y-6">
      <LevelUpModal
        open={Boolean(levelUp)}
        onOpenChange={() => setLevelUp(null)}
        level={levelUp?.level ?? 1}
        title={levelUp?.title ?? ""}
      />

      <RPGPageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        action={
          <Button
            className="bg-rpg-gold text-[#0a0a0f] hover:bg-[#e0b030]"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("addTodo")}</span>
            <span className="sm:hidden">{t("addShort")}</span>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["active", t("filterActive", { count: counts.active })],
            ["completed", t("filterCompleted", { count: counts.completed })],
            ["all", t("filterAll", { count: todos.length })],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              filter === key
                ? "border-rpg-gold bg-rpg-gold/10 text-rpg-gold"
                : "border-rpg-border bg-rpg-surface text-rpg-muted hover:text-rpg-text",
            )}
          >
            {label}
          </button>
        ))}

        {counts.completed > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ms-auto text-xs text-rpg-muted hover:text-rpg-danger"
            disabled={pending}
            onClick={handleClearCompleted}
          >
            {t("clearCompleted")}
          </Button>
        ) : null}
      </div>

      {visibleTodos.length === 0 ? (
        <RPGEmptyState
          icon={ListTodo}
          title={filter === "completed" ? t("emptyCompleted") : t("empty")}
          subtitle={filter === "active" ? t("emptyHint") : undefined}
        />
      ) : (
        <div className="space-y-2">
          {visibleTodos.map((todo) => (
            <RPGCard key={todo.id} glow="none" className="p-0">
              <div className="flex items-start gap-3 p-4">
                <button
                  type="button"
                  aria-label={todo.isCompleted ? t("markIncomplete") : t("markComplete")}
                  disabled={pending}
                  onClick={() => handleToggle(todo)}
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border transition",
                    todo.isCompleted
                      ? "border-rpg-success bg-rpg-success/15 text-rpg-success"
                      : "border-rpg-border bg-rpg-surface text-transparent hover:border-rpg-gold/50",
                  )}
                >
                  <Check className="size-3.5" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium text-rpg-text",
                        todo.isCompleted && "text-rpg-muted line-through",
                      )}
                    >
                      {todo.title}
                    </p>
                    {todo.priority === "HIGH" && !todo.isCompleted ? (
                      <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-300">
                        {t("priorityHigh")}
                      </span>
                    ) : null}
                  </div>

                  {todo.description ? (
                    <p className="mt-1 text-xs text-rpg-secondary">{todo.description}</p>
                  ) : null}

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-rpg-muted">
                    {todo.dueDate ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                          isOverdue(todo)
                            ? "border-rpg-danger/40 bg-rpg-danger/10 text-rpg-danger"
                            : "border-rpg-border bg-rpg-surface",
                        )}
                      >
                        <Calendar className="size-3" />
                        {dueLabel(todo.dueDate)}
                      </span>
                    ) : null}
                    {todo.isCompleted && todo.completedAt ? (
                      <span>{t("completedOn", { date: format(new Date(todo.completedAt), "MMM d") })}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-rpg-muted hover:text-rpg-gold"
                    disabled={pending}
                    onClick={() => openEdit(todo)}
                    aria-label={t("editTodo")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-rpg-muted hover:text-rpg-danger"
                    disabled={pending}
                    onClick={() => handleDelete(todo.id)}
                    aria-label={t("deleteTodo")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </RPGCard>
          ))}
        </div>
      )}

      {formOpen ? (
        <TodoFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          initial={editTodo ? todoToFormValues(editTodo) : null}
          editingTodo={editTodo}
          onSaved={(saved) => {
            setTodos((prev) => {
              const existing = prev.find((todo) => todo.id === saved.id);
              if (existing) {
                return prev.map((todo) => (todo.id === saved.id ? { ...todo, ...saved } : todo));
              }
              return [saved, ...prev];
            });
            setFormOpen(false);
            setEditTodo(null);
          }}
        />
      ) : null}
    </div>
  );
}
