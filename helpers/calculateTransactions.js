const findProfit = (transactions) => {
  let profit = 0;
  transactions.forEach((transaction) => {
    profit += transaction.amount;
  });
  return profit.toFixed(2);
};
const findRevenue = (transactions) => {
  let revenue = 0;
  transactions.forEach((transaction) => {
    if (Math.sign(transaction.amount) === 1) {
      revenue += transaction.amount;
    }
  });
  return revenue.toFixed(2);
};
const findExpenses = (transactions) => {
  let expenses = 0;
  transactions.forEach((transaction) => {
    if (Math.sign(transaction.amount) === -1) {
      expenses += transaction.amount;
    }
  });
  if (Math.sign(expenses) === -1) {
    return (expenses.toFixed(2) * -1);
  } else {
    return expenses.toFixed(2)
  }
};

module.exports = { findProfit, findRevenue, findExpenses };
