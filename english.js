const EnglishDatabase = {
  questions: [],
  async init() {
    try {
      const response = await fetch("english-questions.json");
      if (!response.ok) throw new Error("English database not found.");
      this.questions = await response.json();
      console.log(`English DB: ${this.questions.length} questions loaded.`);
    } catch (error) {
      console.error("Error loading English questions:", error);
    }
  },
  getQuestions(difficulty = "all") {
    if (difficulty === "all") return this.questions;
    return this.questions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
  }
};
