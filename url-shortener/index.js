require('dotenv').config();
const express = require("express");
const url = require('url').URL;
const cors = require('cors');
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const dns = require('dns');
const port = 3000;

//  Mongoose config
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let urlSchema = new mongoose.Schema({ url: { type: String, required: true }, short: Number });
let Url = mongoose.model('Url', urlSchema);

//  Express config
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static(__dirname + '/public'));

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
})

app.route("/api/shorturl/:url?")
    .post(async (req, res) => {
        const url = req.body.url;
        const urlObject = new URL(url);
        dns.lookup(urlObject.hostname, async (err, address, family) => {
            //  URL is invalid
            if (err) {
                res.json({ "error": 'invalid url' });
            // URL is valid
            } else {
                let result;
                // Get last item
                let lastAdded = await Url.findOne({}).sort({ _id: -1 }).limit(1);
                // Last item exists: this is the next one
                if (lastAdded !== null) {
                    result = await Url.create({ url: url, short: lastAdded.short + 1 });
                // No last item: this is the first one
                } else {
                    result = await Url.create({ url: url, short: 1 });
                }
                res.json({ "original_url": result.url, "short_url": result.short });
            }
        })
    })
    .get(async (req, res) => {
        let reqUrl = await Url.findOne({ short: req.params.url });
        //  Redirects to found URL
        res.redirect(reqUrl.url);
    })

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})