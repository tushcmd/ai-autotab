export async function GET(req) {
  return new Response(JSON.stringify({ message: "API is working" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
