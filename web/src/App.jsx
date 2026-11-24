import { useCallback, useEffect, useMemo, useState } from "react";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/tasks`);
      if (!response.ok) throw new Error(`Could not load tasks (${response.status}).`);
      setTasks(await response.json());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.isComplete).length,
    [tasks],
  );

  async function addTask(event) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    try {
      const response = await fetch(`${apiBaseUrl}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle }),
      });
      if (!response.ok) throw new Error(`Could not add task (${response.status}).`);
      setTitle("");
      await loadTasks();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function toggleTask(task) {
    try {
      const response = await fetch(`${apiBaseUrl}/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isComplete: !task.isComplete }),
      });
      if (!response.ok) throw new Error(`Could not update task (${response.status}).`);
      await loadTasks();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteTask(id) {
    try {
      const response = await fetch(`${apiBaseUrl}/tasks/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Could not delete task (${response.status}).`);
      await loadTasks();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">T</span>
          <span>TaskBoard<span className="brand-dot">.</span></span>
        </a>
        <span className="platform-tag"><span className="status-dot" /> RUNNING ON AKS</span>
      </header>

      <section className="hero">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Make room for<br /><span>what matters.</span></h1>
        <p className="hero-copy">A small task manager running on a cloud-native platform.</p>
      </section>

      <section className="board" aria-label="Task board">
        <div className="board-heading">
          <div>
            <h2>Today&apos;s focus</h2>
            <p>{completedCount} of {tasks.length} tasks complete</p>
          </div>
          <span className="count-badge">{String(tasks.length).padStart(2, "0")}</span>
        </div>

        <form className="new-task" onSubmit={addTask}>
          <label className="sr-only" htmlFor="task-title">New task title</label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Add a task to your board..."
          />
          <button type="submit" disabled={!title.trim()}>Add task <span aria-hidden="true">+</span></button>
        </form>

        {error && <p className="error" role="alert">{error}</p>}
        {loading ? (
          <p className="empty-state">Loading your board...</p>
        ) : tasks.length === 0 ? (
          <p className="empty-state">Nothing on the board yet. Add your first task above.</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li className={`task-row${task.isComplete ? " is-complete" : ""}`} key={task.id}>
                <button
                  className="check-button"
                  type="button"
                  aria-label={task.isComplete ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
                  aria-pressed={task.isComplete}
                  onClick={() => toggleTask(task)}
                >
                  {task.isComplete && <span aria-hidden="true">✓</span>}
                </button>
                <span className="task-title">{task.title}</span>
                <button className="delete-button" type="button" aria-label={`Delete ${task.title}`} onClick={() => deleteTask(task.id)}>×</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="footer">
        <span>Built for the cloud, one task at a time.</span>
        <span className="footer-stack">.NET <i /> Docker <i /> Kubernetes</span>
      </footer>
    </main>
  );
}
