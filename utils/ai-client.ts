import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI("AIzaSyCWsROMklmIF9qGz9b3DgnHXWbupES_8bo");

const BIO_PROMPT = `Generate a concise fitness profile bio (max 100 characters).
- Focus on the user's fitness journey and goals
- Keep it personal and motivational
- Use natural, conversational language
- If text is in quotes, create a new bio about that topic
- If not in quotes, improve the existing bio`;

const QUOTE_PROMPT = `Generate a short, impactful fitness motivational quote (max 50 characters).
- Make it brief and memorable
- Focus on fitness and motivation
- Keep it original (avoid common quotes)
- If text is in quotes, create a quote about that topic
- If not in quotes, improve the existing quote`;

const WORKOUT_TITLE_PROMPT = `Generate a concise and engaging workout progress title (max 60 characters).
- Make it specific to the workout type
- Include key achievements or milestones
- Keep it motivational and engaging
- If text is in quotes, create a title about that topic
- If not in quotes, improve the existing title`;

const WORKOUT_DESCRIPTION_PROMPT = `Generate a detailed workout progress description (max 200 characters).
- Include specific exercises and achievements
- Highlight personal records or improvements
- Use natural, engaging language
- If text is in quotes, create a description about that topic
- If not in quotes, improve the existing description`;

const PROGRESS_DETAILS_PROMPT = `Generate relevant progress tracking details for a workout.
Return ONLY a valid JSON array with objects containing detail_type (string), value (number), and unit (string).
Do not include any markdown formatting, code blocks, or additional text.
Base the details on the workout description provided.

Rules:
1. ALWAYS generate 2-4 different metrics
2. Make metrics contextual to the workout type:
   - For strength: weight, reps, sets, form rating
   - For cardio: distance, time, speed, heart rate
   - For nutrition: calories, protein, carbs, water
   - For measurements: weight, body fat, circumference
   - For achievements: previous best, new record, improvement %

3. Format values appropriately:
   - Use realistic numbers
   - For percentages: use number with "%" unit
   - For weights: use number with "kg" or "lbs"
   - For ratings: use 1-10 with "points" unit
   - For time: use number with "minutes" or "seconds"

Example format (return exactly like this):
[{"detail_type":"Bench Press Weight","value":185,"unit":"lbs"},{"detail_type":"Form Rating","value":9,"unit":"points"},{"detail_type":"Improvement","value":15,"unit":"%"}]`;

export async function generateOrImproveBio(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error("Please enter some text to generate or improve a bio");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const isNewBioRequest = input.startsWith('"') && input.endsWith('"');
    const promptText = isNewBioRequest
      ? `${BIO_PROMPT}\n\nGenerate a bio about: ${input}`
      : `${BIO_PROMPT}\n\nImprove this bio: ${input}`;

    const result = await model.generateContent(promptText);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating bio:", error);
    throw new Error("Failed to generate bio. Please try again.");
  }
}

export async function generateOrImproveQuote(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error("Please enter some text to generate or improve a quote");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const isNewQuoteRequest = input.startsWith('"') && input.endsWith('"');
    const promptText = isNewQuoteRequest
      ? `${QUOTE_PROMPT}\n\nGenerate a quote about: ${input}`
      : `${QUOTE_PROMPT}\n\nImprove this quote: ${input}`;

    const result = await model.generateContent(promptText);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating quote:", error);
    throw new Error("Failed to generate quote. Please try again.");
  }
}

export async function generateWorkoutTitle(input: string): Promise<string> {
  if (!input.trim()) {
    throw new Error("Please enter some text to generate or improve a title");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const isNewTitleRequest = input.startsWith('"') && input.endsWith('"');
    const promptText = isNewTitleRequest
      ? `${WORKOUT_TITLE_PROMPT}\n\nGenerate a title about: ${input}`
      : `${WORKOUT_TITLE_PROMPT}\n\nImprove this title: ${input}`;

    const result = await model.generateContent(promptText);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating title:", error);
    throw new Error("Failed to generate title. Please try again.");
  }
}

export async function generateWorkoutDescription(
  input: string
): Promise<string> {
  if (!input.trim()) {
    throw new Error(
      "Please enter some text to generate or improve a description"
    );
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const isNewDescRequest = input.startsWith('"') && input.endsWith('"');
    const promptText = isNewDescRequest
      ? `${WORKOUT_DESCRIPTION_PROMPT}\n\nGenerate a description about: ${input}`
      : `${WORKOUT_DESCRIPTION_PROMPT}\n\nImprove this description: ${input}`;

    const result = await model.generateContent(promptText);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating description:", error);
    throw new Error("Failed to generate description. Please try again.");
  }
}

export async function generateProgressDetails(input: string): Promise<
  Array<{
    detail_type: string;
    value: number;
    unit: string;
  }>
> {
  if (!input.trim()) {
    throw new Error("Please enter some text to generate progress details");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const promptText = `${PROGRESS_DETAILS_PROMPT}\n\nGenerate details for this workout: ${input}\n\nNote: Return ONLY the JSON array. No explanations or text.`;

    const result = await model.generateContent(promptText);
    let responseText = result.response.text().trim();

    // Remove any markdown code block formatting if present
    responseText = responseText.replace(/```json\n?|\n?```/g, "");

    try {
      const response = JSON.parse(responseText);
      if (!Array.isArray(response) || response.length < 2) {
        throw new Error("Invalid response format or insufficient details");
      }

      // Validate and clean each detail object
      return response.map((detail) => {
        if (!detail || typeof detail !== "object") {
          throw new Error("Invalid detail object");
        }

        const detailType = String(detail.detail_type || "").trim();
        let value =
          typeof detail.value === "number"
            ? detail.value
            : parseFloat(detail.value);
        const unit = String(detail.unit || "").trim();

        if (!detailType || isNaN(value) || !unit) {
          throw new Error("Invalid detail object structure");
        }

        // Handle percentage values consistently
        if (unit === "%" && value > 1) {
          value = Math.round(value); // Round to whole number for percentages
        }

        return {
          detail_type: detailType,
          value: value,
          unit: unit,
        };
      });
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Response:", responseText);
      throw new Error("Failed to parse AI response. Please try again.");
    }
  } catch (error) {
    console.error("Error generating details:", error);
    throw new Error("Failed to generate progress details. Please try again.");
  }
}
