const API_URL = 'http://localhost:8000';

export const apiService = {
  async chat(transcript, history, tasks = []) {
    try {
      console.log("--- apiService: sending POST /chat ---");
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          history,
          tasks
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("--- apiService: Backend responded ---", data);
      return data;
    } catch (error) {
      console.error("apiService ERROR:", error);
      throw error;
    }
  },
};
