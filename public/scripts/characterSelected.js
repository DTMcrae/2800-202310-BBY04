// Get the URL parameters
const params = new URLSearchParams(window.location.search);
const characterClass = params.get('class');
const imageLocation = params.get('image');

// Get references to the relevant elements
const imgElement = document.getElementById('characterImage');
const classElement = document.getElementById('characterClass');

// Update the elements on the characterSelected screen with the parameters
if (characterClass && imageLocation) {
    imgElement.src = imageLocation;
    classElement.innerText = characterClass;

    // Perform the database query using the selected character class
    console.log(`${characterClass}`);

    // Fetch character data from the server
    fetch(`/characterSelected?class=${encodeURIComponent(characterClass)}&image=${encodeURIComponent(imageLocation)}`)
        .then(response => response.json())
}