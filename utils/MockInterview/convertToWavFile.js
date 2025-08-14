import { createWavHeader } from "./createWavHeader.js";

function parseMimeType(mimeType) {
  const [fileType, ...params] = mimeType.split(";").map((s) => s.trim());
  const [_, format] = fileType.split("/");

  const options = {
    numChannels: 1,
    sampleRate: 24000,
    bitsPerSample: 16,
  };

  if (format && format.startsWith("L")) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) options.bitsPerSample = bits;
  }

  for (const param of params) {
    const [key, value] = param.split("=").map((s) => s.trim());
    if (key === "rate") {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options;
}

export function convertToWav(base64Data, mimeType) {
  try {
    const options = parseMimeType(mimeType);
    const rawBuffer = Buffer.from(base64Data, "base64");
    const wavHeader = createWavHeader(rawBuffer.length, options);
    return Buffer.concat([wavHeader, rawBuffer]);
  } catch (err) {
    console.log("ERROR in conertToWav", err.message);
  }
}
