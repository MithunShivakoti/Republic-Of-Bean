import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Static email configuration
const EMAIL_HOST = "smtp.gmail.com"
const EMAIL_PORT = 587
const EMAIL_SECURE = false
const EMAIL_USER = "republicofbean@gmail.com"
const EMAIL_PASSWORD = "lprj qnqd bvop cniv"

export async function POST(request: Request) {
  try {
    const { pdfBase64, fileName } = await request.json()

    if (!pdfBase64) {
      return NextResponse.json({ error: "PDF data is required" }, { status: 400 })
    }

    // Create a nodemailer transporter with direct configuration to avoid DNS lookup
    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_SECURE,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
      // Disable DNS lookup which is causing issues in the serverless environment
      ignoreTLS: true,
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64.split(",")[1] || pdfBase64, "base64")

    // Send email with PDF attachment
    await transporter.sendMail({
      from: `"Republic of Bean" <${EMAIL_USER}>`,
      to: "aturan@asu.edu",
      subject: "Republic of Bean - Simulation Results",
      text: "Please find attached the simulation results from a Republic of Bean participant.",
      html: "<p>Please find attached the simulation results from a Republic of Bean participant.</p>",
      attachments: [
        {
          filename: fileName || "republic-of-bean-results.pdf",
          content: pdfBuffer,
        },
      ],
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
