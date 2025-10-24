export const practiceOATestFeedbackTemplate = (
  candidateName,
  difficulty,
  userSelectedSections,
  score,
  overallFeedbackSummary
) => {
  const formattedSections = userSelectedSections.join(", ");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Practice Test Feedback</title>
  </head>
  <body
    style="
      font-family: 'Inter', Arial, sans-serif;
      background-color: #f5f7fa;
      margin: 0;
      padding: 0;
      color: #333;
    "
  >
    <table
      align="center"
      border="0"
      cellpadding="0"
      cellspacing="0"
      width="100%"
      style="max-width: 600px; background-color: #ffffff; margin: 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);"
    >
      <!-- Header -->
      <tr>
        <td
          align="center"
          style="background-color: #4f46e5; padding: 24px 0; color: #ffffff;"
        >
          <h1 style="margin: 0; font-size: 22px;">Your Practice Test Feedback</h1>
        </td>
      </tr>

      <!-- Greeting -->
      <tr>
        <td style="padding: 24px;">
          <p style="font-size: 16px; margin: 0 0 16px;">
            Hi <strong>${candidateName}</strong>,
          </p>
          <p style="font-size: 15px; line-height: 1.6; margin: 0;">
            Great job completing your <strong>${difficulty}</strong> Practice Online Assessment!  
            Here's your detailed feedback summary to help you identify strengths and areas for improvement.
          </p>
        </td>
      </tr>

      <!-- Summary Section -->
      <tr>
        <td style="padding: 0 24px 24px;">
          <table
            width="100%"
            cellpadding="8"
            cellspacing="0"
            style="background-color: #f9fafb; border-radius: 8px; margin-top: 16px;"
          >
            <tr>
              <td><strong>Difficulty:</strong></td>
              <td>${difficulty}</td>
            </tr>
            <tr>
              <td><strong>Sections:</strong></td>
              <td>${formattedSections}</td>
            </tr>
            <tr>
              <td><strong>Score:</strong></td>
              <td>${score} / 10</td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Feedback Content -->
      <tr>
        <td style="padding: 0 24px 24px;">
          <h3 style="color: #111827;">Overall Feedback Summary</h3>
          <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
            ${overallFeedbackSummary}
          </p>
        </td>
      </tr>

      <!-- Call to Action -->
      <tr>
        <td align="center" style="padding: 16px 24px 40px;">
          <a
            href="http://localhost:5173/dashboard"
            style="
              background-color: #4f46e5;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 28px;
              border-radius: 8px;
              font-weight: 500;
              display: inline-block;
            "
            >View Detailed Performance</a
          >
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td
          align="center"
          style="font-size: 13px; color: #6b7280; padding: 16px 24px; border-top: 1px solid #e5e7eb;"
        >
          <p style="margin: 0;">
            © ${new Date().getFullYear()}  <strong>SimJob</strong> — Practice. Learn. Succeed.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
