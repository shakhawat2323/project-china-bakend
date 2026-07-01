import nodemailer from "nodemailer";
import config from "../../config";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: config.emailSender.email,
        pass: config.emailSender.app_pass,
    },
});

export const sendEmail = async (
    to: string,
    subject: string,
    html: string
) => {
    await transporter.sendMail({
        from: `"SysPCB" <${config.emailSender.email}>`,
        to,
        subject,
        html,
    });
};

export const sendInquiryNotification = async (inquiryData: {
    fullName: string;
    email: string;
    companyName?: string;
    description: string;
}) => {
    const adminEmail = config.super_admin.email || "admin@syspcb.com";
    const html = `
        <h2>New Inquiry Received</h2>
        <p><strong>Name:</strong> ${inquiryData.fullName}</p>
        <p><strong>Email:</strong> ${inquiryData.email}</p>
        <p><strong>Company:</strong> ${inquiryData.companyName || "N/A"}</p>
        <p><strong>Description:</strong></p>
        <p>${inquiryData.description}</p>
    `;

    await sendEmail(adminEmail, `New Inquiry from ${inquiryData.fullName}`, html);
};

export const sendInquiryReply = async (
    to: string,
    customerName: string,
    replyMessage: string
) => {
    const html = `
        <h2>Response to Your Inquiry</h2>
        <p>Dear ${customerName},</p>
        <p>${replyMessage}</p>
        <br/>
        <p>Best regards,</p>
        <p>SysPCB Engineering Team</p>
        <p>Wuping Feitian Electronic Technology Company Limited</p>
    `;

    await sendEmail(to, "Response to Your PCB Inquiry - SysPCB", html);
};
