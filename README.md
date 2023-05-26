# myDnD by DnD Dudes - BBY04

## 1. Project Description
Team BBY04 is developing myD&D, a streamlined and easy-to-play Dungeons and Dragons adventure game with ChatGPT as your Dungeon Master, to help users experience the thrill of epic battles and quests without needing to coordinate with other players or worry about complicated rules.

## 2. Names of Contributors
List team members and/or short bio's here... 
* Justin Saint
* Daniel McRae
* Alex Gabl
* Savio Dsouza
	
## 3. Technologies and Resources Used
List technologies (with version numbers), API's, icons, fonts, images, media or data sources, and other resources that were used.
* HTML, CSS, JavaScript
* Bootstrap 5.0 (Frontend library)
* MongoDB Atlas (database)
* jQuery 3.6.4
* Express.js (web framework)
* Node.js (JavaScript runtime)
* bcrypt (password hashing library)
* Joi (data validation library)
* Nodemailer (library for sending emails)
* crypto (crypto module for generating random tokens)
* form-data (library for working with HTML forms and files)
* Mailgun.js (Mailgun API client)
* OpenAI(chatGPT API)

## 4. Complete setup/installion/usage
State what a user needs to do when they come to your project.  How do others start using your code or application?
Here are the steps ...
* 1) Signup or Login
* 2) Create New Game or load previously saved game
* 3) Choose character to be used in gameplay
* 4) Customize and confirm character
* 5) Begin and choose prompts and actions to build storyline 
* 6) Engage enemies in battle by selection weapon and rolling dice
* 7) Save gameplay for later or continue on to next phase of storylines and more battles
* 8) Come out victorious or be defeated by enemies/bosses

## 5. Known Bugs and Limitations
Here are some known bugs:
* chatGPT API server errors can be caused by high traffic requiring user to refresh pages
* chatGPT being the dungeon master sometimes do not let enemies (itself) to take damage
* ...

## 6. Features for Future
What we'd like to build in the future:
* Multiplayer - a gameroom where multiple players can play live with each other to further develop the story and battle enemies together.
* Custom field prompts to Dungeon Master along with game generated
* ...
	
## 7. Contents of Folder
Content of the project folder:

```
 Top level of project folder: 
├── .gitignore  ( specify which files and directories should be ignored by Git version control system)      
├── node_modules  (node installed dependencies)
├── public  (HTML, CSS, JavaScript files, images)
├── routes  (contains story.js)
├── scripts  (contains openAI script)
├── views  (used to store the views or templates)
├── .env  (store environment-specific configuration variables and secrets.)
├── databseConnection.js  (responsible for establishing a connection to the database.)
├── index.js  (entry point of your application and sets up the server, configures routes, and starts listening for incoming requests.)
├── package.js  ( includes metadata, dependencies, and defines the project's name, version, scripts, and lists the required packages.)
├── package-lock.js  (ensures that the same versions of dependencies are installed across different environments.)
├── utils.js  (Define the include function for absolute file name)
└── README.md

It has the following subfolders and files:
├── images                   # Folder for images
  - images pulled from midjourney discord server
├── scripts                  # Folder for scripts
  - contain client side scripts
├── styles                   # Folder for styles
  - contains standard and unique css style templates for all ejs screens 
├── templates                # Folder for styles
  - contains story, combat, main/landing header and footer files

    



```


