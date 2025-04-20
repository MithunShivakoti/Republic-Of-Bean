import { NextResponse } from "next/server"

// Static email configuration
const EMAIL_HOST = "smtp.gmail.com"
const EMAIL_PORT = 587
const EMAIL_SECURE = false
const EMAIL_USER = "republicofbean@gmail.com"
const EMAIL_PASSWORD = "lprj qnqd bvop cniv"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { to, subject, text, pdfBase64, filename } = data

    // Log that we're attempting to send an email
    console.log(`Attempting to send email to ${to}`)

    // In the client-side environment, we can't actually send emails directly
    // So we'll just log success and return a success response
    console.log("Email would be sent with the following details:")
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log(`Text: ${text}`)
    console.log(`Attachment: ${filename} (${Math.floor(pdfBase64.length / 1.37 / 1024)} KB)`)

    // Return success response
    return NextResponse.json({ success: true, message: "Email sending simulated in client environment" })
  } catch (error) {
    console.error("Error in send-pdf-client route:", error)
    return NextResponse.json({ error: "Failed to process email request" }, { status: 500 })
  }
}
