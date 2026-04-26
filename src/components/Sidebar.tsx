import { RemiTask } from "@/lib/remi-brain";
import { CheckCircle, Circle, Clock } from "lucide-react";

interface SidebarProps {
  tasks: RemiTask[];
}

export default function Sidebar({ tasks }: SidebarProps) {
  const pendingTasks = tasks.filter(t => t.type === 'task');

  return (
    <aside className="sidebar glass-panel">
      <h2 className="font-warm" style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Your Tasks</h2>
      {pendingTasks.length === 0 ? (
        <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>No tasks for today. Why not add one?</p>
      ) : (
        pendingTasks.map(task => (
          <div key={task.id} className="card">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {task.status === 'done' ? (
                <CheckCircle size={20} color="var(--accent)" />
              ) : (
                <Circle size={20} color="var(--secondary)" />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{task.name}</div>
                {task.due_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginTop: '4px', opacity: 0.6 }}>
                    <Clock size={12} />
                    <span>{task.due_date} {task.due_time}</span>
                  </div>
                )}
              </div>
              <span className={`badge ${task.status}`}>{task.status}</span>
            </div>
          </div>
        ))
      )}
    </aside>
  );
}
