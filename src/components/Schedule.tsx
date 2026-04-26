import { RemiTask } from "@/lib/remi-brain";
import { Calendar } from "lucide-react";

interface ScheduleProps {
  tasks: RemiTask[];
}

export default function Schedule({ tasks }: ScheduleProps) {
  const events = tasks.filter(t => t.type === 'event');

  return (
    <aside className="sidebar glass-panel">
      <h2 className="font-warm" style={{ marginBottom: '12px', fontSize: '1.5rem' }}>Schedule</h2>
      {events.length === 0 ? (
        <p style={{ opacity: 0.5, fontSize: '0.9rem' }}>Your week looks clear.</p>
      ) : (
        events.map(event => (
          <div key={event.id} className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{event.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', marginTop: '4px', color: 'var(--accent)' }}>
                  <Calendar size={12} />
                  <span>{event.due_date} • {event.due_time || 'All Day'}</span>
                </div>
              </div>
              <span className="badge event">Event</span>
            </div>
          </div>
        ))
      )}
      
      <div style={{ marginTop: 'auto', padding: '16px', background: 'var(--secondary)', borderRadius: '16px', fontSize: '0.8rem' }}>
        <p style={{ fontWeight: 600 }}>Tip:</p>
        <p opacity="0.8">Tell me "My schedule this week is..." to bulk add events.</p>
      </div>
    </aside>
  );
}
