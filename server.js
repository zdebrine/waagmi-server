require("dotenv").config();
const express = require("express");
const app = express();
const PORT = 3002;
// const { pool } = require("./database/config.js");
var cors = require("cors");
app.use(cors());
app.use(express.static("./client/dist"));
app.use(express.json());


app.get("/test", (req, res) => {
    res.send("WOOHOOO")
    // pool.query(
    //     `SELECT * FROM users WHERE user_id = ${req.query.userId}`,
    //     (err, data) => {
    //         if (err) {
    //             console.log("There was an error getting the user", err);
    //             res.send();
    //         } else {
    //             res.status(200).send(data);
    //         }
    //     }
    // );
});

// Listening for requests on the PORT
console.log(`Listening on port ${PORT}`);
app.listen(process.env.PORT || PORT);
