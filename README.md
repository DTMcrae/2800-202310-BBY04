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

Folder PATH listing for volume OS
Volume serial number is 02A9-5D05
C:.
|   .env
|   .gitignore
|   databaseConnection.js
|   index.js
|   package-lock.json
|   package.json
|   README.md
|   savioindex.js
|   Tree.txt
|   utils.js
|   
+---node_modules
|         
+---public
|   +---images
|   |       404.png
|   |       characterSelectionScreen.png
|   |       character_selected_hiRes.jpg
|   |       character_selection_hiRes.jpg
|   |       combat_bg.jpg
|   |       combat_bg_lrg.jpeg
|   |       Create New User Background 1.png
|   |       Equipimg.gif
|   |       Golden dragon egg snippet.png
|   |       imgBCIT.png
|   |       kingdom.jpg
|   |       landing page background 3.png
|   |       Landing_Page_backgroun_HiRes.jpg
|   |       Landing_Page_backgroun_HiRes2.jpg
|   |       loading.gif
|   |       loading_old.gif
|   |       load_bg.jpg
|   |       load_bg_large.jpg
|   |       Login Background 1.png
|   |       Login Background hi-res.jpg
|   |       myD&D_Banner.png
|   |       myD&D_Banner_2.png
|   |       myD&D_Banner_HiRes.png
|   |       myD&D_Banner_HiResolution.png
|   |       myD&D_Easter_Egg_Banner_Background.png
|   |       myD&D_Easter_Egg_Banner_Logo.png
|   |       myD&D_Easter_Egg_Icon.png
|   |       myD&D_Icon.png
|   |       myD&D_Icon_HiResolution.png
|   |       New_User_Background_HiRes.jpg
|   |       Partyimg.png
|   |       password reset background.png
|   |       passwordResetConfirmationScreen.png
|   |       story-boss-lrg.png
|   |       story-boss.png
|   |       story-journey-lrg.png
|   |       story-journey.png
|   |       story-npc-lrg.jpg
|   |       story-npc.png
|   |       story.png
|   |       story_hiRes.jpg
|   |       story_lrg.jpg
|   |       welcome.jpg
|   |       wizard.png
|   |       Wood Elf Druid.png
|   |       
|   +---scripts
|   |       characterSelected.js
|   |       characterSelection.js
|   |       combatAI.js
|   |       combatManager.js
|   |       combatPrompts.js
|   |       combatUtils.js
|   |       Data.js
|   |       Dice.js
|   |       DiceClient.js
|   |       loadGame.js
|   |       story.js
|   |       turnOrder.js
|   |       
|   \---styles
|           404.css
|           characterSelected.css
|           characterSelection.css
|           characterSelectionEasterEgg.css
|           combat.css
|           landing.css
|           load.css
|           login.css
|           loginSubmit.css
|           passwordReset.css
|           signup.css
|           signupSubmit.css
|           story-boss.css
|           story-journey.css
|           story-npc.css
|           story.css
|           style.css
|           welcome.css
|           
+---routes
|       story.js
|       
+---scripts
|   \---openai
|           openAI.js
|           
\---views
    |   404.ejs
    |   characterSelected.ejs
    |   characterSelectedEasterEgg.ejs
    |   characterSelection.ejs
    |   characterSelectionEasterEgg.ejs
    |   combat.ejs
    |   combatDefeat.ejs
    |   combatTesting.ejs
    |   combatVictory.ejs
    |   diceRoll.ejs
    |   equipped.ejs
    |   inventory.ejs
    |   LandingScreen.ejs
    |   levelup.ejs
    |   loadGame.ejs
    |   loginSubmit.ejs
    |   nosql-injection.ejs
    |   pageNotFound.ejs
    |   party.ejs
    |   password-reset-form.ejs
    |   passwordReset.ejs
    |   story-boss.ejs
    |   story-boss2.ejs
    |   story-boss3.ejs
    |   story-intro.ejs
    |   story-journey.ejs
    |   story-journey2.ejs
    |   story-journey3.ejs
    |   story-npc.ejs
    |   story-npcCHAT.ejs
    |   story-npcSC.ejs
    |   story-npcSC2.ejs
    |   story-npcSC3.ejs
    |   story.ejs
    |   submitUser.ejs
    |   target.ejs
    |   test.ejs
    |   userCharacters.ejs
    |   userInfo.ejs
    |   userLoginScreen.ejs
    |   userSignupScreen.ejs
    |   welcome.ejs
    |   
    \---templates
            combatBodyEnd.ejs
            combatBodyStart.ejs
            combatErrorModal.ejs
            combatHeader.ejs
            combatLoadModal.ejs
            confirmationModal.ejs
            diceModal.ejs
            footer.ejs
            footer.ejs.orig
            headerEnd.ejs
            headerEndEasterEgg.ejs
            headerStart copy.ejs
            headerStart.ejs
            saveModal.ejs
            storyBodyStart.ejs
            storyFooter.ejs
            storyHeaderStart.ejs
            templateToCopy.ejs
            



