import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  try {
    const { email, subject, message, pdfBase64, fileName } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 })
    }

    // Use direct SMTP configuration to avoid DNS lookup
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // Direct IP or hostname
      port: 465,
      secure: true, // Use SSL
      auth: {
        user: process.env.GMAIL_USER || "republicofbean@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD || "lprj qnqd bvop cniv",
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
      },
    })

    // Prepare email options
    const mailOptions = {
      from: `"Republic of Bean" <${process.env.GMAIL_USER || "republicofbean@gmail.com"}>`,
      to: email,
      subject: subject || "Republic of Bean - Simulation Results",
      text: message || "Please find attached your Republic of Bean simulation results.",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4a5568; text-align: center;">Republic of Bean</h1>
          <p>Thank you for participating in the Republic of Bean simulation.</p>
          <p>Please find attached your simulation results. We hope you found this experience valuable and educational.</p>
          <p>If you have any questions or feedback, please contact us.</p>
          <div style="margin-top: 30px; padding: 15px; background-color: #f7fafc; border-radius: 5px; text-align: center;">
            <p style="margin: 0; color: #718096; font-size: 14px;">Republic of Bean - Parliamentary Simulation</p>
          </div>
        </div>
      `,
    }

    // Add PDF attachment if provided
    if (pdfBase64) {
      try {
        // Convert base64 to buffer, handling both formats
        let base64Data = pdfBase64
        if (base64Data.includes(",")) {
          base64Data = base64Data.split(",")[1]
        }

        const pdfBuffer = Buffer.from(base64Data, "base64")

        mailOptions.attachments = [
          {
            filename: fileName || "republic-of-bean-results.pdf",
            content: pdfBuffer,
          },
        ]
      } catch (error) {
        console.error("Error processing PDF attachment:", error)
        return NextResponse.json({ error: "Failed to process PDF attachment" }, { status: 500 })
      }
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.messageId)

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
