'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Face from '@/components/Face';
import Sidebar from '@/components/Sidebar';
import Schedule from '@/components/Schedule';
import { useVoice } from '@/hooks/useVoice';
import { RemiTask } from '@/lib/remi-brain';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { apiService } from '@/lib/apiService';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function RemiApp() {
  const [tasks, setTasks] = useState<RemiTask[]>([]);
  const [transcript, setTranscript] = useState("");
  const [remiReply, setRemiReply] = useState("Hi! I'm Remi. What would you like to get done today?");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [lastAction, setLastAction] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // --- BRAIN PROCESSING ---
  const handleBrainProcess = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setTranscript(text);

    try {
      // NOW SENDING THE 'tasks' ARRAY TO THE BACKEND!
      const response = await apiService.chat(text, history, tasks);
      if (!response) return;

      setRemiReply(response.spoken_reply);
      speak(response.spoken_reply);

      setHistory(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: response.spoken_reply }]);

      if (response.action === 'save_name') {
        localStorage.setItem('remi_user_name', response.task);
        setUserName(response.task);
      }
      if (response.action === 'save_city') {
        localStorage.setItem('remi_user_city', response.task);
      }

      if (response.action === 'undo' && lastAction) {
        if (lastAction.type === 'add') {
          await supabase.from('remi_tasks').delete().eq('id', lastAction.id);
          setTasks(prev => prev.filter(t => t.id !== lastAction.id));
        } else if (lastAction.type === 'complete') {
          await supabase.from('remi_tasks').update({ status: 'pending' }).eq('id', lastAction.id);
          setTasks(prev => prev.map(t => t.id === lastAction.id ? { ...t, status: 'pending' } : t));
        }
        setLastAction(null);
      }

      if (response.action === 'complete_task') {
        const target = tasks.find(t => t.name.toLowerCase().includes(response.task.toLowerCase()));
        if (target) {
          await supabase.from('remi_tasks').update({ status: 'completed' }).eq('id', target.id);
          setTasks(prev => prev.map(t => t.id === target.id ? { ...t, status: 'completed' } : t));
          setLastAction({ type: 'complete', id: target.id });
        }
      }

      if (response.action === 'delete_task_confirmed') {
        const target = tasks.find(t => t.name.toLowerCase().includes(response.task.toLowerCase()));
        if (target) {
          await supabase.from('remi_tasks').delete().eq('id', target.id);
          setTasks(prev => prev.filter(t => t.id !== target.id));
        }
      }

      // --- NEW: DELETE ALL SCHEDULES ---
      if (response.action === 'delete_all_schedules') {
        await supabase.from('remi_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything
        setTasks([]);
      }

      if (response.action === 'add_task' || response.action === 'bulk_add') {
        const rawTasks = Array.isArray(response.task) ? response.task : [response.task];
        console.log("BRAIN --- Attempting to save tasks:", rawTasks);
        
        const tasksToInsert = rawTasks.map(t => {
          // Robustly handle different field names Gemini might use
          const taskName = t.name || t.title || t.description || "New Task";
          const taskType = t.type || t.category || 'task';
          const taskDate = t.due_date || t.date || new Date().toISOString().split('T')[0];
          const taskTime = t.due_time || t.time || '';
          
          return {
            name: taskName,
            type: taskType,
            due_date: taskDate,
            due_time: taskTime,
            priority: t.priority || 'medium',
            status: 'pending'
          };
        });

        const { data, error } = await supabase.from('remi_tasks').insert(tasksToInsert).select();
        
        if (error) {
          console.error("SUPABASE ERROR ---", error);
        } else if (data) {
          setTasks(prev => [...prev, ...data]);
          setLastAction({ type: 'add', id: data[0].id });
        }
      }

    } catch (err) {
      console.error("Brain failed", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, tasks, lastAction]);

  const { isListening, isSpeaking, startListening, stopListening, speak, error } = useVoice(handleBrainProcess);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.from('remi_tasks').select('*').order('created_at', { ascending: false });
      if (data) setTasks(data);

      const storedName = localStorage.getItem('remi_user_name');
      if (storedName) {
        setUserName(storedName);
        setRemiReply(`Good morning, ${storedName}! Ready to take on the day?`);
      } else {
        setTimeout(() => {
          const q = "Hi! I'm Remi, your personal assistant. I don't know your name yet. What should I call you?";
          setRemiReply(q);
          speak(q);
        }, 2000);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reactive only - auto-briefings removed
  }, []);

  return (
    <main className="remi-container">
      <Sidebar tasks={tasks} />
      <div className="main-view">
        <Face isSpeaking={isSpeaking} isListening={isListening} />
        <div className="voice-status">
          <AnimatePresence mode="wait">
            <motion.div key={remiReply} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="spoken-text">
              {remiReply}
            </motion.div>
          </AnimatePresence>
          {transcript && <div className="transcript-hint">"{transcript}"</div>}
          <button className={`mic-button ${isListening ? 'listening' : ''}`} onClick={isListening ? stopListening : startListening} disabled={isSpeaking}>
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>
          <div className="status-label">{isListening ? 'LISTENING...' : 'TAP TO SPEAK'}</div>
          <div className="debug-input-container">
            <input type="text" placeholder="Type a command..." onKeyDown={(e) => { if (e.key === 'Enter') { handleBrainProcess((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }} />
          </div>
        </div>
      </div>
      <Schedule tasks={tasks} />
    </main>
  );
}
