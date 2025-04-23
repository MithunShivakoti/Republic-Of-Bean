import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Static email configuration with updated credentials
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
      // Disable options that may cause issues in serverless environments
      ignoreTLS: false,
      tls: {
        rejectUnauthorized: false,
      },
    })

    // Convert base64 to buffer, handling both formats (with or without data URL prefix)
    let base64Data = pdfBase64
    if (base64Data.includes(",")) {
      base64Data = base64Data.split(",")[1]
    }

    const pdfBuffer = Buffer.from(base64Data, "base64")

    // Send email with PDF attachment
    await transporter.sendMail({
      from: `"Republic of Bean" <${EMAIL_USER}>`,
      to: "phanigavara465@gmail.com",
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

    console.log("Email sent successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
