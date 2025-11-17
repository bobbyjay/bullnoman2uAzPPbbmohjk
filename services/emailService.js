const axios = require("axios");

async function getZohoAccessToken() {
  try {
    const response = await axios.post(
      "https://accounts.zoho.com/oauth/v2/token",
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: "refresh_token"
        }
      }
    );

    return response.data.access_token;
  } catch (err) {
    console.error("❌ Failed to refresh Zoho access token:", err.response?.data || err);
    throw new Error("Could not refresh Zoho access token");
  }
}

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const accessToken = await getZohoAccessToken();

    const response = await axios.post(
      "https://mail.zoho.com/api/accounts/{accountId}/messages", 
      {
        fromAddress: process.env.EMAIL_FROM,
        toAddress: to,
        subject,
        content: html,
        mailFormat: "html"
      },
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );

    console.log("📧 Email sent:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Email send error:", err.response?.data || err);
    throw err;
  }
};