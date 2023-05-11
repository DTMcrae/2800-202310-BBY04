/*
    ****NOTES****
    This class is for use in HTML through buttons or other elements.
    If you want to be able to roll dice through script, use DiceModule.js

    The VisualizeRoll function requires the below references to funcion properly.
    Make sure these are present in the HTML file should any issues arise.

    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
        integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo"
        crossorigin="anonymous"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.14.6/dist/umd/popper.min.js"
        integrity="sha384-wHAiFfRlMFy6i5SRaxvfOCifBUQy1xHdJ/yoi7FRNXMRBu5WHdZYu1hA6ZOblgut"
        crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.2.1/dist/js/bootstrap.min.js"
        integrity="sha384-B0UglyR+jN6CkvvICOB2joaf5I4l3gm9GU6Hc1og6Ls7i6U/mkkaduKaBhlAXv9k"
        crossorigin="anonymous"></script>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.2.1/dist/css/bootstrap.min.css"
        integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
*/

const validFaces = [4,6,8,10,12,20,100];

/*Rolls dice, and returns the sum.
  faces is the face count of the dice to roll.
  amount is the amount of dice to roll.
  Returns -1 if the specified face is not valid.
*/
function Roll(faces, amount)
{
    if(!validFaces.includes(faces))
    {
        console.error("Invalid face count for attempted dice roll. \nGiven Face: " + faces + "\nValid Faces: ",validFaces);
        return -1;
    }

    var roll = 0;

    for(var i = 0; i < amount; i++)
    {
        roll += Math.ceil(Math.random() * faces);
    }
    console.log("Rolled a d" + faces + ": " + roll);
    return roll;
}

//The delay between displayed numbers changing value
var changeDelay = 100; //0.2 Second

//How many times the value will change;
var totalLength = 20;

/*Rolls dice, and returns the sum.
  faces is the face count of the dice to roll.
  amount is the amount of dice to roll.
  Returns -1 if the specified face is not valid.

  This function displays each individual roll in a modal.
*/
async function VisualizeRoll(faces, amount)
{
    if (!validFaces.includes(faces)) {
        console.error("Invalid face count for attempted dice roll. \nGiven Face: " + faces + "\nValid Faces: ", validFaces);
        return -1;
    }

    //An internal function for use in VisualizeRoll only.
    function displayVariance(elementID, faces, result) {
        let element = $(`#${elementID}`);

        var inc = 0;

        function loopChange() {
            var value = Math.ceil(Math.random() * faces);
            element.html(value);
            if (++inc < totalLength) setTimeout(loopChange, changeDelay);
        }

        loopChange();

        element.html(result);
    }

    var roll = 0;

    if(document.getElementById("diceModal") == null)
    {
        $('body').append(`<div id="diceModalContainer"></div>`);
        $('#diceModalContainer').load("views/templates/diceModal.ejs");
    }

    setTimeout(function() {
        $('.modal-body').empty();
        $('#diceModal').modal('show');

    for (var i = 0; i < amount; i++) {
        var value = Math.ceil(Math.random() * faces);
        roll += value;
        
        $('.modal-body').append(`<div id="dice${i}"></div>`);
        displayVariance(`dice` + i, faces, roll);
    }
        return roll;
    }, 500);
}

class Dice {

    static Roll(faces, amount)
    {
        const validFaces = [4,6,8,10,12,20,100];

        if(!validFaces.includes(faces))
        {
            console.error("Invalid face count for attempted dice roll. \nGiven Face: " + faces + "\nValid Faces: ",validFaces);
            return -1;
        }

        var roll = 0;

        for(var i = 0; i < amount; i++)
        {
            roll += Math.ceil(Math.random() * faces);
        }
        console.log("Rolled a d" + faces + ": " + roll);
        return roll;
    }

    static VisualizeRoll(faces, amount)
    {

        const changeDelay = 100; //0.2 Second

    //How many times the value will change;
        const totalLength = 20;
    if (!validFaces.includes(faces)) {
        console.error("Invalid face count for attempted dice roll. \nGiven Face: " + faces + "\nValid Faces: ", validFaces);
        return -1;
    }

    //An internal function for use in VisualizeRoll only.
    function displayVariance(elementID, faces, result) {
        let element = $(`#${elementID}`);

        var inc = 0;

        function loopChange() {
            var value = Math.ceil(Math.random() * faces);
            element.html(value);
            if (++inc < totalLength) setTimeout(loopChange, changeDelay);
        }

        loopChange();

        element.html(result);
    }

    var roll = 0;

    if(document.getElementById("diceModal") == null)
    {
        $('body').append(`<div id="diceModalContainer"></div>`);
        $('#diceModalContainer').load("views/templates/diceModal.ejs");
    }

    setTimeout(function() {
        $('.modal-body').empty();
        $('#diceModal').modal('show');

    for (var i = 0; i < amount; i++) {
        var value = Math.ceil(Math.random() * faces);
        roll += value;
        
        $('.modal-body').append(`<div id="dice${i}"></div>`);
        displayVariance(`dice` + i, faces, roll);
    }
        return roll;
    }, 500);
}

}