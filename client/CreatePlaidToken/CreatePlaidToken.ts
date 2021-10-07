const request = {
  user: {
    client_user_id: "user-id",
  },
  client_name: "Seedling",
  products: ["auth", "transactions"],
  country_codes: ["US"],
  language: "en",
  webhook: "https://sample-web-hook.com",
  account_filters: {
    depository: {
      account_subtypes: ["checking", "savings"],
    },
  },
};
const CreatePlaidToken = async (req, res, plaidClient) => {
  try {
    const response = await plaidClient.linkTokenCreate(request);
    const linkToken = response.data.link_token;
    res.status(200).send(linkToken);
  } catch (error) {
    res.status(500).send();
  }
};

module.exports = { CreatePlaidToken };
