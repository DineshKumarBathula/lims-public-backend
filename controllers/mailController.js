// const nodemailer = require("nodemailer");

// const sendOrderEmail = async (toEmail, customerName, orderNumber) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER, // e.g., yourcompany@gmail.com
//       pass: process.env.EMAIL_PASS, // app-specific password
//     },
//   });

//   const mailOptions = {
//     from: `"KDM Engineers Group" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: `Order ${orderNumber} Received`,
//     html: `
//       <p>Dear ${customerName},</p>
//       <p>Your order <strong>${orderNumber}</strong> has been received successfully.</p>
//       <p>Reports will be delivered within 7 working days.</p>
//       <p>Thank you,<br/>KDM Engineers Group</p>
//     `,
//   };

//   await transporter.sendMail(mailOptions);
// };

// module.exports = { sendOrderEmail };

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // set this in your .env

const sendOrderEmail = async (
  toEmail,
  customerName,
  orderNumber,
  reportLines,
  buffer,
) => {
  const msg = {
    to: toEmail,
    from: {
      email: process.env.SENDGRID_VERIFIED_EMAIL,
      name: "KDM Engineers Group",
    },
    templateId: process.env.SENDGRID_TEMPLATE_ID,
    dynamic_template_data: {
      customer_name: customerName,
      order_number: orderNumber,
      reportLines: reportLines,
      subject: `Order Confirmation - ID:${orderNumber}`,
    },
    headers: {
      "X-Custom-Message-ID": `order-${orderNumber}-${Date.now()}`,
    },

    attachments: [
      {
        content: buffer.toString("base64"),
        filename: `proforma-invoice-${orderNumber}.pdf`,
        type: "application/pdf",
        disposition: "attachment",
      },
    ],
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent via SendGrid");
  } catch (error) {
    console.error("❌ Email failed:", error.response?.body || error);
    throw error;
  }
};

module.exports = { sendOrderEmail };
