import nodemailer from "nodemailer";
import config from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: config.email.host || 'smtp.gmail.com',
  port: config.email.port || 587,
  secure: false,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export default transporter;

export const sendMail = async ({
  to,
  subject,
  text,
  html
}) => {
  try {
    const info = await transporter.sendMail({
      from: `"Gombe Market Support" <${config.email.user}>`,
      to,
      subject,
      text,
      html
    });

    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Mail Error:", error);
    throw error;
  }
};