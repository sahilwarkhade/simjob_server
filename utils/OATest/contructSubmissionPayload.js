export function contructSubmissionPayload(testCases, sourceCode, languageId) {
  return testCases.map((testCase) => {
    const input = testCase.input || "";
    const expectedOutput = testCase.expectedOutput || "";

    return {
      language_id: languageId,
      source_code: Buffer.from(sourceCode).toString("base64"),
      stdin: Buffer.from(input).toString("base64"),
      expected_output: Buffer.from(expectedOutput.trim()).toString("base64"),
    };
  });
}
