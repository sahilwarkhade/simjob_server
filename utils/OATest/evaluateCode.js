import axios from "axios";

export async function evaluateCode(submissionPayload) {
  const options = {
    method: "POST",
    url: `https://${process.env.RAPIDAPI_HOST}/submissions/batch`,
    params: {
      base64_encoded: "true",
      wait: "true",
    },
    headers: {
      "content-type": "application/json",
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
    },
    data: { submissions: submissionPayload },
  };

  const submissionResponse = await axios.request(options);
  const tokens = submissionResponse?.data.map((s) => s.token);

  const resultOptions = {
    method: "GET",
    url: `https://${process.env.RAPIDAPI_HOST}/submissions/batch`,
    params: {
      tokens: tokens.join(","),
      base64_encoded: "true",
      fields: "*",
    },
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
    },
  };

  async function pollResults() {
    let results;
    let allDone = false;

    while (!allDone) {
      const resultResponse = await axios.request(resultOptions);
      results = resultResponse.data.submissions;

      allDone = results.every((r) => r.status && r.status.id >= 3);

      if (!allDone) {
        console.log("⏳ Still processing... retrying in 1s");
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return results;
  }

  await pollResults(tokens);

  const resultResponse = await axios.request(resultOptions);
  return resultResponse.data.submissions;
}
