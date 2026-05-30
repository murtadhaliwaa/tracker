"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  TODO_ACCENT,
  emptyTodoForm,
  parseTodoDueDate,
  type TodoFormValues,
  type TodoPriority,
} from "@/lib/todo-display";
import type { TodoItem } from "@/components/todos/todos-client";
import { createTodo, updateTodo } from "@/app/[locale]/(protected)/todos/actions";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: TodoFormValues | null;
  editingTodo?: TodoItem | null;
  onSaved: (todo: TodoItem) => void;
};

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-[#1e1e3a]/80 bg-[#13131f]/40 p-3.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-rpg-gold/90">{title}</h3>
      {children}
    </section>
  );
}

function getPriorityLabel(
  t: ReturnType<typeof useTranslations<"todos">>,
  priority: TodoPriority,
): string {
  return priority === "HIGH" ? t("priorityHigh") : t("priorityNormal");
}

export function TodoFormDialog({ open, onOpenChange, initial, editingTodo, onSaved }: Props) {
  const t = useTranslations("todos");
  const tc = useTranslations("common");
  const [form, setForm] = useState<TodoFormValues>(initial ?? emptyTodoForm);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setForm(initial ?? emptyTodoForm);
  }, [initial, open]);

  const previewDue = useMemo(() => {
    if (!form.dueDate) return t("previewNoDueDate");
    try {
      return new Date(`${form.dueDate}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return form.dueDate;
    }
  }, [form.dueDate, t]);

  const submit = () => {
    if (!form.title.trim()) return;

    startTransition(async () => {
      try {
        const payload = {
          ...form,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          dueDate: parseTodoDueDate(form.dueDate),
        };

        if (form.id && editingTodo) {
          await updateTodo(payload);
          onSaved({
            ...editingTodo,
            title: payload.title,
            description: payload.description?.trim() || null,
            dueDate: payload.dueDate?.toISOString() ?? null,
            priority: form.priority,
          });
        } else if (form.id) {
          await updateTodo(payload);
          onSaved({
            id: form.id,
            title: payload.title,
            description: payload.description?.trim() || null,
            dueDate: payload.dueDate?.toISOString() ?? null,
            priority: form.priority,
            isCompleted: false,
            completedAt: null,
            createdAt: new Date().toISOString(),
          });
        } else {
          const { todo } = await createTodo(payload);
          onSaved({
            id: todo.id,
            title: todo.title,
            description: todo.description,
            dueDate: todo.dueDate?.toISOString() ?? null,
            priority: todo.priority as TodoPriority,
            isCompleted: todo.isCompleted,
            completedAt: todo.completedAt?.toISOString() ?? null,
            createdAt: todo.createdAt.toISOString(),
          });
        }

        toast.success(form.id ? t("todoUpdated") : t("todoCreated"));
        onOpenChange(false);
      } catch {
        toast.error(tc("error"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-0 overflow-hidden border-[#1e1e3a] bg-[#0f0f1a] p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[#1e1e3a] px-5 py-4">
          <DialogTitle className="font-heading text-rpg-gold">
            {form.id ? t("editTodo") : t("addTodo")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div
            className="flex items-start gap-3 rounded-xl border p-3"
            style={{
              borderColor: `${TODO_ACCENT}66`,
              background: `linear-gradient(135deg, ${TODO_ACCENT}18, transparent)`,
            }}
          >
            <div
              className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border text-lg"
              style={{ borderColor: `${TODO_ACCENT}88`, background: "#0f0f1a" }}
            >
              {form.priority === "HIGH" ? "🔥" : "📋"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-rpg-text">
                {form.title.trim() || t("previewPlaceholder")}
              </p>
              <p className="mt-1 text-xs text-rpg-muted">
                {getPriorityLabel(t, form.priority)} · {previewDue}
              </p>
              {form.description.trim() ? (
                <p className="mt-2 line-clamp-2 text-xs text-rpg-secondary">{form.description}</p>
              ) : null}
            </div>
          </div>

          <FormSection title={t("sectionBasics")}>
            <div className="space-y-2">
              <Label htmlFor="todo-title">{t("fieldTitle")}</Label>
              <Input
                id="todo-title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t("titlePlaceholder")}
                className="border-[#1e1e3a] bg-[#13131f]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="todo-description">{t("fieldDescription")}</Label>
              <Textarea
                id="todo-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t("descriptionPlaceholder")}
                rows={3}
                className="border-[#1e1e3a] bg-[#13131f]"
              />
            </div>
          </FormSection>

          <FormSection title={t("sectionDetails")}>
            <div className="space-y-2">
              <Label htmlFor="todo-due">{t("fieldDueDate")}</Label>
              <Input
                id="todo-due"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="border-[#1e1e3a] bg-[#13131f]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("fieldPriority")}</Label>
              <div className="flex gap-2">
                {(["NORMAL", "HIGH"] as const).map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, priority }))}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-2 text-sm transition",
                      form.priority === priority
                        ? "border-rpg-gold bg-rpg-gold/10 text-rpg-gold"
                        : "border-[#1e1e3a] bg-[#13131f] text-rpg-muted hover:border-[#2a2a4a]",
                    )}
                  >
                    {getPriorityLabel(t, priority)}
                  </button>
                ))}
              </div>
            </div>
          </FormSection>
        </div>

        <DialogFooter className="border-t border-[#1e1e3a] bg-[#0f0f1a] px-5 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-[#1e1e3a]"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            {tc("cancel")}
          </Button>
          <Button
            type="button"
            className="bg-rpg-gold text-[#0a0a0f] hover:bg-[#e0b030]"
            disabled={pending || !form.title.trim()}
            onClick={submit}
          >
            {pending ? t("saving") : tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
