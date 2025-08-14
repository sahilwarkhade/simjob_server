export function sendAudioResponse(res, audioBuffer, nextQuestionId, isLastQuestion) {
    res.set({
      "Content-Type": "audio/wav",
      "Content-Length": audioBuffer.length,
      "X-Next-Question-ID": nextQuestionId,
      "X-Last-Question": isLastQuestion,
    });
    return res.send(audioBuffer);
  }