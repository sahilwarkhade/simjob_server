// Email template function for SimJob SaaS contact form
export const generateContactEmail = (
  email,
  fullName,
  subject,
  query,
  message
) => {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Form Submission</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f4f4f4;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4; padding: 20px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">SimJob</h1>
                    <p style="margin: 5px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">New Contact Form Submission</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    
                    <!-- Query Type Badge -->
                    <div style="margin-bottom: 25px;">
                      <span style="display: inline-block; background-color: #667eea; color: #ffffff; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${query}
                      </span>
                    </div>
                    
                    <!-- Contact Details -->
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 120px; font-weight: bold; color: #374151; font-size: 14px;">Name:</td>
                              <td style="color: #6b7280; font-size: 14px;">${fullName}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 120px; font-weight: bold; color: #374151; font-size: 14px;">Email:</td>
                              <td style="color: #6b7280; font-size: 14px;">
                                <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                            <tr>
                              <td style="width: 120px; font-weight: bold; color: #374151; font-size: 14px;">Subject:</td>
                              <td style="color: #6b7280; font-size: 14px;">${subject}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Message -->
                    <div style="margin-bottom: 20px;">
                      <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px; font-weight: bold;">Message:</h3>
                      <div style="background-color: #f9fafb; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px;">
                        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                      </div>
                    </div>
                    
                    <!-- Action Button -->
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="mailto:${email}?subject=Re: ${encodeURIComponent(
    subject
  )}" 
                         style="display: inline-block; background-color: #667eea; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; font-size: 14px;">
                        Reply to ${fullName}
                      </a>
                    </div>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      This email was sent from the SimJob contact form
                    </p>
                    <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                      Received on ${new Date().toLocaleString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZoneName: "short",
                      })}
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
};
