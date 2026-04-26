export type RemiAction = 
  | "add_task" | "view_tasks" | "add_event" | "view_schedule" 
  | "complete" | "delete" | "update" | "set_email_reminder" | "chat";

export interface RemiTask {
  id?: string;
  name: string;
  type: "task" | "event";
  due_date: string | null;
  due_time: string | null;
  priority: "high" | "medium" | "low";
  status: "pending" | "done";
  email_reminder: boolean;
  remind_before_minutes: number | null;
}

export interface RemiResponse {
  action: RemiAction;
  spoken_reply: string;
  task: RemiTask | null;
  clearPending?: boolean;
}

export class RemiBrain {
  private pendingTask: Partial<RemiTask> | null = null;
  private awaitingField: "name" | "date" | "time" | "email_confirm" | null = null;

  processInput(input: string): RemiResponse {
    const text = input.toLowerCase();
    
    // Handle ongoing conversation for missing info
    if (this.awaitingField) {
      return this.handleMissingInfo(text);
    }

    // Identity check
    if (text.includes("who are you") || text.includes("your name")) {
      return {
        action: "chat",
        spoken_reply: "I'm Remi, your personal assistant. I'm here to help you manage your tasks and schedule.",
        task: null
      };
    }

    // (a) ADD TASK
    if (text.includes("remind me to") || text.includes("add a task") || text.includes("don't let me forget")) {
      const taskName = this.extractTaskName(text, ["remind me to", "add a task for", "don't let me forget"]);
      
      this.pendingTask = {
        name: taskName || "Untitled Task",
        type: "task",
        due_date: this.extractDate(text),
        due_time: this.extractTime(text),
        priority: "medium",
        status: "pending",
        email_reminder: false,
        remind_before_minutes: null
      };

      return this.getNextStep();
    }

    // (c) SCHEDULE / ADD EVENT
    if (text.includes("meeting") || text.includes("appointment") || text.includes("schedule")) {
        const eventName = this.extractTaskName(text, ["i have a", "meeting on", "appointment on", "schedule a"]);
        
        this.pendingTask = {
          name: eventName || "Meeting",
          type: "event",
          due_date: this.extractDate(text),
          due_time: this.extractTime(text),
          priority: "high",
          status: "pending",
          email_reminder: false,
          remind_before_minutes: null
        };
        
        return this.getNextStep();
      }

    // (b) VIEW TASKS
    if (text.includes("what do i have today") || text.includes("show my tasks") || text.includes("what's on my list")) {
      return {
        action: "view_tasks",
        spoken_reply: "You have a few things pending on your list. I've pulled them up for you.",
        task: null
      };
    }

    // Default Chat
    return {
      action: "chat",
      spoken_reply: "I'm here. What would you like to get done today?",
      task: null
    };
  }

  private handleMissingInfo(text: string): RemiResponse {
    if (!this.pendingTask) return this.reset();

    switch (this.awaitingField) {
      case "date":
        this.pendingTask.due_date = text;
        return this.getNextStep();
      
      case "time":
        this.pendingTask.due_time = text;
        return this.getNextStep();

      case "email_confirm":
        if (text.includes("yes") || text.includes("sure") || text.includes("yeah")) {
            this.pendingTask.email_reminder = true;
            this.pendingTask.remind_before_minutes = 60; // Default 1 hour
            const task = { ...this.pendingTask } as RemiTask;
            this.reset();
            return {
                action: "add_task",
                spoken_reply: `Perfect. I've saved that and I'll send you an email an hour before. You've got this!`,
                task: task
            };
        } else {
            const task = { ...this.pendingTask } as RemiTask;
            this.reset();
            return {
                action: "add_task",
                spoken_reply: `No problem. I've added ${task.name} to your list without an email reminder.`,
                task: task
            };
        }
    }

    return this.reset();
  }

  private getNextStep(): RemiResponse {
    if (!this.pendingTask) return this.reset();

    // Priority Order (Segment 8): Name -> Date -> Time -> Email
    if (!this.pendingTask.name) {
      this.awaitingField = "name";
      return { action: "chat", spoken_reply: "What is the task or event called?", task: null };
    }

    if (!this.pendingTask.due_date) {
      this.awaitingField = "date";
      return { action: "chat", spoken_reply: `When is ${this.pendingTask.name}?`, task: null };
    }

    if (!this.pendingTask.due_time && this.pendingTask.type === "event") {
      this.awaitingField = "time";
      return { action: "chat", spoken_reply: "At what time?", task: null };
    }

    if (this.awaitingField !== "email_confirm") {
      this.awaitingField = "email_confirm";
      return { 
        action: "chat", 
        spoken_reply: "Would you like me to send you a reminder email before this?", 
        task: null 
      };
    }

    // If everything is somehow done but we reached here
    const task = { ...this.pendingTask } as RemiTask;
    this.reset();
    return {
        action: "add_task",
        spoken_reply: `All set! I've added ${task.name} for you.`,
        task: task
    };
  }

  private reset(): RemiResponse {
    this.pendingTask = null;
    this.awaitingField = null;
    return {
      action: "chat",
      spoken_reply: "I'm sorry, I got a bit confused. Let's start over. What can I do for you?",
      task: null
    };
  }

  private extractTaskName(text: string, triggers: string[]): string {
    let result = "";
    for (const trigger of triggers) {
      if (text.includes(trigger)) {
        result = text.split(trigger)[1].trim();
        break;
      }
    }
    if (!result) return "";
    // Remove date/time mentions from name
    return result.split(" on ")[0].split(" at ")[0].split(" tomorrow")[0].split(" today")[0].trim();
  }

  private extractDate(text: string): string | null {
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "tomorrow", "today"];
    for (const day of days) {
      if (text.includes(day)) return day;
    }
    return null;
  }

  private extractTime(text: string): string | null {
    const timeMatch = text.match(/(\d+)\s*(am|pm)/i);
    return timeMatch ? timeMatch[0] : null;
  }
}
