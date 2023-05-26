// Get the URL parameters
const params = new URLSearchParams(window.location.search);
const characterClass = params.get('class');
const imageLocation = params.get('image');

// Get references to the relevant elements
const imgElement = document.getElementById('characterImage');
const classElement = document.getElementById('characterClass');
const levelElement = document.getElementById('levelHeading');
const characterNameInput = document.getElementById('characterName');

// Update the elements on the characterSelected screen with the parameters
if (characterClass && imageLocation) {
    imgElement.src = imageLocation;
}

// Reference to the "Confirm Character" button
const confirmButton = document.getElementById('confirmButton');

// Retrieve the userID from the data attribute of the confirm button
const userID = confirmButton.getAttribute('data-userid');

// Event listener to the "Confirm Character" button
confirmButton.addEventListener('click', function (event) {
    event.preventDefault();

    // Retrieve the character name from the input field
    const characterName = characterNameInput.value;

    // Object to store the character data
    const characterData = {
        userID: userID, // Saving the user's id as a foreign key
        Name: characterName,
        Class: classElement.innerText,
        Level: (levelElement.innerText).split(" ")[1],
        AbilityScores: arrayToMap(getListItemTexts('abilityScoresList')),
        Equipment: arrayToMap(getListItemTexts('equipmentList')),
        Skills: getListItemTexts('skillsList'),
        Abilities: getListItemTexts('abilitiesList')
    };

    // HTTP request to save the character data
    fetch('/saveCharacter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(characterData)
        })
        .then(response => response.json())
        .then(data => {
            if(data.success) {
                window.location.href = '/story';
            } else {
                console.error("Error saving data.");
            }
        }).catch((error) => {
            console.error("Error: ", error);
        })
});

function arrayToMap(array) {
    var map = {};
    array.forEach(element => {
        var split = element.split(":");
        var identifier = split[0];
        var value = split[1].substring(1);

        if (!isNaN(value)) {
            value = Number(value);
        }

        map[identifier] = value;
    });
    return map;
}

// Helper function to get the text content of list items under the specific list element
function getListItemTexts(listId) {
    const list = document.getElementById(listId);
    const listItems = list.getElementsByTagName('li');
    const texts = [];
    for (const listItem of listItems) {
        texts.push(listItem.innerText);
    }
    return texts;
}