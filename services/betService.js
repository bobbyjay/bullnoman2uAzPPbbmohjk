exports.calculatePotentialWin = (stake, odds) => {
  // Basic multiplication; more complex may handle commissions, margins, etc.
  return Number((stake * odds).toFixed(2));
};
