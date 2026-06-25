const MathDatabase = {
  questions: [],
  async init() {
    try {
      const response = await fetch("math-questions.json");
      if (!response.ok) throw new Error("Math database not found.");
      this.questions = await response.json();
      console.log(`Math DB: ${this.questions.length} questions loaded.`);
    } catch (error) {
      console.error("Error loading Math questions:", error);
    }
  },
  getQuestions(difficulty = "all") {
    if (difficulty === "all") return this.questions;
    return this.questions.filter(q => q.difficulty.toLowerCase() === difficulty.toLowerCase());
  }
};
