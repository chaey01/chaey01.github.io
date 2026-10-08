const button = document.getElementById("generate-button");
const memeText = document.getElementById("meme-text");
const memeImage = document.getElementById("meme-image");

button.addEventListener("click", generateMeme);

function generateMeme() {

  // Get text
  fetch("https://corporatebs-generator.sameerkumar.website/?" + Date.now())
    .then(response => response.json())
    .then(data => {
      memeText.textContent = data.phrase;
    });

  // Get image
  fetch("https://yesno.wtf/api?" + Date.now())
    .then(response => response.json())
    .then(data => {
      memeImage.src = data.image;
    });

}