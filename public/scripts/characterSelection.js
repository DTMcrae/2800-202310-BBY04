// References to the relevant elements
const charButtons = document.getElementsByClassName('charButton');
const imgChars = document.getElementsByClassName('imgChar');
const characterClasses = document.getElementsByClassName('characterClass');

// Handle click events on the character selection buttons
for (let i = 0; i < charButtons.length; i++) {
  charButtons[i].addEventListener('click', function() {
    // Get the selected class and image based on the button's index
    const characterClass = characterClasses[i].innerText;
    const imageLocation = imgChars[i].src;

    // Generate the URL with the data as parameters
    const url = `/characterSelected?class=${encodeURIComponent(characterClass)}&image=${encodeURIComponent(imageLocation)}`;

    // Navigate to the characterSelected screen with the URL parameters
    window.location.href = url;
  });
}
