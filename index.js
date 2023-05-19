require("./utils.js");

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');
const saltRounds = 12;
const path = require('path');

// forget password modules
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


const port = process.env.PORT || 3000;

const app = express();

const Joi = require("joi");

const expireTime = 24 * 60 * 60 * 1000;

/* secret information section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;

const mailgun_api_secret = process.env.MAILGUN_API_SECRET;
/* END secret section */

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use('/scripts', express.static("public/scripts"));

const {
    connectToDatabase
} = include('databaseConnection');
let userCollection;

async function init() {
    const database = await connectToDatabase();
    userCollection = database.db(mongodb_database).collection('USERAUTH');
    // console.log("database connection:", {
    //     serverConfig: userCollection.s.serverConfig,
    //     options: userCollection.s.options
    // });
}

init();


app.use(express.urlencoded({
    extended: false
}));
// app.use(bodyParser.json());

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
})

app.use(express.static(__dirname + '/public'));

app.use(session({
    secret: node_session_secret,
    saveUninitialized: false,
    resave: true
}));

const {
    Configuration,
    OpenAIApi
} = require("openai");

app.get('/LandingScreen', async (req, res) => {
    const usersName = req.session.name;
    const userID = req.session.userID;

    res.render("LandingScreen", {
        user: usersName,
        userId: userID,
    });
});

app.get('/userSignupScreen', (req, res) => {
    res.render('userSignupScreen');
});

app.get('/userLoginScreen', (req, res) => {
    res.render('userLoginScreen');
});

app.get('/loginSubmit', (req, res) => {
    res.render('loginSubmit');
});

app.get('/passwordReset', (req, res) => {
    res.render('passwordReset');
});

app.get('/characterSelection', (req, res) => {
    res.render('characterSelection');
});

app.get('/characterSelectionEasterEgg', (req, res) => {
    res.render('characterSelectionEasterEgg');
});

app.get('/', (req, res) => {
    res.render("userLoginScreen");
});

app.get('/characterSelected', async (req, res) => {
    try {
        const selectedCharacter = req.query.class;
        const database = await connectToDatabase();
        const dbo = database.db(mongodb_database).collection('CLASSES');

        const characterData = await dbo.findOne({
            Class: selectedCharacter,
            Level: 1
        });

        if (characterData) {
            res.render('characterSelected', {
                characterData
            }); // Pass characterData as a local variable
        } else {
            res.status(404).json({
                error: 'Character not found'
            });
        }
    } catch (error) {
        console.error('Error fetching character data:', error);
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
});

app.post('/saveCharacter', async (req, res) => {

    const database = await connectToDatabase();
    const dbo = database.db(mongodb_database).collection('USERCHAR');

    const characterStats = req.body;

    console.log('Saving character:', characterStats);

    dbo.insertOne(characterStats, (err, result) => {
        if (err) {
            console.error('Error saving character:', err);
            res.sendStatus(500);
        } else {
            console.log('Character saved successfully');
            res.sendStatus(200);
        }
    });
});

app.get('/userInfo', async (req, res) => {
    const userId = req.session.userID;

    // Fetch user data from MongoDB based on the provided ID
    const user = await userCollection.findOne({
        _id: new ObjectId(userId)
    });

    if (!user) {
        return res.status(404).send('User not found');
    }

    // Render the userInfo.ejs view and pass the user object
    res.render('userInfo', {
        user
    });
});

// Story Generation
app.get('/Quickstart', (req, res) => {
    res.render('Quickstart');
});

app.get('/BCIT', (req, res) => {
    res.render('BCIT');
});

const quickstart = require('./routes/quickstart');
const BCIT = require('./routes/BCIT');

// Story Initialization Middleware
app.use((req, res, next) => {
    if (typeof req.session.summary === 'undefined') {
        req.session.summary = '';
    }
    for (let i = 1; i <= 12; i++) {
        if (typeof req.session[`event${i}`] === 'undefined') {
            req.session[`event${i}`] = '';
        }
    }
    if (typeof req.session.currentEvent === 'undefined') {
        req.session.currentEvent = 0;
    }
    next();
});

// Generates Story Pages
app.use('/quickstart', quickstart);
app.use('/BCIT', BCIT);

app.post('/submitUser', async (req, res) => {
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.object({
        name: Joi.string().max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().max(20).required()
    });

    // Validate if any of the form fields are empty
    const validationResult = schema.validate({
        name,
        email,
        password
    });

    // Send message to submitUser.ejs if any field validation has failed
    if (validationResult.error != null) {
        console.log(validationResult.error);
        const message = validationResult.error.details[0].message;
        res.render("submitUser", {
            message: message
        });
        return;
    }

    // User bcrypt to hash user's password
    var hashedPassword = await bcrypt.hash(password, saltRounds);

    await userCollection.insertOne({
        name: name,
        email: email,
        password: hashedPassword,
        type: 'user'
    });
    console.log("Inserted user");

    const result = await userCollection.find({
        email: email
    }).project({
        type: 1,
        password: 1,
        _id: 1,
        name: 1
    }).toArray();

    // Store the user's name and username in the session
    req.session.authenticated = true;
    req.session.name = result[0].name;
    req.session.cookie.maxAge = expireTime;
    req.session.type = result[0].type;
    req.session.userID = result[0]._id;

    // Redirect to the main landing screen
    res.redirect('/LandingScreen');
});


app.post('/loggingin', async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().max(20).required()
    });

    const validationResult = schema.validate({
        email,
        password
    });

    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.redirect("/userLoginScreen");
        return;
    }

    const result = await userCollection.find({
        email: email
    }).project({
        type: 1,
        password: 1,
        _id: 1,
        name: 1
    }).toArray();

    if (result.length != 1) {
        const message = "user not found";
        res.render("loginSubmit", {
            message: message
        });
        return;
    }

    if (await bcrypt.compare(password, result[0].password)) {
        console.log("correct password");
        req.session.authenticated = true;
        req.session.name = result[0].name;
        req.session.cookie.maxAge = expireTime;
        req.session.type = result[0].type;
        req.session.userID = result[0]._id;


        res.redirect('/LandingScreen');
        return;
    } else {
        const message = "incorrect password";
        res.render("loginSubmit", {
            message: message
        });
        return;
    }
});

function requireLogin(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/userLoginScreen');
    }
}

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        console.log("check");
        res.redirect('/userLoginScreen');
    });
});

const combat = require('./public/scripts/combatManager')

app.use("/combat", combat);

// Forget password Begin

const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
    username: 'api',
    key: mailgun_api_secret,
});

// Generate a random token for the password reset link
function generateToken() {
    return crypto.randomBytes(20).toString('hex');
}

// Render password reset form screen
app.get('/reset/:token', (req, res) => {
    const token = req.params.token;

    // Renders the password reset form view and passes the token as a parameter
    res.render('password-reset-form', {
        token
    });
});

// Send the password reset email
function sendPasswordResetEmail(user, token) {

    // ******************* WILL NEED TO UPDATE DOMAIN WITH OUR CYCLISH.SH DOMAIN
    const resetLink = `https://mydnd.cyclic.app/reset/${token}`;
    // ******************* WILL NEED TO UPDATE DOMAIN WITH OUR CYCLISH.SH DOMAIN

    mg.messages
        .create('sandbox5227049b12c7448491caa1aa0c761516.mailgun.org', {
            from: 'Mailgun Sandbox <postmaster@sandbox5227049b12c7448491caa1aa0c761516.mailgun.org>',
            to: user.email,
            subject: 'Password Reset Request',
            text: `Hi ${user.name},\n\nYou are receiving this email because you (or someone else) has requested a password reset for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\nhttp://localhost:3000/reset/${token}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n\nBest regards,\nThe D&D Dudes`,
        })
        .then((msg) => console.log(msg))
        .catch((err) => console.log(err));
}

// Handle the password reset request
app.post('/forgot', async (req, res) => {
    const email = req.body.email;

    const user = await userCollection.findOne({
        email: email,
    });

    if (!user) {
        return res.status(400).send({
            message: 'Email address not found',
        });
    }

    const token = generateToken();

    // Save the token to the user's document in MongoDB
    await userCollection.updateOne({
        _id: user._id,
    }, {
        $set: {
            resetPasswordToken: token,
            resetPasswordExpires: Date.now() + 3600000, // 1 hour
        },
    });

    // Send the password reset email to the user
    sendPasswordResetEmail(user, token);

    res.send({
        message: 'If the email entered exists, a password reset email has been sent',
    });
});

// Handle the password reset form submission
app.post('/reset/:token', async (req, res) => {
    const token = req.params.token;

    const user = await userCollection.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: {
            $gt: Date.now(),
        },
    });

    if (!user) {
        const message = 'Invalid or expired password reset token';
        return res.send(`
            <script>
                alert("${message}");
                window.location.href = "/userLoginScreen";
            </script>
        `);
    }

    // Update the user's password in MongoDB
    const newPassword = req.body.password;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await userCollection.updateOne({
        _id: user._id,
    }, {
        $set: {
            password: hashedPassword,
            resetPasswordToken: undefined,
            resetPasswordExpires: undefined,
        },
    });

    const message = 'Password updated successfully';
    return res.send(`
        <script>
            alert("${message}");
            window.location.href = "/userLoginScreen";
        </script>
    `);
});


// Forget password End

app.use(express.static(__dirname + "/public"));

app.get("*", (req, res) => {
    res.status(404);
    res.send("Page not found - 404");
})



app.listen(port, () => {
    console.log("Node application listening on port " + port);
});