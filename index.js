require("./utils.js");

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');
const saltRounds = 12;
const path = require('path');
// const {
//     Configuration,
//     OpenAIApi
// } = require("openai");

// forget password modules
//const bodyParser = require('body-parser');
//const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Data = require('./public/scripts/Data.js');
const data = new Data();

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

//Dasebase connection
const { userCollection, 
    classesCollection, 
    equipmentCollection,
    levelCollection,
    monstersCollection,
    npcCollection,
    partyMemCollection,
    scenarioCollection,
    sessionCollection,
    spellsCollection,
    userCharCollection,
    userSavedCollection  
} = require('./databaseConnection.js');

//password variables
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

function requireLogin(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/userLoginScreen');
    }
}

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

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

//review
app.use('/scripts', express.static("public/scripts"));
const combat = require('./public/scripts/combatManager')
//end of review

app.use(express.static(__dirname + '/public'));

app.use(express.urlencoded({
    extended: false
}));
//app.use(bodyParser.json());

// var mongoStore = MongoStore.create({
//     mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
//     crypto: {
//         secret: mongodb_session_secret
//     }
// })

// app.use(session({
//     secret: node_session_secret,
//     saveUninitialized: false,
//     resave: true
// }));

var mongoStore = MongoStore.create({
	mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/${mongodb_database}`,
	collectionName: 'SESSION',
	crypto: {
		secret: mongodb_session_secret
	}
})

app.use(session({ 
    secret: node_session_secret,
	store: mongoStore, //default is memory store 
	saveUninitialized: false, 
	resave: true
}
));

/*--------------------------------------------------------------------------------------------------end of connections and imports-----------------------------------------------------------------------------------*/

app.get('/', (req, res) => {
    if(req.session.authenticated) {
        res.redirect('/LandingScreen');
        return;
    }
    res.render("userLoginScreen");
});

app.get('/LandingScreen', async (req, res) => {
    if (!req.session.authenticated) {
        res.redirect('/userLoginScreen');
        return;
    }

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
    if (req.session.authenticated) {
        res.redirect('/LandingScreen');
        return;
    }
    res.render('userLoginScreen');
});

app.get('/loginSubmit', (req, res) => {
    res.render('loginSubmit');
});

app.get('/passwordReset', (req, res) => {
    res.render('passwordReset');
});

app.get('/userInfo', async (req, res) => {
    const userId = req.session.userID;

    // Fetch user data from MongoDB based on the provided ID
    const user = await userCollection.collection.findOne({
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

    await userCollection.collection.insertOne({
        name: name,
        email: email,
        password: hashedPassword,
        type: 'user'
    });
    console.log("Inserted user");

    const result = await userCollection.collection.find({
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

    const result = await userCollection.collection.find({
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

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        console.log("check");
        res.redirect('/userLoginScreen');
    });
});

// Forget password Begin

// Render password reset form screen
app.get('/reset/:token', (req, res) => {
    const token = req.params.token;

    // Renders the password reset form view and passes the token as a parameter
    res.render('password-reset-form', {
        token
    });
});

// Handle the password reset request
app.post('/forgot', async (req, res) => {
    const email = req.body.email;

    const user = await userCollection.collection.findOne({
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
 
    const user = await userCollection.collection.findOne({
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

    await userCollection.collection.updateOne({
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

/*--------------------------------------------------------------------------------------------------end of langing page registration and login-----------------------------------------------------------------------------------*/

app.get('/characterSelection', (req, res) => {
    res.render('characterSelection');
});

app.get('/characterSelectionEasterEgg', (req, res) => {
    res.render('characterSelectionEasterEgg');
});

app.get('/characterSelected', async (req, res) => {
    try {
        const selectedCharacter = req.query.class;
        // const database = await connectToDatabase();
        // const dbo = database.db(mongodb_database).collection('CLASSES');


        const characterData = await classesCollection.collection.findOne({
            Class: selectedCharacter,
            Level: 1
        });

        req.session.selectedClass = selectedCharacter;

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

    // const database = await connectToDatabase();
    // const dbo = database.db(mongodb_database).collection('USERCHAR');

    const characterStats = req.body;

    console.log('Saving character:', characterStats);

    userCollection.collection.insertOne(characterStats, (err, result) => {
        if (err) {
            console.error('Error saving character:', err);
            res.sendStatus(500);
        } else {
            console.log('Character saved successfully');
            res.sendStatus(200);
        }
    });
});

/*--------------------------------------------------------------------------------------------------end of user character-----------------------------------------------------------------------------------*/

// Story Generation
app.get('/story', async (req, res) => {
    const userID = req.session.userID;
    
    // Check if userId exists
    if (!userID) {
        // Handle case when user is not logged in
        return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {

        const players = await userCharCollection.collection.find({ userID: new ObjectId(userID) }).toArray();

        const mainChar = players.map(async (myPlayer) => {
            const ac = await data.calculateAC(myPlayer);
    
            const Player = {
                name: myPlayer.name, // replace 'name' with the correct field name for the character's name
                class: myPlayer.Class,
                maxHP: myPlayer.maxHP, // replace 'maxHP' with the correct field name for maxHP
                hp: myPlayer.hp, // replace 'hp' with the correct field name for current HP
                ac: ac,
                gold: myPlayer.gold, // replace 'gold' with the correct field name for gold
                actions: myPlayer.actions // replace 'actions' with the correct field name for actions
            };
            return Player;
        });
    
        const partyMembers = await partyMemCollection.collection.find({}).toArray(); // replace with the correct query if necessary
    
        const presetPartyMembers = partyMembers.map(async (member) => {
            const ac = await data.calculateAC(member);
    
            const partyMember = {
                name: member.Name, // replace 'name' with the correct field name for the character's name
                class: member.Class,
                maxHP: member.maxHP, // replace 'maxHP' with the correct field name for maxHP
                hp: member.hp, // replace 'hp' with the correct field name for current HP
                ac: ac,
                gold: member.gold, // replace 'gold' with the correct field name for gold
                actions: member.actions // replace 'actions' with the correct field name for actions
            };
    
            if (member.Domain) {
                partyMember.domain = member.Domain;
            }
    
            return partyMember;
        });
    
        // Await all promises from map functions
        const [mainCharObjects, presetPartyMemObjects] = await Promise.all([Promise.all(mainChar), Promise.all(presetPartyMembers)]);
    
        // Now we have arrays of objects, and we want to make sure we have exactly one main character and two party members
        // For main character, we'll just take the first one (assuming there is at least one)
        const mainCharObject = mainCharObjects[0];
    
        // For party members, we'll take the first two (assuming there are at least two)
        const [partyMemObject1, partyMemObject2] = presetPartyMemObjects;
    
        // Now construct the allCharacters array
        const characters = [mainCharObject, partyMemObject1, partyMemObject2];

        const monsterNames = await data.getMonsterNames();
        // const monsterInfo = await data.getMonsterInfo(name);
        const npcList = await data.getNpc();
        // const npcDetails = await data.getNpcDetails(name, background);
    
        req.session.characters = characters;
        req.session.monsterNames = monsterNames;
        req.session.npcList = npcList;
    } catch (error) {
        console.error('Error fetching character data:', error);
    }

    res.render('story', { characters: characters });
});
// add the below functions to your route to access them
// const characters = req.session.characters;
// const monsterNames = req.session.monsterNames;
// const npcList = req.session.npcList;

const story = require('./routes/story.js');

// Story Initialization Middleware
app.use((req, res, next) => {
    const userId = req.session.userId;
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
app.use('/story', story);

/*--------------------------------------------------------------------------------------------------end of story-----------------------------------------------------------------------------------*/

app.use("/combat", combat);

/*--------------------------------------------------------------------------------------------------end of combat-----------------------------------------------------------------------------------*/

app.get("*", (req, res) => {
    res.status(404);
    res.send("Page not found - 404");
})

app.listen(port, () => {
    console.log("Node application listening on port " + port);
});