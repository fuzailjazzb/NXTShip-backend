const { Resend } = require("resend");
require("dotenv").config();

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendTicketMail = async ({ to, cc, subject, htmlContent }) => {
    try {
    await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to,
        cc,
        subject,
        html: htmlContent
    });

    console.log(`✅ Ticket email sent to ${to} with subject "${subject}"`);

    if (cc) {
        console.log(`✅ CC'd to: ${cc}`);
    }

    } catch (error) {
        console.error("❌ Error sending ticket email:", error.message);
        throw error; // Rethrow to handle in calling function
    }
};