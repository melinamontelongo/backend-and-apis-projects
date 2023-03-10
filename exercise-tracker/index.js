require('dotenv').config();
const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const port = 3000;

//  Mongoose config
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
let userSchema = new mongoose.Schema({ username: { type: String, required: true } });
let exerciseSchema = new mongoose.Schema({ userId: { type: String, required: true }, description: String, duration: Number, date: String });

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model("Exercise", exerciseSchema);

//  Express config
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.use(cors({ optionsSuccessStatus: 200 }));
app.use(express.static(__dirname + '/public'));

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/views/index.html');
})

app.route("/api/users")
    .post(async (req, res) => {
        const username = req.body.username;
        let result;
        try {
            result = await User.create({ username: username });
            res.json({ "username": result.username, "_id": result._id });
        }
        catch (e) {
            console.log(e)
            res.json({ error: "cannot save user" });
        }
    })
    .get(async (req, res) => {
        try {
            result = await User.find();
            res.json(result);
        }
        catch (e) {
            console.log(e)
            res.json({ error: "cannot get users" });
        }
    })


app.post("/api/users/:_id/exercises", async (req, res) => {
    const userId = req.params._id;
    let { description, duration, date } = req.body
    let user, userExercises, newExercise;
    try {
        //  Set current date if no date is provided
        date == "" ? date = new Date() : date = new Date(date);
        //  Create new document
        newExercise = await Exercise.create({
            userId: userId,
            description: description,
            duration: parseInt(duration),
            date: date.toDateString()
        })
/*         userExercises = await Exercise.find({ userId: userId }, { _id: 0, userId: 0, __v: 0 }); */
        user = await User.findById(userId);
        res.json({ "_id": user._id, "username": user.username, "date": newExercise.date, "duration": newExercise.duration, "description": newExercise.description });
    } catch (e) {
        console.log(e)
        res.json({ "error": "something went wrong" });
    }
});

app.get("/api/users/:id/logs", async (req, res) => {
    //  Request
    const userId = req.params.id;
    let { from, to, limit } = req.query;

    let exerciseLog;
    let response = {};

    //  Find user
    let user = await User.findById(userId, { __v: 0 });
    if (!user) res.json({ "error": "user not found" });

    try {
        //  Set a default limit if none was provided
        limit ? limit : limit = 100;
        exerciseLog = await Exercise.find({ userId: userId }, { _id: 0, userId: 0, __v: 0 }).limit(limit);
        //  User fields
        response = { ...user._doc };
        //  Date queries were given
        if (from || to) {
            //  Convert to date format and set from/to keys or defaults
            from ? (from = new Date(from), response["from"] = new Date(from).toDateString()) : from = new Date(0);
            to ? (to = new Date(to), response["to"] = new Date(to).toDateString()) : to = new Date();
            //  Convert to unix so they can be compared
            from = from.getTime();
            to = to.getTime();
            //  Filtering by dates
            exerciseLog = exerciseLog.filter((log) => {
                let exerciseDate = new Date(log.date).getTime();
                //  Return within given range
                return exerciseDate >= from && exerciseDate <= to
            });
        }
        exerciseLog.forEach(log => (new Date(log.date)).toDateString())
        //  Exercise log count
        response["count"] = exerciseLog.length;
        //  Exercise fields
        response["log"] = exerciseLog;
        res.json(response);
    } catch (e) {
        console.log(e)
        res.json({ "error": "something went wrong" });
    }
})

app.listen(port, () => {
    console.log(`App listening on port ${port}`)
})