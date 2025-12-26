import nodemailer from "nodemailer";

// Create transporter using environment variables
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Base email template wrapper
const baseTemplate = (content, title = "Abel Wellness") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 10px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #4F46E5;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #4F46E5;
      margin: 0;
      font-size: 24px;
    }
    .content {
      padding: 20px 0;
    }
    .otp-code {
      background-color: #4F46E5;
      color: white;
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      padding: 20px;
      border-radius: 8px;
      letter-spacing: 8px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background-color: #4F46E5;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 15px 0;
    }
    .button:hover {
      background-color: #4338CA;
    }
    .info-box {
      background-color: #F3F4F6;
      border-left: 4px solid #4F46E5;
      padding: 15px;
      margin: 15px 0;
      border-radius: 0 8px 8px 0;
    }
    .warning-box {
      background-color: #FEF3C7;
      border-left: 4px solid #F59E0B;
      padding: 15px;
      margin: 15px 0;
      border-radius: 0 8px 8px 0;
    }
    .success-box {
      background-color: #D1FAE5;
      border-left: 4px solid #10B981;
      padding: 15px;
      margin: 15px 0;
      border-radius: 0 8px 8px 0;
    }
    .footer {
      text-align: center;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #eee;
      padding-top: 20px;
      margin-top: 20px;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .details-table td {
      padding: 10px;
      border-bottom: 1px solid #eee;
    }
    .details-table td:first-child {
      font-weight: 600;
      color: #666;
      width: 40%;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏥 Abel Wellness</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Abel Wellness. All rights reserved.</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// Email Templates
export const emailTemplates = {
  // OTP Email for Patient Login
  otp: (name, code) => ({
    subject: "Your Login Code - Abel Wellness",
    html: baseTemplate(`
      <h2>Hello${name ? `, ${name}` : ""}!</h2>
      <p>Your one-time verification code is:</p>
      <div class="otp-code">${code}</div>
      <div class="warning-box">
        <strong>⚠️ Important:</strong>
        <ul style="margin: 5px 0;">
          <li>This code expires in <strong>10 minutes</strong></li>
          <li>Never share this code with anyone</li>
          <li>Our staff will never ask for this code</li>
        </ul>
      </div>
      <p>If you didn't request this code, please ignore this email.</p>
    `),
  }),

  // Appointment Confirmation (Patient)
  appointmentConfirmation: (patientName, appointmentDetails) => ({
    subject: "Appointment Request Received - Abel Wellness",
    html: baseTemplate(`
      <h2>Hello ${patientName}!</h2>
      <p>We have received your appointment request. Our team will review and confirm it shortly.</p>
      <div class="info-box">
        <h3 style="margin-top: 0;">📅 Appointment Details</h3>
        <table class="details-table">
          <tr>
            <td>Date</td>
            <td>${appointmentDetails.date}</td>
          </tr>
          <tr>
            <td>Time</td>
            <td>${appointmentDetails.time}</td>
          </tr>
          <tr>
            <td>Reason</td>
            <td>${appointmentDetails.reason || "General Consultation"}</td>
          </tr>
        </table>
      </div>
      <p>You will receive another email once your appointment is confirmed with an assigned doctor.</p>
      <p style="text-align: center;">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/patient/dashboard" class="button">View Your Dashboard</a>
      </p>
    `),
  }),

  // Appointment Approved (Patient)
  appointmentApproved: (patientName, appointmentDetails, doctorDetails) => ({
    subject: "Appointment Confirmed! - Abel Wellness",
    html: baseTemplate(`
      <h2>Great news, ${patientName}! 🎉</h2>
      <p>Your appointment has been confirmed and a doctor has been assigned.</p>
      <div class="success-box">
        <h3 style="margin-top: 0;">✅ Appointment Confirmed</h3>
        <table class="details-table">
          <tr>
            <td>Date</td>
            <td>${appointmentDetails.date}</td>
          </tr>
          <tr>
            <td>Time</td>
            <td>${appointmentDetails.time}</td>
          </tr>
          <tr>
            <td>Doctor</td>
            <td>Dr. ${doctorDetails.name}</td>
          </tr>
          ${
            doctorDetails.specialization
              ? `
          <tr>
            <td>Specialization</td>
            <td>${doctorDetails.specialization}</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>
      <div class="info-box">
        <strong>📝 Please remember:</strong>
        <ul style="margin: 5px 0;">
          <li>Arrive 10-15 minutes before your appointment</li>
          <li>Bring any relevant medical records</li>
          <li>Prepare a list of your current medications</li>
        </ul>
      </div>
      <p style="text-align: center;">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/patient/dashboard" class="button">View Appointment</a>
      </p>
    `),
  }),

  // Appointment Rejected (Patient)
  appointmentRejected: (patientName, appointmentDetails, reason) => ({
    subject: "Appointment Update - Abel Wellness",
    html: baseTemplate(`
      <h2>Hello ${patientName},</h2>
      <p>We regret to inform you that your appointment request could not be accommodated.</p>
      <div class="warning-box">
        <h3 style="margin-top: 0;">📅 Appointment Details</h3>
        <table class="details-table">
          <tr>
            <td>Date</td>
            <td>${appointmentDetails.date}</td>
          </tr>
          <tr>
            <td>Time</td>
            <td>${appointmentDetails.time}</td>
          </tr>
        </table>
        <p><strong>Reason:</strong> ${
          reason || "The requested time slot is not available."
        }</p>
      </div>
      <p>We encourage you to book another appointment at a different time.</p>
      <p style="text-align: center;">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/#appointment" class="button">Book New Appointment</a>
      </p>
    `),
  }),

  // Appointment Rescheduled (Patient)
  appointmentRescheduled: (patientName, oldDetails, newDetails) => ({
    subject: "Appointment Rescheduled - Abel Wellness",
    html: baseTemplate(`
      <h2>Hello ${patientName},</h2>
      <p>Your appointment has been rescheduled to a new date and time.</p>
      <div class="warning-box">
        <h3 style="margin-top: 0;">❌ Previous Schedule</h3>
        <p><strong>Date:</strong> ${oldDetails.date} at ${oldDetails.time}</p>
      </div>
      <div class="success-box">
        <h3 style="margin-top: 0;">✅ New Schedule</h3>
        <table class="details-table">
          <tr>
            <td>Date</td>
            <td>${newDetails.date}</td>
          </tr>
          <tr>
            <td>Time</td>
            <td>${newDetails.time}</td>
          </tr>
          ${
            newDetails.doctorName
              ? `
          <tr>
            <td>Doctor</td>
            <td>Dr. ${newDetails.doctorName}</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>
      <p>If this new time doesn't work for you, please contact us or reschedule online.</p>
      <p style="text-align: center;">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/patient/dashboard" class="button">View Dashboard</a>
      </p>
    `),
  }),

  // New Appointment Notification (Admin)
  newAppointmentAdmin: (appointmentDetails) => ({
    subject: "New Appointment Request - Abel Wellness Admin",
    html: baseTemplate(`
      <h2>New Appointment Request 📋</h2>
      <p>A new appointment request has been submitted and requires your attention.</p>
      <div class="info-box">
        <h3 style="margin-top: 0;">Patient Information</h3>
        <table class="details-table">
          <tr>
            <td>Name</td>
            <td>${appointmentDetails.patientName}</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>${appointmentDetails.email}</td>
          </tr>
          <tr>
            <td>Phone</td>
            <td>${appointmentDetails.phone}</td>
          </tr>
          <tr>
            <td>Requested Date</td>
            <td>${appointmentDetails.date}</td>
          </tr>
          <tr>
            <td>Time</td>
            <td>${appointmentDetails.time}</td>
          </tr>
          <tr>
            <td>Reason</td>
            <td>${appointmentDetails.reason || "Not specified"}</td>
          </tr>
        </table>
      </div>
      <p style="text-align: center;">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/admin/appointments" class="button">Review Appointment</a>
      </p>
    `),
  }),

  // Doctor Assignment Notification (Doctor)
  doctorAssignment: (doctorName, appointmentDetails, patientDetails) => ({
    subject: "New Patient Assigned - Abel Wellness",
    html: baseTemplate(`
      <h2>Hello Dr. ${doctorName},</h2>
      <p>A new patient has been assigned to you for consultation.</p>
      <div class="info-box">
        <h3 style="margin-top: 0;">📅 Appointment Details</h3>
        <table class="details-table">
          <tr>
            <td>Date</td>
            <td>${appointmentDetails.date}</td>
          </tr>
          <tr>
            <td>Time</td>
            <td>${appointmentDetails.time}</td>
          </tr>
        </table>
      </div>
      <div class="info-box">
        <h3 style="margin-top: 0;">👤 Patient Information</h3>
        <table class="details-table">
          <tr>
            <td>Name</td>
            <td>${patientDetails.name}</td>
          </tr>
          <tr>
            <td>Age</td>
            <td>${patientDetails.age || "Not provided"}</td>
          </tr>
          <tr>
            <td>Reason</td>
            <td>${patientDetails.reason || "General Consultation"}</td>
          </tr>
        </table>
      </div>
      <p style="text-align: center;">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/doctor/appointments" class="button">View Assignment</a>
      </p>
    `),
  }),

  // Consultation Complete (Admin)
  consultationCompleteAdmin: (doctorName, patientName, appointmentDetails) => ({
    subject: "Consultation Completed - Abel Wellness Admin",
    html: baseTemplate(`
      <h2>Consultation Update 🩺</h2>
      <p>A consultation has been completed and may have prescriptions ready for dispensing.</p>
      <div class="success-box">
        <h3 style="margin-top: 0;">✅ Consultation Details</h3>
        <table class="details-table">
          <tr>
            <td>Patient</td>
            <td>${patientName}</td>
          </tr>
          <tr>
            <td>Doctor</td>
            <td>Dr. ${doctorName}</td>
          </tr>
          <tr>
            <td>Date</td>
            <td>${appointmentDetails.date}</td>
          </tr>
        </table>
      </div>
      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/appointments" class="button">View Details</a>
      </p>
    `),
  }),

  // Prescription Ready (Pharmacist)
  prescriptionReady: (pharmacistName, prescriptionDetails, patientDetails) => ({
    subject: "New Prescription to Dispense - Abel Wellness",
    html: baseTemplate(`
      <h2>Hello ${pharmacistName},</h2>
      <p>A new prescription is ready for dispensing.</p>
      <div class="info-box">
        <h3 style="margin-top: 0;">💊 Prescription Details</h3>
        <table class="details-table">
          <tr>
            <td>Patient</td>
            <td>${patientDetails.name}</td>
          </tr>
          <tr>
            <td>Prescribed By</td>
            <td>Dr. ${prescriptionDetails.doctorName}</td>
          </tr>
          <tr>
            <td>Date</td>
            <td>${prescriptionDetails.date}</td>
          </tr>
          <tr>
            <td>Items</td>
            <td>${prescriptionDetails.itemCount} medication(s)</td>
          </tr>
        </table>
      </div>
      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pharmacist/prescriptions" class="button">View Prescription</a>
      </p>
    `),
  }),

  // Prescription Dispensed (Patient)
  prescriptionDispensed: (patientName, prescriptionDetails) => ({
    subject: "Your Prescription is Ready - Abel Wellness",
    html: baseTemplate(`
      <h2>Hello ${patientName}! 💊</h2>
      <p>Your prescription has been prepared and is ready for pickup.</p>
      <div class="success-box">
        <h3 style="margin-top: 0;">✅ Prescription Ready</h3>
        <p>Your medications have been dispensed by our pharmacy team.</p>
        <table class="details-table">
          <tr>
            <td>Prescription ID</td>
            <td>#${prescriptionDetails.id?.slice(-8).toUpperCase()}</td>
          </tr>
          <tr>
            <td>Medications</td>
            <td>${prescriptionDetails.itemCount} item(s)</td>
          </tr>
        </table>
      </div>
      <div class="info-box">
        <strong>📍 Pickup Information:</strong>
        <p>Please visit our pharmacy counter with a valid ID to collect your medications.</p>
      </div>
      <p style="text-align: center;">
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/patient/prescriptions" class="button">View Prescriptions</a>
      </p>
    `),
  }),

  // Welcome Email (New Patient)
  welcomePatient: (patientName) => ({
    subject: "Welcome to Abel Wellness! 🌟",
    html: baseTemplate(`
      <h2>Welcome, ${patientName}! 🎉</h2>
      <p>Thank you for choosing Abel Wellness for your healthcare needs.</p>
      <p>Your account has been created successfully. You can now:</p>
      <ul>
        <li>📅 Book and manage appointments</li>
        <li>👤 View your medical history</li>
        <li>💊 Track your prescriptions</li>
        <li>📋 Access your health records</li>
      </ul>
      <div class="info-box">
        <strong>🔐 How to Login:</strong>
        <p>We use a secure, password-free login system. Simply enter your email address and we'll send you a one-time code to access your account.</p>
      </div>
      <p style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/patient/login" class="button">Go to Dashboard</a>
      </p>
    `),
  }),
};

// Send email function
export const sendEmail = async (to, template) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Abel Wellness" <${
        process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER
      }>`,
      to,
      subject: template.subject,
      html: template.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Send email to multiple recipients
export const sendBulkEmail = async (recipients, template) => {
  const results = await Promise.allSettled(
    recipients.map((to) => sendEmail(to, template))
  );

  return results.map((result, index) => ({
    email: recipients[index],
    ...(result.status === "fulfilled"
      ? result.value
      : { success: false, error: result.reason }),
  }));
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return { success: true, message: "Email configuration is valid" };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  sendEmail,
  sendBulkEmail,
  emailTemplates,
  verifyEmailConfig,
};
