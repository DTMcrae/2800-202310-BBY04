function VisualizeRoll(faces, amount) {
    return Dice.VisualizeRoll(faces, amount);
}

class Dice {

    /*Rolls dice, and returns the sum.
      faces is the face count of the dice to roll.
      amount is the amount of dice to roll.
      Returns -1 if the specified face is not valid.
    */
    static Roll(faces, amount) {
        const validFaces = [4, 6, 8, 10, 12, 20, 100]
        if (!validFaces.includes(Number(faces))) {
            console.error("Invalid face count for attempted dice roll. \nGiven Face: " + Number(faces) + "\nValid Faces: ", validFaces);
            return -1;
        }

        var roll = 0;

        for (var i = 0; i < amount; i++) {
            roll += Math.ceil(Math.random() * faces);
        }
        return roll;
    }

    /*Rolls dice, and returns the sum.
      faces is the face count of the dice to roll.
      amount is the amount of dice to roll.
      Returns -1 if the specified face is not valid.
    
      This function displays each individual roll in a modal.
    */
    static VisualizeRoll(faces, amount) {
        const validFaces = [4, 6, 8, 10, 12, 20, 100];

        //The delay between displayed numbers changing value
        const changeDelay = 100; //0.2 Second

        //How many times the value will change;
        const totalLength = 20;

        if (!validFaces.includes(Number(faces))) {
            console.error("Invalid face count for attempted dice roll. \nGiven Face: " + faces + "\nValid Faces: ", validFaces);
            return -1;
        }

        function displayRolls(data) {
            let element = document.getElementById("diceModal");
            const canvas = document.getElementById("diceRolls");
            const context = document.getElementById("diceRolls").getContext("2d");

            var inc = 0;

            function loop() {
                var displayVal = 0;
                context.clearRect(0, 0, canvas.width, canvas.height);

                for (var i = 0; i < data.length; i++) {
                    displayVal = Math.ceil(Math.random() * data[i].face);
                    context.fillText(displayVal, 60 * i, 50);
                }
                if (++inc < totalLength) setTimeout(loop, changeDelay);
                else {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    for (var i = 0; i < data.length; i++) {
                        context.fillText(data[i].result, 60 * i, 50);
                    }
                }
            }

            loop();
        }

        var roll = 0;

        if (document.getElementById("diceModal") == null) {
            console.log("The required modal is not present on the page, unable to visualize rolls.");
            return;
        }
        if (document.getElementById("diceRolls") == null) {
            console.error("The required canvas is not present on the page, unable to visualize rolls.");
            return;
        }

        $("#diceModal").modal("show");
        const canvas = document.getElementById("diceRolls");
        const context = document.getElementById("diceRolls").getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = "48px serif";
        context.fillStyle = "white";

        var rolls = [];

        for (var i = 0; i < amount; i++) {
            var value = Math.ceil(Math.random() * faces);
            if (value < 10 && Math.random() > 0.4) {
                let reroll = Math.ceil(Math.random() * faces);
                if(reroll > value) value = reroll;
            }
            roll += value;
            rolls.push({ face: faces, result: value });
            context.fillText(value, 60 * i, 50);
        };
        displayRolls(rolls);
        return roll;
    }
}