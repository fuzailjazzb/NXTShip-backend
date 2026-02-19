const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.sendTicketMail = async (to, subject, message) => {
    await transporter.sendMail({
        from: "NXTShip Support <${process.env.EMAIL_USER}>",
        to,
        subject,
        html: `
            <h2>Support Ticket Created Successfully</h2>
            <p>Dear Customer,</p>
            <p>Your support ticket has been created with the following details:</p>
            <p>${message}</p>
            <p>Our support team will get back to you shortly.</p>
            <p>Best Regards,<br/>NXTShip Support Team</p>
        `,
    });
};