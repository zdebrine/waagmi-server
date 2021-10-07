const { pool } = require("../../database/config.js");
const AddPlaidTokenToDatabase = (plaidToken, companyId) => {
  pool.query(
    `UPDATE companies SET plaid_token = '${plaidToken}' WHERE company_id = '${companyId}';`,
    (err, data) => {
      if (err) {
        console.log(
          "There was an error adding the access token to the DB",
          err
        );
        return err;
      } else {
        console.log("Added token to database", plaidToken);
        return data;
      }
    }
  );
};

module.exports = { AddPlaidTokenToDatabase };
