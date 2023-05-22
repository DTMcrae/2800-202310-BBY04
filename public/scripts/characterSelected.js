// Get the URL parameters
const params = new URLSearchParams(window.location.search);
const characterClass = params.get('class');
const imageLocation = params.get('image');

// Get references to the relevant elements
const imgElement = document.getElementById('characterImage');
const classElement = document.getElementById('characterClass');
const levelElement = document.getElementById('levelHeading');

// Update the elements on the characterSelected screen with the parameters
if (characterClass && imageLocation) {
    imgElement.src = imageLocation;
    classElement.innerText = characterClass;
}

// Reference to the "Confirm Character" button
const confirmButton = document.querySelector('.confirmButton');

// Event listener to the "Confirm Character" button
confirmButton.addEventListener('click', function () {

    console.log('Confirm button clicked');

    // Object to store the character data
    const characterData = {
        userId: req.session.userId, //saving the user's id as a forgein key
        class: classElement.innerText,
        level: levelElement.innerText,
        abilityScores: getListItemTexts('abilityScoresList'),
        equipment: getListItemTexts('equipmentList'),
        skills: getListItemTexts('skillsList'),
        abilities: getListItemTexts('abilitiesList')
    };

    console.log('Saving character data:', characterData);

    // HTTP request to save the character data
    fetch('/saveCharacter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(characterData)
        })
});

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