import { SpeechClient } from '@google-cloud/speech';

const client = new SpeechClient();

export function createRecognitionStream(onTranscription, onError, onEnd) {
  const recognitionStream = client
    .streamingRecognize({
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 48000,
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        interimResults: true,
      },
    })
    .on('error', (err) => {
      onError(err);
    })
    .on('data', (data) => {
      const result = data.results[0];
      if (result?.alternatives[0]) {
        console.log("TRANS :: ", result.alternatives[0].transcript)
        onTranscription({
          transcript: result.alternatives[0].transcript,
          isFinal: result.isFinal,
        });
      }
    })
    .on('end', () => {
      // This event fires when the stream has been successfully closed from our side via `stream.end()`.
      onEnd();
    });

  return recognitionStream;
}