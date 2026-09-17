/**
 * Indian GSTIN Regex validator:
 * 2 digits state code, 5 chars PAN, 4 digits PAN, 1 char PAN, 1 entity code (1-9A-Z), 'Z', 1 checksum char
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/; // 10 digit Indian mobile number

export function isValidGSTIN(gstin: string): boolean {
  if (!gstin) return true; // optional field
  return GSTIN_REGEX.test(gstin.trim().toUpperCase());
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return EMAIL_REGEX.test(email.trim());
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[\s\-\+]/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 13;
}

export function getIndianStates(): string[] {
  return [
    'Andaman & Nicobar Islands',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chandigarh',
    'Chhattisgarh',
    'Dadra & Nagar Haveli and Daman & Diu',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jammu & Kashmir',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Ladakh',
    'Lakshadweep',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Puducherry',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
  ];
}
