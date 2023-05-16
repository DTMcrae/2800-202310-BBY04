 // Get references to the relevant elements
 const druidButton = document.getElementById('DruidButton');
 const imgDruid = document.getElementById('imgDruid');
 const druidClass = document.getElementById('Druid');

 // Handle click event on the Druid button
 druidButton.addEventListener('click', function() {
    
     // Access the selected class and image directly
     const characterClass = druidClass.innerText;
     const imageLocation = imgDruid.src;

     // Generate the URL with the data as parameters
     const url = `/characterSelected?class=${encodeURIComponent(characterClass)}&image=${encodeURIComponent(imageLocation)}`;

     // Navigate to the characterSelected screen with the URL parameters
     window.location.href = url;
 });