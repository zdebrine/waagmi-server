const GetUserInvestments = async (ownedAssets, pool, res) => {
  let seedlingInvestments = [];
  pool.query(`SELECT tokenid FROM companies;`, (err, data) => {
    if (err) {
      console.log("There was an error get tokens", err);
      res.send();
    } else {
      data.rows.forEach((seedlingAsset) => {
        ownedAssets.forEach((openseaAsset) => {
          if (seedlingAsset.tokenid === openseaAsset.token_id) {
            seedlingInvestments.push(openseaAsset);
          }
        });
      });
      res.send(seedlingInvestments);
    }
  });
};

module.exports = { GetUserInvestments };
