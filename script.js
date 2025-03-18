// Encrypted Google Sheets API Configuration (Base64 encoded)
const ENCRYPTED_SPREADSHEET_ID = "MVBqUk5uS1MxSE1HQm0tR0VJNE1sRVdvSkdPeXNaa3J3Z25VNWhUSngtcW8"; // Replace with your encrypted Spreadsheet ID
const ENCRYPTED_API_KEY = "QUl6YVN5QW54eHRraDZ2Q1RiaVB6M1J4SUlMNDhrbFhQeHJMVzY4"; // Replace with your encrypted API key
const ENCRYPTED_RANGE = "U2hlZXQx"; // Replace with your encrypted sheet name or range

// Decrypt function (Base64 decoding)
function decrypt(data) {
  return atob(data); // Decode Base64
}

// Decrypted Google Sheets API Configuration
const SPREADSHEET_ID = decrypt(ENCRYPTED_SPREADSHEET_ID);
const API_KEY = decrypt(ENCRYPTED_API_KEY);
const RANGE = decrypt(ENCRYPTED_RANGE);
const API_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const nameInput = document.getElementById("nameInput");
  const nameInput1 = document.getElementById("nameInput1");
  const nameInput2 = document.getElementById("nameInput2");
  const styledName = document.getElementById("styledName");
  const copyButton = document.getElementById("copyButton");
  const stylesList = document.getElementById("stylesList");
  const likeButton = document.getElementById("likeButton");
  const dislikeButton = document.getElementById("dislikeButton");
  const errorMessage = document.getElementById("errorMessage");
  const loadingAnimation = document.getElementById("loadingAnimation");
  const mainContent = document.getElementById("mainContent");
  const loadMoreButton = document.getElementById("loadMoreButton");
  const singleNameMode = document.getElementById("singleNameMode");
  const doubleNameMode = document.getElementById("doubleNameMode");
  const singleNameInput = document.getElementById("singleNameInput");
  const doubleNameInput = document.getElementById("doubleNameInput");
  const mobileMenu = document.getElementById("mobile-menu");
  const navbarMenu = document.querySelector(".navbar-menu");
  const likedStylesDisplay = document.createElement("div"); // New element to display liked styles
  likedStylesDisplay.id = "likedStylesDisplay";
  document.body.appendChild(likedStylesDisplay);
  
  let styles = [];
  let currentStyle = "";
  let displayedStyles = 5;
  let isSingleNameMode = true;
  let repeatCount = 0;
  
  // Fetch styles from Google Sheets
  async function fetchStyles() {
    try {
      loadingAnimation.style.display = "flex";
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (!data.values) throw new Error("No data found in the sheet.");
      styles = data.values.slice(1).map(row => ({
        style: row[0],
        type: row[1],
      }));
      renderStyles();
      fetchLikedStyles(); // Fetch liked styles initially
    } catch (error) {
      console.error("Error fetching styles:", error);
      alert("Failed to fetch styles. Check the console for details.");
    } finally {
      loadingAnimation.style.display = "none";
      mainContent.style.display = "block";
    }
  }
  
  // Fetch liked styles and sort by likes
  async function fetchLikedStyles() {
    const feedbackSheetUrl = `https://script.google.com/macros/s/AKfycbzQntwDW-lVFX2ieN3pMU2Pt18KBVLMNvM4pj1DtpTTy6VVuJPENg4AKyQM8Lh1a3yyOQ/exec?action=getLikedStyles`;
    try {
      const response = await fetch(feedbackSheetUrl);
      if (!response.ok) throw new Error("Failed to fetch liked styles.");
      const data = await response.json();
      renderLikedStyles(data.likedStylesWithCount);
    } catch (error) {
      console.error("Error fetching liked styles:", error);
    }
  }
  
  // Render liked styles sorted by likes
  function renderLikedStyles(likedStylesWithCount) {
    likedStylesDisplay.innerHTML = `
      <h3>Most Liked Styles</h3>
      <ul>${
        likedStylesWithCount.length > 0
          ? likedStylesWithCount.map(style => `<li>${style.style} (${style.count} likes)</li>`).join("")
          : "<li>No styles liked yet.</li>"
      }</ul>
    `;
  }
  
  // Render styles based on mode
  function renderStyles() {
    const filteredStyles = styles.filter(style =>
      isSingleNameMode ? style.type === "single" : style.type === "double"
    );
    let stylesToDisplay = [];
    if (filteredStyles.length > 5 && repeatCount < 4) {
      const firstFiveStyles = filteredStyles.slice(0, 5);
      stylesToDisplay = Array(4).fill(firstFiveStyles).flat();
      repeatCount++;
    } else {
      stylesToDisplay = filteredStyles.slice(0, displayedStyles);
    }
    stylesList.innerHTML = stylesToDisplay
      .map(style => `<button class="style-button" data-style="${style.style}">${style.style}</button>`)
      .join("");
    addStyleButtonListeners();
    loadMoreButton.style.display = displayedStyles >= filteredStyles.length ? "none" : "block";
  }
  
  // Add event listeners to style buttons
  function addStyleButtonListeners() {
    document.querySelectorAll(".style-button").forEach(button => {
      button.addEventListener("click", () => {
        const style = button.getAttribute("data-style");
        applyStyle(style);
      });
    });
  }
  
  // Apply selected style
  function applyStyle(style) {
    currentStyle = style;
    updateStyledName();
  }
  
  // Update styled name
  function updateStyledName() {
    let name1 = isSingleNameMode ? (nameInput.value.trim() || "Player") : (nameInput1.value.trim() || "Player1");
    let name2 = isSingleNameMode ? name1 : (nameInput2.value.trim() || "Player2");
    styledName.textContent = currentStyle ?
      currentStyle
      .replace(/{name}/g, name1)
      .replace(/{name1}/g, name1)
      .replace(/{name2}/g, name2) :
      name1;
  }
  
  // Copy styled name to clipboard
  copyButton.addEventListener("click", () => {
    navigator.clipboard.writeText(styledName.textContent)
      .then(() => alert("Copied to clipboard!"))
      .catch(err => console.error("Clipboard error:", err));
  });
  
  // Like/Dislike button functionality
  likeButton.addEventListener("click", () => currentStyle ? sendFeedback("Like") : alert("Please select a style first!"));
  dislikeButton.addEventListener("click", () => currentStyle ? sendFeedback("Dislike") : alert("Please select a style first!"));
  
  // Send feedback to Google Sheets
  async function sendFeedback(feedback) {
    const name1 = isSingleNameMode ? nameInput.value.trim() : nameInput1.value.trim();
    const name2 = isSingleNameMode ? nameInput.value.trim() : nameInput2.value.trim();
    if (!name1 || (!isSingleNameMode && !name2)) {
      errorMessage.style.display = "block";
      return;
    }
    errorMessage.style.display = "none";
    
    const kolkataTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const feedbackData = {
      name1,
      name2,
      style: currentStyle,
      feedback,
      timestamp: kolkataTime
    };
    
    const scriptUrl = "https://script.google.com/macros/s/AKfycbycqAmoU1vVrlLD7GDu2hXftcOhJ7xvcaGGzdyZOfgb-xyr1gNBpTfotzBQzdMvzA_EZg/exec";
    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify(feedbackData),
      });
      if (!response.ok) throw new Error("Failed to send feedback.");
      alert(`Thank you for your feedback! (${feedback})`);
      if (feedback === "Like") fetchLikedStyles(); // Refresh liked styles after a like
    } catch (error) {
      console.error("Error sending feedback:", error);
      alert("Failed to send feedback. Check the console for details.");
    }
  }
  
  // Load more styles
  loadMoreButton.addEventListener("click", () => {
    loadingAnimation.style.display = "flex";
    setTimeout(() => {
      displayedStyles += 5;
      renderStyles();
      loadingAnimation.style.display = "none";
    }, 1000);
  });
  
  // Toggle between modes
  singleNameMode.addEventListener("click", () => {
    isSingleNameMode = true;
    singleNameMode.classList.add("active");
    doubleNameMode.classList.remove("active");
    singleNameInput.style.display = "block";
    doubleNameInput.style.display = "none";
    repeatCount = 0;
    renderStyles();
    updateStyledName();
  });
  
  doubleNameMode.addEventListener("click", () => {
    isSingleNameMode = false;
    doubleNameMode.classList.add("active");
    singleNameMode.classList.remove("active");
    singleNameInput.style.display = "none";
    doubleNameInput.style.display = "block";
    repeatCount = 0;
    renderStyles();
    updateStyledName();
  });
  
  // Real-time updates
  [nameInput, nameInput1, nameInput2].forEach(input =>
    input.addEventListener("input", updateStyledName)
  );
  
  // Mobile menu toggle
  if (mobileMenu) {
    mobileMenu.addEventListener("click", () => navbarMenu.classList.toggle("active"));
  } else {
    console.error("Mobile menu element not found!");
  }
  
  // Initialize
  fetchStyles();
});