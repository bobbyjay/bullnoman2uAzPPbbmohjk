// Stub - replace with real provider (SendGrid, SES, etc) in production
module.exports = {
  send: async (to, subject, html) => {
    console.log('Sending email to', to, subject);
    // integrate provider here
    return true;
  }
};
