export function introductionPrompt(role, typeOfInterview, numberOfQuestions) {
  return `<speak>
    <s>Hello! I'm Mira, and I'll be conducting your interview today. It's a pleasure to meet you.</s>
    <break time="600ms"/>

    <s>This session is designed to help us get to know you better in the context of the <prosody rate="slow">${role}</prosody> role.</s>
    <s>We'll be focusing primarily on <prosody rate="slow">${typeOfInterview}</prosody> topics relevant to the position.</s>
    <break time="500ms"/>

    <s>In total, you'll be asked <prosody pitch="+2%">${numberOfQuestions}</prosody> questions, thoughtfully crafted to explore your technical knowledge, communication, and problem-solving abilities.</s>
    <s>Each question is an opportunity for you to showcase your approach, experience, and insights.</s>
    <break time="500ms"/>

    <s>There's no need to rush — take your time to gather your thoughts before responding.</s>
    <s>This is a space for you to think out loud, explain your reasoning, and share how you tackle challenges.</s>
    <break time="600ms"/>

    <s>If at any point you're unsure, feel free to approach the question the way you would in a real-life scenario.</s>
    <s>We’re here to understand how you think and communicate, not just what you know.</s>
    <break time="600ms"/>

    <s>Alright, let’s get started.</s>
    <break time="400ms"/>

    <s>Can you begin by telling me a little bit about yourself?</s>
</speak>`;
}
