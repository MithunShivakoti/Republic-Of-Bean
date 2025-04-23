export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const pdfFile = formData.get("pdf") as File
    const email = "phanigavara465@gmail.com" // Use fixed email address

    if (!pdfFile) {
      return new Response(JSON.stringify({ error: "No PDF file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const buffer = Buffer.from(await pdfFile.arrayBuffer())

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        pdfBuffer: buffer.toString("base64"),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return new Response(JSON.stringify({ error: errorData.error || "Failed to send email" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error in send-pdf-client route:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
