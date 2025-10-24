import fs from "fs/promises"

export async function loadTestCases(testCases) {
  if (testCases.length <= 0) {
    throw new Error("You should provide valid test cases array");
  }

  const results = await Promise.all(
    testCases.map(async (tc) => {
      const [input, output] = await Promise.all([
        fs.readFile(tc.inputPath, "utf-8"),
        fs.readFile(tc.outputPath, "utf-8"),
      ]);

      return {
        input,
        expectedOutput: output,
      };
    })
  );

  return results;
}
