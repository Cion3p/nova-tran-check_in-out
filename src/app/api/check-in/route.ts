import { NextRequest, NextResponse } from "next/server";

// The target PHP API endpoint
const TARGET_API_URL = "https://datacenter.novamodular.co.th/api/check_in-out.php";

export async function POST(request: NextRequest) {
  try {
    // Get the FormData from the client
    const formData = await request.formData();

    // Forward the FormData to the target PHP script
    const response = await fetch(TARGET_API_URL, {
      method: "POST",
      body: formData,
      // Headers might not be needed if the PHP script doesn't strictly check Content-Type for multipart/form-data
      // The browser/fetch API usually sets the boundary automatically.
    });

    // Check if the external API responded successfully
    if (!response.ok) {
      // Try to get error message from the external API's response body
      const errorBody = await response.text();
      console.error(`External API Error: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json(
        { error: `Request to external API failed: ${errorBody || response.statusText}` },
        { status: response.status }
      );
    }

    // Get the response from the PHP script (assuming it returns JSON)
    const result = await response.json();

    // Send the response back to our client
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("API Route Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}
