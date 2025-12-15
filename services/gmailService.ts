

export interface GmailAttachment {
  filename: string;
  base64Data: string; // The raw base64 string, NOT the data URI
  mimeType: string;
}

export const sendGmailWithAttachments = async (
  toEmail: string,
  subject: string,
  bodyText: string,
  attachments: GmailAttachment[]
): Promise<boolean> => {
  const accessToken = sessionStorage.getItem('google_access_token');

  if (!accessToken) {
    throw new Error("No Google Access Token found. Please link your Google account first.");
  }

  // 1. Construct the MIME message
  const boundary = "foo_bar_baz_boundary_12345";
  
  const messageParts = [
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "MIME-Version: 1.0",
    `To: ${toEmail}`,
    `Subject: ${subject}`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "MIME-Version: 1.0",
    "Content-Transfer-Encoding: 7bit",
    "",
    bodyText,
    ""
  ];

  attachments.forEach(att => {
    messageParts.push(`--${boundary}`);
    messageParts.push(`Content-Type: ${att.mimeType}`);
    messageParts.push("Content-Transfer-Encoding: base64");
    messageParts.push(`Content-Disposition: attachment; filename="${att.filename}"`);
    messageParts.push("");
    messageParts.push(att.base64Data);
    messageParts.push("");
  });

  messageParts.push(`--${boundary}--`);

  const mimeMessage = messageParts.join("\r\n");

  // 2. Encode to Base64URL (required by Gmail API)
  const encodedMessage = btoa(mimeMessage)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 3. Call Gmail API
  try {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedMessage
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gmail API Error:", errData);
      throw new Error(`Failed to send email: ${errData.error?.message || response.statusText}`);
    }

    return true;

  } catch (error) {
    console.error("Sending email failed", error);
    throw error;
  }
};