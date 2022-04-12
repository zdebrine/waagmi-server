require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 3002;
const { pool } = require("./database/config.js");
var cors = require("cors");
const { default: axios } = require("axios");
app.use(cors());
app.use(express.static("./client/dist"));
app.use(express.json());

// app.get("/test", (req, res) => {
//     console.log("bla")
//     // res.send("WOOHOOO")
//     pool.query(
//         `SELECT  "entities".* FROM "entities" WHERE "entities"."id" = 1 LIMIT 2`,
//         (err, data) => {
//             if (err) {
//                 console.log("There was an error getting the user", err);
//                 res.send();
//             } else {
//                 res.status(200).send(data);
//             }
//         }
//     );
// });

app.get("/discounts", (req, res) => {
    pool.query(
        `SELECT * from discounts WHERE shop_id = '${req.query.shopId}';`,
        (err, data) => {
            if (err) {
                console.log("There was an error retireiving the discounts", err);
                res.send();
            } else {
                console.log(data)
                res.send(data.rows)
            }
        }
    );
});

app.delete("/discounts", (req, res) => {
    pool.query(
        `DELETE from discounts WHERE discount_id = '${req.query.id}';`,
        (err, data) => {
            if (err) {
                console.log("There was an error retireiving the discounts", err);
                res.send();
            } else {
                console.log(data)
                res.send(data.rows)
            }
        }
    );
});

app.get("/check-collection", (req, res) => {
    axios.get(`https://testnets-api.opensea.io/api/v1/assets?owner=${req.query.walletId}&order_direction=desc&offset=0`)
        .then((response) => {
            pool.query(
                `SELECT * from discounts WHERE domain = '${req.query.domain}';`,
                (err, data) => {
                    if (err) {
                        console.log("There was an error retireiving the discounts", err);
                        res.send();
                    } else {
                        let holderInfo = []
                        data.rows.map((entity) => {
                            const result = response.data?.assets?.find(({ collection }) => collection.slug === entity.slug)
                            if (!!result) {
                                holderInfo.push(
                                    {
                                        ...entity,
                                        isHolder: !!result
                                    }
                                )
                            }
                        })
                        res.send(holderInfo)
                    }
                }
            );
        })
        .catch((error) => console.log(error))
});

app.post("/create-discount", (req, res) => {
    const discount = Number(req.body.discount)
    axios.get(`https://testnets-api.opensea.io/api/v1/collection/${req.body.slug}`)
        .then((response) => {
            pool.query(
                `INSERT INTO discounts(collection_name, collection_url, slug, is_percent, code, shop_id, discount, domain) VALUES ('${response?.data?.collection?.name || ""}', '${req.body.collectionUrl}', '${req.body.slug}', ${req.body.isPercent}, '${req.body.code}', '${req.body.id}', ${discount}, '${req.body.domain}');`,
                (err, data) => {
                    if (err) {
                        console.log("There was an error adding the discount", err);
                        res.send();
                    } else {
                        res.status(200).send(data);
                    }
                }
            );
        })
        .catch((error) => {
            console.log(error)
            res.send(error)
        })
});

// Listening for requests on the PORT
console.log(`Listening on port ${PORT}`);
app.listen(process.env.PORT || PORT);
