require('dotenv').config();
const { sendBroadcastEmail } = require('./utils/nodemailerEmail');

const runTest = async () => {
  console.log('Sending custom apology emails...');

  const emails = [
    'akankshak.ug23.ee@nitp.ac.in',
    'prathamraj2411@gmail.com',
    'adityamadhav1509@gmail.com'
  ];

  const subject = 'apology';
  
  // The sendBroadcastEmail function already prepends "Hi {recipientName}," 
  // so we skip "Dear Akanksha Ma'am," to avoid double greetings.
  const htmlMessage = `
    <p>Greetings from the CEO's office of NIT Patna Marketplace.</p>
    <p>After a detailed internal review, we discovered that our CEO made an unfortunate remark by calling you "gussail." While the intention was only to tease you affectionately, we understand that the words may have hurt your feelings. For that, we offer our sincerest apology.</p>
    <p>Please note that this statement does not reflect the official opinion of NIT Patna Marketplace. In fact, our research department has concluded that you are simply someone who values respect, speaks honestly, and expresses emotions genuinely. Unfortunately, our CEO failed to communicate that properly.</p>
    <p>As a corrective measure, the CEO has been instructed to:</p>
    <ul>
      <li>Think twice before speaking.</li>
      <li>Compliment you more often.</li>
      <li>Never use words that make you feel bad.</li>
      <li>Work overtime until he earns back your smile.</li>
    </ul>
    <p>We genuinely regret making you feel hurt. Your smile is worth far more than winning any argument, and seeing you upset was never the intention.</p>
    <p>We hope you'll consider accepting this apology and allow us the opportunity to improve our services—and perhaps the CEO as well.</p>
    <p>With sincere apologies,<br>Aditya Madhav Singh<br>CEO, NIT Patna Marketplace</p>
    <p><em>P.S. The CEO respectfully requests that the management reconsider the current "angry mode." The office functions much better when you're smiling.</em></p>
  `;

  for (const email of emails) {
    console.log(`Sending to ${email}...`);
    // Passing "Akanksha Ma'am" as the recipient name so it starts with "Hi Akanksha Ma'am,"
    const result = await sendBroadcastEmail(email, "Akanksha Ma'am", subject, htmlMessage);
    
    if (result.success) {
      console.log(`✅ Successfully sent to ${email}`);
    } else {
      console.error(`❌ Failed to send to ${email}:`, result.error);
    }
  }

  process.exit(0);
};

runTest();
