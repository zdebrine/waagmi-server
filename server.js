require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 3002;
const { pool } = require("./database/config.js");
const findAccount = require("./helpers/findAccount.js");
const { findRevenue, findProfit, findExpenses } = require("./helpers/calculateTransactions.js");
const stripe = require("stripe")(process.env.STRIPE_TOKEN);
var cors = require("cors");
const Web3 = require("web3");
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
    basePath: PlaidEnvironments.sandbox,
    baseOptions: {
        headers: {
            'PLAID-CLIENT-ID': process.env.PLAID_CLIENT,
            'PLAID-SECRET': process.env.PLAID_SANDBOX_SECRET,
        },
    },
});

const plaidClient = new PlaidApi(configuration);

const axios = require("axios");
const moment = require("moment");
const { CreatePlaidToken } = require("./client/CreatePlaidToken/CreatePlaidToken.ts");
const { AddPlaidTokenToDatabase } = require("./client/AddPlaidTokenToDatabase/AddPlaidTokenToDatabase.ts");

app.use(cors());
app.use(express.static("./client/dist"));
app.use(express.json());

app.get("/create_plaid_token", async (req, res) => {
    const response = await CreatePlaidToken(req, res, plaidClient)
    return response
});

app.get("/user-assets", async (req, res) => {
    const url = `https://api.opensea.io/api/v1/assets?owner=${req.query.walletId}&order_direction=desc&offset=0`
    axios.get(url).
        then((response) => {
            res.send(response.data.assets)
        }).catch(error => console.log(error))
});

app.get("/bank_transactions", async (req, res) => {
    let plaidResponse;
    const public_token = req.query.publicToken
    if (public_token) {
        plaidResponse = await plaidClient.itemPublicTokenExchange({ public_token: public_token });
        AddPlaidTokenToDatabase(plaidResponse.data.access_token, req.query.companyId)
    }
    const access_token = req.query.accessToken || plaidResponse.data.access_token;
    const now = moment();
    const today = now.format('YYYY-MM-DD');
    const thirtyDaysAgo = now.subtract(30, 'days').format('YYYY-MM-DD');

    console.log("public", public_token)
    console.log("acc", access_token)

    const response = await plaidClient.transactionsGet({
        access_token,
        start_date: thirtyDaysAgo,
        end_date: today,
    });
    const transactions = response.data.transactions;
    const responseBody = {
        revenue: findRevenue(transactions),
        profits: findProfit(transactions),
        expenses: findExpenses(transactions),
        transactions: transactions
    }
    res.send(responseBody)
});

//===============================
// ACCEPT A COMPANY AFTER REVIEW
//===============================

app.put("/accept-company", (req, res, next) => {
    if (req.query.pw === "sheldon") {
        pool.query(
            `UPDATE companies SET active_fundraise = true WHERE business_name = '${req.body.companyName}'`,
            (err, data) => {
                if (err) {
                    console.log(
                        "There was an error getting the requested info -- accept-company",
                        err
                    );
                    res.send();
                } else {
                    res.status(200).send(data);
                }
            }
        );
    } else {
        res.status(500).send("Permission error");
    }
});

//===========================================
// GET COMPANY INFORMATION FOR SIGNED IN USER
//===========================================

app.get("/company-profile", (req, res, next) => {
    pool.query(
        `SELECT * FROM companies WHERE company_id = ${req.query.companyId}`,
        (err, data) => {
            if (err) {
                console.log(
                    "There was an error getting the requested info --company-profile",
                    err
                );
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.get("/users-companies", (req, res, next) => {
    pool.query(
        `SELECT * FROM companies WHERE user_id = (SELECT user_id from users WHERE sub_id = '${req.query.subId}');`,
        (err, data) => {
            if (err) {
                console.log(
                    "There was an error getting the requested info --company-list",
                    err
                );
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.get("/company-profile-wallet", (req, res, next) => {
    pool.query(
        `SELECT * FROM companies WHERE wallet_id = '${req.query.walletId}';`,
        (err, data) => {
            if (err) {
                console.log(
                    "There was an error getting the requested info wallet-id-for-user",
                    err
                );
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

//==================
// GET Active COMPANIES
//==================

app.get("/companies", (req, res, next) => {
    pool.query(
        `SELECT * FROM companies WHERE active_fundraise = true;`,
        (err, data) => {
            if (err) {
                console.log(
                    "There was an error getting the requested company info",
                    err
                );
                res.send();
            } else {
                res.status(200).send(data.rows);
            }
        }
    );
});

app.get("/all-companies", (req, res, next) => {
    pool.query(`SELECT * FROM companies;`, (err, data) => {
        if (err) {
            console.log("There was an error getting the requested company info", err);
            res.send();
        } else {
            res.status(200).send(data.rows);
        }
    });
});

app.delete("/companies", (req, res, next) => {
    pool.query(
        `DELETE FROM companies WHERE company_id = '${req.query.companyId}';`,
        (err, data) => {
            if (err) {
                console.log(
                    "There was an error getting the requested company info",
                    err
                );
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

//=====================
// GET CURRENT COMPANY
//=====================

app.get("/company-info", (req, res, next) => {
    pool.query(
        `SELECT * FROM companies WHERE company_id = ${req.query.companyID}`,
        (err, data) => {
            if (err) {
                console.log(
                    "There was an error getting the requested info company-info",
                    err
                );
                res.send();
            } else {
                res.status(200).send(data.rows);
            }
        }
    );
});

//=========================================
// GET USER INFORMATION FOR SIGNED IN USER
//=========================================

app.get("/user-profile", async (req, res) => {
    let subId = req.query.subId;

    pool.query(`SELECT * FROM users WHERE sub_id = '${subId}';`, (err, data) => {
        if (err) {
            console.log("There was an error getting user's information", err);
            res.send();
        } else {
            res.status(200).send(data);
        }
    });
});

//==============
// GET ALL USERS
//==============

app.get("/users", async (req, res) => {
    let userID = req.query.userID;
    pool.query(`SELECT * FROM users;`, (err, data) => {
        if (err) {
            console.log(
                "There was an error getting the requested info list of users",
                err
            );
            res.send();
        } else {
            res.status(200).send(data);
        }
    });
});

//=========================================
// GET INVESTMENT INFO FOR SIGNED IN USER
//=========================================

app.get("/investor-profile", async (req, res) => {
    let userID = req.query.userID;
    let query = `SELECT * FROM investments INNER JOIN companies ON investments.company_id = companies.company_id WHERE investments.user_id = (SELECT user_id from users WHERE sub_id = '${userID}');`;
    pool.query(query, (err, data) => {
        if (err) {
            console.log(
                "There was an error getting the requested info investor-profile",
                err
            );
            res.send();
        } else {
            res.status(200).send(data);
        }
    });
});

//================================
// CREATE CONNECTED STRIPE ACCOUNT
//================================

app.post("/connected-account", async (req, res, next) => {
    const account = await stripe.accounts.create({
        type: "express",
    });
    const accountLinks = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: "https://www.useseedling.com/",
        return_url: "https://www.useseedling.com/",
        type: "account_onboarding",
    });
    const update = await stripe.accounts.update(account.id, {
        settings: {
            payouts: {
                schedule: {
                    interval: "manual",
                },
            },
        },
    });
    res.send(accountLinks.url);
});

//=====================================
// ADD STRIPE ACCOUNT ID TO USER IN DB
//=====================================

app.put("/stripe-profile", async (req, res, next) => {
    let email = req.query.email;
    const accounts = await stripe.accounts.list();
    const accountID = await findAccount(accounts.data, email);
    pool.query(
        `UPDATE users SET stripe_id = '${accountID}' WHERE email = '${email}'`,
        (err, data) => {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                res.status(200).send(data);
            }
        }
    );
});

//==================================================
// GET BALANCE OF CONNECTED ACCOUNT GIVEN STRIPE ID
//==================================================

app.get("/account-balance", async (req, res) => {
    let accountID = req.query.accountID;
    const balance = await stripe.balance.retrieve({
        stripeAccount: `${accountID}`,
    });
    res.send(balance);
});

//========================================
// ADD USER TO DATABASE WHEN THEY SIGN UP
//========================================

app.post("/user", (req, res) => {
    const fullName = `${req.body.firstName} ${req.body.lastName}`;
    const phone = req.body.phone || null;
    const address = req.body.address || null;
    const query = `INSERT INTO users(
    name,
    first_name,
    last_name,
    email,
    phone,
    address, 
    instagram,
    linkedin
    ) VALUES(
    '${fullName}',
    '${req.body.firstName}',
    '${req.body.lastName}',
    '${req.body.email}',
    '${phone}',
    '${address}',
    '${req.body.instagram}',
    '${req.body.linkedin}'
    ) ON CONFLICT (email) DO UPDATE SET phone = '${phone}', address = '${address}';`;
    pool.query(query, (err, data) => {
        if (err) {
            res.send(err);
            console.log("Error adding user", err);
        } else {
            res.status(200).send(data);
        }
    });
});

//==================================================
// ADD COMPANY INFO TO DATABASE WHEN FORM FILLED OUT
//==================================================

app.post("/company-profile", (req, res) => {
    let query = `INSERT INTO companies(
    user_id,
    business_name,
    website,
    short_description,
    previous_profits,
    fundraising_goal,
    estimated_profits,
    end_date,
    use_of_funds,
    profits_allocated,
    active_fundraise
    ) 
    VALUES( 
    (SELECT user_id FROM users WHERE email = '${req.body.email}'),
    '${req.body.companyName}',
    '${req.body.companyWebsite}',
    '${req.body.oneSentenceDescription}',
    ${req.body.actualProfits},
    ${req.body.fundingGoal},
    ${req.body.estimatedProfits},
    '${req.body.endDate}',
    '${req.body.useOfFunds}',
    '${req.body.profitsAllocated}',
    false);`;
    pool.query(query, (err, data) => {
        if (err) {
            res.send(err);
            console.log("Error adding company", err);
        } else {
            res.status(200).send(data);
        }
    });
});

// app.post("/company-profile", (req, res) => {
//   let query = `INSERT INTO companies(
//     // wallet_id,
//     business_name,
//     website,
//     ein,
//     short_description,
//     demo_video,
//     previous_profits,
//     fundraising_goal,
//     estimated_profits,
//     end_date,
//     profits_allocated,
//     use_of_funds,
//     investor_perks,
//     active_fundraise
//     )
//     VALUES(
//     '${req.body.walletId}',
//     '${req.body.companyName}',
//     '${req.body.companyWebsite}',
//     '${req.body.ein}',
//     '${req.body.oneSentenceDescription}',
//     '${req.body.explainerVideo}',
//     ${req.body.actualProfits},
//     ${req.body.fundingGoal},
//     ${req.body.estimatedProfits},
//     '${req.body.endDate}',
//     ${req.body.profitsAllocated},
//     '${req.body.useOfFunds}',
//     '${req.body.investorPerks}',
//     false);`;
//   pool.query(query, (err, data) => {
//     if (err) {
//       res.send(err);
//       console.log("Error adding company", err);
//     } else {
//       res.status(200).send(data);
//     }
//   });
// });

//=================================================================================
// ALLOCATE INVESTMENT PAYMENTS TO COMPANY OWNER AND SEEDLING WHEN INVESTMENT MADE
//=================================================================================

app.post("/create-investment-intent", async (req, res) => {
    const customer = await stripe.customers.create();
    let accountID = req.body.accountID;
    let amount = req.body.amount;
    const paymentIntent = await stripe.paymentIntents.create({
        payment_method_types: ["card"],
        amount: amount,
        currency: "usd",
        application_fee_amount: Math.floor(amount * 0.029 + 60 + amount * 0.02),
        transfer_data: {
            destination: accountID,
        },
    });
    res.send({
        clientSecret: paymentIntent.client_secret,
    });
});

//======================================================
// POST TO INVESTMENTS TABLE WHEN AN INVESTMENT IS MADE
//======================================================

app.post("/investment", (req, res) => {
    let email = req.query.email;
    let companyId = req.query.companyId;
    let rewardId = req.query.rewardId;
    let amount = req.query.amount;
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, "0");
    let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    let yyyy = today.getFullYear();
    today = yyyy + "-" + mm + "-" + dd;
    let query = `INSERT INTO investments(date, amount, user_id, company_id, reward_id) VALUES('${today}', ${amount}, (SELECT user_id FROM users WHERE email = '${email}'), ${companyId}, ${rewardId});`;
    pool.query(query, (err, data) => {
        if (err) {
            res.send(err);
            console.log("Error logging investment", err);
        } else {
            res.status(200).send(data);
        }
    });
});

//=================================================
// GET ALL INVESTMENTS MADE FOR A SPECIFIC COMPANY
//=================================================

app.get("/investment", (req, res, next) => {
    let companyId = req.query.companyId;
    let query = `SELECT * FROM investments 
  INNER JOIN users ON investments.user_id = users.user_id 
  INNER JOIN rewards ON investments.reward_id = rewards.id 
  WHERE investments.company_id = ${companyId};`;
    pool.query(query, (err, data) => {
        if (err) {
            console.log(
                "There was an error getting the requested info list of investments",
                err
            );
            res.send();
        } else {
            res.status(200).send(data);
        }
    });
});

//=======================================================
// CREATE PAYMENT INTENT WHEN COMPANY OWNER MAKES PAYOUT
//=======================================================

app.post("/create-payment-intent", async (req, res) => {
    const customer = await stripe.customers.create();
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
        customer: customer.id,
        setup_future_usage: "off_session",
        amount: req.body.amount,
        currency: "usd",
        transfer_group: req.body.group,
    });
    res.send({
        clientSecret: paymentIntent.client_secret,
    });
});

//===================================================
// ALLOCATE PAYMENTS WHEN COMPANY OWNER MAKES PAYOUT
//===================================================

app.post("/allocate-payments", async (req, res) => {
    let investors = req.body.investors;
    let totalPayabale = req.body.amount - (req.body.amount * 0.025 + 0.3);

    investors.map(async (investor) => {
        let transfer = await stripe.transfers.create({
            amount:
                ((investor.amount / req.body.fundraisingGoal) * totalPayabale).toFixed(
                    2
                ) * 100,
            currency: "usd",
            destination: investor.stripe_id,
            transfer_group: req.body.businessName,
        });
    });
    res.send("Investors paid");
});

//==============================================
// POST TO PAYOUTS TABLE WHEN AN PAYOUT IS MADE
//==============================================

app.post("/payout", (req, res) => {
    let pnlStatement = req.query.pnl;
    let company = req.query.company;
    let amount = req.query.amount;
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, "0");
    let mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    let yyyy = today.getFullYear();
    today = yyyy + "-" + mm + "-" + dd;
    let query = `INSERT INTO payouts(date, amount, pnl, company_id) VALUES('${today}', ${amount}, '${pnlStatement}', (SELECT company_id FROM companies WHERE business_name = '${company}'));`;
    pool.query(query, (err, data) => {
        if (err) {
            res.send(err);
            console.log("Error logging investment", err);
        } else {
            res.status(200).send(data);
        }
    });
});

//==========================================
// GET APP PAYOUT INFORMATION FOR A COMPANY
//==========================================

app.get("/payouts", (req, res, next) => {
    pool.query(
        `SELECT * FROM payouts WHERE company_id = (SELECT company_id FROM companies WHERE business_name = '${req.query.company}');`,
        (err, data) => {
            if (err) {
                console.log(
                    "There was an error getting the requested info payouts",
                    err
                );
                res.send();
            } else {
                res.status(200).send(data.rows);
            }
        }
    );
});

app.get("/transfers", async (req, res) => {
    let accountID = req.query.accountID;
    const transfers = await stripe.transfers.list({
        destination: accountID,
    });
    res.send(transfers.data);
});

//=========================
// DELETE CONNECTED ACCOUNT
//=========================

app.post("/delete-connected", async (req, res) => {
    let account = req.query.accountID;

    const deleted = await stripe.accounts.del(account);
    res.send("Account Deleted");
});

app.get("/stripe-user", async (req, res) => {
    const account = await stripe.accounts.retrieve(req.query.accountID);
    res.send(account);
});

//==============================
// ADD IMAGE TO COMPANY PROFILE
//==============================

app.put("/add-data", (req, res) => {
    pool.query(
        `UPDATE ${req.body.tableName} SET ${req.body.columnName} = '${req.body.data}' WHERE ${req.body.columnReference} = '${req.body.reference}';`,
        (err, data) => {
            if (err) {
                console.log("There was an error adding image", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.put("/add-plaid-token", (req, res) => {
    pool.query(
        `UPDATE companies SET plaid_token = '${req.body.plaidToken}' WHERE company_id = '${req.body.companyId}';`,
        (err, data) => {
            if (err) {
                console.log("There was an error adding image", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.put("/fundraiser-page", (req, res) => {
    pool.query(
        `UPDATE companies SET fundraiser_markdown = '${req.body.markdown}' WHERE business_name = '${req.body.company}'`,
        (err, data) => {
            if (err) {
                console.log("There was an error updating the markdown", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.put("/update-profile", (req, res) => {
    pool.query(
        `UPDATE companies SET 
    business_name = '${req.body.company}', 
    website = '${req.body.website}', 
    short_description = '${req.body.description}' ,
    fundraiser_markdown = '${req.body.fundraiser_markdown}'
    WHERE company_id = '${req.body.companyId}'`,
        (err, data) => {
            if (err) {
                console.log("There was an error updating the user's profile", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.put("/add-token", (req, res) => {
    pool.query(
        `UPDATE companies SET 
    contractaddress = '${req.body.contract}', 
    tokenid = '${req.body.token}' 
    WHERE business_name = '${req.body.company}'`,
        (err, data) => {
            if (err) {
                console.log("There was an error adding the token address", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.put("/add-column", (req, res) => {
    pool.query(
        `ALTER TABLE ${req.body.tableName} ADD ${req.body.columnName} ${req.body.type};`,
        (err, data) => {
            if (err) {
                console.log("There was an error adding a column", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

// app.put("/add-table", (req, res) => {
//   pool.query(
//     `CREATE TABLE updates (
//       id serial PRIMARY KEY,
// 	    title VARCHAR NOT NULL,
// 	    body VARCHAR NOT NULL,
// 	    date DATE NOT NULL
//    );`,
//     (err, data) => {
//       if (err) {
//         console.log("There was an error adding the table", err);
//         res.send();
//       } else {
//         res.status(200).send(data);
//       }
//     }
//   );
// });

app.put("/edit-column", (req, res) => {
    pool.query(`ALTER TABLE users ADD UNIQUE (email);`, (err, data) => {
        if (err) {
            console.log("There was an error editing the column", err);
            res.send();
        } else {
            res.status(200).send(data);
        }
    });
});

app.get("/hex", (req, res) => {
    const totalPayoutHash = Web3.utils.numberToHex(req.query.weiAmount);
    res.send(totalPayoutHash);
});

app.get("/open-sea", (req, res) => {
    const options = {
        method: "GET",
        qs: { order_direction: "desc", offset: "0", limit: "20" },
    };
    axios
        .get("https://api.opensea.io/api/v1/assets", options)
        .then((response) => {
            res.send(response);
        })
        .catch((err) => res.send(err));
});

//===============
// CHAT LOGIC 💬
//===============

//==================
// CREATE CHANNEL 💬
//==================

//=================
// POST MESSAGE 💬
//=================

app.post("/messages", (req, res) => {
    pool.query(
        `INSERT INTO messages(
      message,
      wallet_id,
      channel_id
      ) VALUES(
      '${req.body.message}',
      '${req.body.walletId}',
      '${req.body.tokenId}'
      );`,
        (err, data) => {
            if (err) {
                console.log("There was an error posting a message", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

//========================
// GET CHANNEL MESSAGES 💬
//========================

app.get("/messages", (req, res) => {
    pool.query(
        `SELECT * FROM messages WHERE channel_id = '${req.query.tokenId}';`,
        (err, data) => {
            if (err) {
                console.log("There was an error getting the messages", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

//=====================
// GET COMPANY UPDATES
//=====================

app.get("/updates", (req, res) => {
    pool.query(
        `SELECT * FROM updates WHERE company_id = '${req.query.companyId}';`,
        (err, data) => {
            if (err) {
                console.log("There was an error getting the updates", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

//=====================
// POST COMPANY UPDATES
//=====================
app.post("/updates", (req, res) => {
    pool.query(
        `INSERT INTO updates(
      title,
      body,
      date,
      company_id
      ) VALUES(
      '${req.body.title}',
      '${req.body.body}',
      '${req.body.date}',
      '${req.body.companyId}'
      );`,
        (err, data) => {
            if (err) {
                console.log("There was an error posting the update", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.get("/rewards", (req, res) => {
    pool.query(
        `SELECT * FROM rewards WHERE company_id = ${req.query.companyId};`,
        (err, data) => {
            if (err) {
                console.log("There was an error getting the rewards from the DB", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.post("/rewards", (req, res) => {
    pool.query(
        `INSERT INTO rewards(
      image_url,
      name,
      description,
      variants,
      company_id,
      price,
      cost
      ) VALUES (
      '${req.body.imageUrl}',
      '${req.body.name}',
      '${req.body.description}',
      '${req.body.variants}',
      '${req.body.companyId}',
      ${req.body.price},
      ${req.body.cost}
      );`,
        (err, data) => {
            if (err) {
                console.log("There was an error posting the reward from the DB", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.put("/rewards", (req, res) => {
    pool.query(
        `UPDATE rewards 
    SET image_url = '${req.body.imageUrl}',
    name = '${req.body.name}',
    description = '${req.body.description}',
    variants = '${req.body.variants}',
    company_id = '${req.body.companyId}',
    price = ${req.body.price},
    cost = ${req.body.cost}
    WHERE id = ${req.body.rewardId};`,
        (err, data) => {
            if (err) {
                console.log("There was an error posting the reward from the DB", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.delete("/rewards", (req, res) => {
    pool.query(
        `DELETE FROM rewards WHERE id = ${req.query.rewardId};`,
        (err, data) => {
            if (err) {
                console.log("There was an error posting the reward from the DB", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.delete("/users", (req, res) => {
    pool.query(
        `DELETE FROM users WHERE user_id = ${req.query.userId};`,
        (err, data) => {
            if (err) {
                console.log("There was an error deleting the user", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

app.delete("/investments", (req, res) => {
    pool.query(
        `DELETE FROM investments WHERE investment_id = ${req.query.investmentId};`,
        (err, data) => {
            if (err) {
                console.log("There was an error deleting the user", err);
                res.send();
            } else {
                res.status(200).send(data);
            }
        }
    );
});

// Listening for requests on the PORT
console.log(`Listening on port ${PORT}`);
app.listen(process.env.PORT || PORT);
