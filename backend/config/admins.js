const ADMIN_EMAILS = [
  'prathamraj2411@gmail.com',
  'adityamadhav1509@gmail.com',
  'gautamprimary5@gmail.com',
];

const ADMIN_PHONES = [
  '8877396175',
  '7808519486',
];

const normalizePhone = (phone) => {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
};

const isAdminEmail = (email) => {
  const e = String(email || '').toLowerCase().trim();
  const envAdmins = process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',').map((s) => s.trim().toLowerCase())
    : [];
  return ADMIN_EMAILS.includes(e) || envAdmins.includes(e);
};

const isAdminPhone = (phone) => {
  const cleaned = normalizePhone(phone);
  if (!cleaned) return false;
  const envPhones = process.env.ADMIN_PHONES
    ? process.env.ADMIN_PHONES.split(',').map((s) => normalizePhone(s))
    : [];
  return ADMIN_PHONES.includes(cleaned) || envPhones.includes(cleaned);
};

const isAdmin = (user) => {
  if (!user) return false;
  if (user.role === 'admin' || user.isAdmin === true) return true;
  if (user.phone && isAdminPhone(user.phone)) return true;
  if (user.email && isAdminEmail(user.email)) return true;
  return false;
};

module.exports = {
  ADMIN_EMAILS,
  ADMIN_PHONES,
  isAdminEmail,
  isAdminPhone,
  isAdmin,
  normalizePhone,
};
