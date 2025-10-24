export function generateStoryForDsaProblem(companyName, input) {
  return `You are an expert problem designer specializing in creating engaging narratives for technical assessments.

Your task is to transform a given JSON array of abstract Data Structures and Algorithms (DSA) problems into an array of creative, story-based problems.

**INSTRUCTIONS:**

1.  **Analyze the Input:** You will be given a JSON array of objects. Each object represents a DSA problem and contains a 'slug', 'title', and 'description'.
2.  **Generate a "Flavor Text" Story:** For each problem in the input array, create a short, creative, and engaging story or theme. This story should provide a narrative context for the problem.
3.  **DO NOT CHANGE THE CORE LOGIC:** The story is for flavor and context **only**. It must not alter the underlying logic, constraints, or goal of the original problem described in the input 'description'. The original problem must still be solvable with the same algorithm.
4.  **Preserve the 'slug':** The 'slug' for each problem must be preserved exactly as it was in the input.
5.  **Output a Valid JSON Array:** Your entire response must be a single, valid JSON array. Each object in the output array must correspond to an object in the input array and must contain three keys: 'slug', 'title' (the new story-based title), and 'description' (the new story-based description). Do not include any text, explanations, or markdown formatting outside of the JSON array.

**INPUT DATA:**
Here is the JSON array of abstract DSA problems:
${input}
EXPECTED OUTPUT EXAMPLE (Your response must follow this exact format):
[
  {
    "slug": "two-sum",
    "title": "Secret Agent Pair-Up",
    "description": "You are an intelligence operative who has intercepted a list of agent codenames, which are actually integers. Your mission, should you choose to accept it, is to find two agents whose codenames sum up to a critical 'target' value. Return the indices of these two agents in the list."
  },
  {
    "slug": "min-cost-to-connect-all-points",
    "title": "Galactic Network Optimization",
    "description": "As the lead network engineer for a new star cluster, you've been given the coordinates of several planets. To establish a communication network, you must connect all planets with hyperspace relays. Given the coordinates, calculate the minimum total length of relay cable (using manhattan distance) required to ensure every planet is connected."
  },
  {
    "slug": "number-of-islands",
    "title": "Archipelago Discovery",
    "description": "A satellite has provided you with a binary map of a new ocean region, where '1' represents land and '0' represents water. An 'island' is a group of connected landmasses. Analyze the map and report the total number of distinct archipelagos (islands) you have discovered."
  }
]
Now, process the provided INPUT DATA and generate the response.`}
