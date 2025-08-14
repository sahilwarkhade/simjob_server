export function feedbackPrompt(candidateRole, interviewType, answers) {
  return `You are a senior and thoughtful interviewer tasked with providing constructive and encouraging feedback to a candidate who recently completed a **${interviewType} mock interview** for the role of **${candidateRole}**.

The feedback should feel like it is coming from a human interviewer, and should serve as a summary of their overall performance — combining insights across all their answers. This is for the candidate’s own reference, so it should be both honest and helpful.

Below are the questions asked and feedback already provided individually:

${answers
  .map(
    (answer, idx) =>
      `Q${idx + 1}: ${answer?.question_text}\nFeedback: ${
        answer?.answerFeedback
      }\n`
  )
  .join("\n")}

---

Now, based on the above, generate a **comprehensive and personalized performance summary** that the candidate can use to reflect and improve.

Follow this format:

---

**Overall Impression:**  
Summarize how the candidate performed overall in the mock interview. Cover both **technical ability** and **communication style** — including clarity, tone, confidence, and structure. Use a conversational tone, and aim for 2–3 natural-sounding sentences.

**Strengths:**  
- Identify 2–3 key strengths the candidate showed.  
- These could include strong technical knowledge, clear thinking, calm delivery, good structure, or relevant examples.

**Areas for Improvement:**  
- Gently point out 2–3 specific areas where the candidate can grow.  
- Include actionable suggestions — both technical (e.g., “revisit system design trade-offs”) and non-technical (e.g., “practice more structured communication”).

**Recommendations:**  
Offer constructive advice:  
- What should the candidate do next to improve?  
- Suggest specific areas to review, or habits to develop for stronger future performance.

---

The tone should be human, balanced, and growth-oriented — as if guiding the candidate after a real mock interview to help them get better for the next one.
`;
}

// // quantative analysis
// export function feedbackPrompt(candidateRole, interviewType, answers) {
//   return `You are a thoughtful, senior-level interviewer providing professional, constructive, and encouraging feedback to a candidate who just completed a **${interviewType} mock interview** for the role of **${candidateRole}**.

// Below are the individual questions and the feedback already given:

// ${answers
//   .map(
//     (answer, idx) =>
//       `Q${idx + 1}: ${answer?.question_text}\nFeedback: ${
//         answer?.answerFeedback
//       }\n`
//   )
//   .join("\n")}

// ---

// Now, based on the above, generate a comprehensive summary of the candidate’s overall performance in the mock interview. This feedback is for the candidate’s personal growth and preparation, so it should be human, honest, encouraging, and actionable.

// Follow the format below **strictly**:

// ---

// **Performance Scores (out of 5):**

// - Technical Knowledge: [Score]  
// - Communication Clarity: [Score]  
// - Confidence & Delivery: [Score]  
// - Problem-Solving Approach: [Score]  
// - Overall Structure & Coherence: [Score]

// ---

// **Overall Impression:**  
// Write 2–3 conversational sentences summarizing how the candidate performed overall — combining technical skill, clarity of thought, confidence, tone, and how well-structured their answers were. Be natural and human in tone.

// **Strengths:**  
// - List 2–3 things the candidate did particularly well.  
// - Be specific and tie strengths to actual performance (e.g., “Your explanation of CAP theorem was clear and confident”).

// **Areas for Improvement:**  
// - Mention 2–3 areas that need attention.  
// - These could be technical gaps, hesitation in delivery, or unclear structuring.  
// - Provide actionable suggestions for how to improve.

// **Recommendations:**  
// Offer final advice — such as:  
// - Whether the candidate would be ready for a real interview.  
// - Specific topics to practice.  
// - Tips on improving communication or confidence.

// ---

// Avoid repeating verbatim individual feedback. Instead, synthesize the overall tone and performance into this holistic summary. Imagine you are coaching the candidate to do better in their next real interview.`;
// }
