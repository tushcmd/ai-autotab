export async function POST(req) {
  const { text } = await req.json();

  try {
    // Use Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Complete the following text naturally: "${text}"`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 100,
          },
        }),
      },
    );

    const data = await response.json();

    // Extract the completion text from Gemini's response format
    const completion = data.candidates[0]?.content?.parts[0]?.text || "";

    return new Response(
      JSON.stringify({
        completion: completion,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // For development only
        },
      },
    );
  } catch (error) {
    console.error("Gemini API error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to get completion",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // For development only
        },
      },
    );
  }
}
