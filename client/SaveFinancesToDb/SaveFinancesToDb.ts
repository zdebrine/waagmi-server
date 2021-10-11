const SaveFinancesToDb = async (
  revenue,
  expenses,
  profits,
  transactions,
  companyId,
  pool
) => {
  pool.query(
    `UPDATE companies SET 
        profits = ${profits}, 
        revenue = ${revenue}, 
        expenses = ${expenses},
        transactions = '${transactions}'
        WHERE company_id = '${companyId}'`,
    (err, data) => {
      if (err) {
        console.log("There was an error adding finances to the DB", err);
        return;
      } else {
        console.log("Added finances to DB");
        return;
      }
    }
  );
};

module.exports = { SaveFinancesToDb };
