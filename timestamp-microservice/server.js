const express = require("express");
const cors = require('cors')
const app = express();
const port = 3000;

app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static(process.cwd() + '/public'));

app.get("/", (req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
})

app.get("/api/:date?", (req, res) => {
    const reqDate = req.params.date;
    let result, utc, unix;
    // Date was provided
    if (reqDate !== undefined) {
        // Not Unix
        if (reqDate.split("-").length > 1 || reqDate.split(" ").length > 1) {
            unix = Math.floor(new Date(reqDate).getTime());
            utc = new Date(reqDate).toUTCString();
            result = { "unix": unix, "utc": utc };
        // Unix
        } else {
            unix = parseInt(reqDate);
            utc = new Date(unix).toUTCString();
            result = { "unix": unix, "utc": utc };
        }
        // No date provided
    } else {
        unix = Date.now()
        utc = new Date(unix).toUTCString();
        result = { "unix": unix, "utc": utc };
    }
    // Check invalid dates
    if (result.unix === "Invalid Date" | result.utc === "Invalid Date") {
        result = { error: "Invalid Date" };
    }
    res.json(result);
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})