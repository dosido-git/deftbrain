// Free text people type (suggestions) can carry account, card or phone
// numbers. Any run of 7+ digits (spaces, dots, dashes allowed between them)
// is replaced before the text is logged or emailed. Years and prices survive.
function scrubNumbers(text) {
  return String(text || '').replace(/\d(?:[\s.-]?\d){6,}/g, '[number removed]');
}
module.exports = { scrubNumbers };
