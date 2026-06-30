import { getViewerContext } from "@/lib/viewer";
import { getTodosPageData } from "@/lib/page-data/todos";
import { TodosClient } from "@/components/todos/todos-client";

export default async function TodosPage() {
  const viewer = await getViewerContext();
  if (!viewer) {
    return <div className="text-sm text-foreground/70">No user context found.</div>;
  }

  const todos = await getTodosPageData(viewer.userId);

  return <TodosClient todos={todos} />;
}
