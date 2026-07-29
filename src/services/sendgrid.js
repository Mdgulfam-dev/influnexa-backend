import https from "https";

function sendGridRequest(payload) {
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: "api.sendgrid.com",
      path: "/v3/mail/send",
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
    }, (response) => {
      let body = "";
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        if (response.statusCode >= 200 && response.statusCode < 300) return resolve();
        return reject(new Error(`SendGrid returned ${response.statusCode}: ${body}`));
      });
    });
    request.on("error", reject);
    request.write(JSON.stringify(payload));
    request.end();
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

export async function sendApplicationStatusEmail(application) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return { sent: false, skipped: true };
  }

  const candidateName = escapeHtml(application.name);
  const jobTitle = escapeHtml(application.jobTitle);
  const status = escapeHtml(application.status);
  const fromName = process.env.SENDGRID_FROM_NAME || "Influnexa Careers";
  const subject = `Update on your ${application.jobTitle} application`;
  const text = `Hello ${application.name},\n\nYour application for ${application.jobTitle} (${application.jobId}) has been updated to: ${application.status}.\n\nThank you for your interest in Influnexa.\n\nInflunexa Careers`;
  const html = `<p>Hello ${candidateName},</p><p>Your application for <strong>${jobTitle}</strong> (${escapeHtml(application.jobId)}) has been updated to: <strong>${status}</strong>.</p><p>Thank you for your interest in Influnexa.</p><p>Influnexa Careers</p>`;

  await sendGridRequest({
    personalizations: [{ to: [{ email: application.email }], subject }],
    from: { email: fromEmail, name: fromName },
    content: [{ type: "text/plain", value: text }, { type: "text/html", value: html }],
  });

  return { sent: true, skipped: false };
}
