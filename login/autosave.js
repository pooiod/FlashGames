// Server libs
async function saveToServer(variableName, content) {
    var serverURL = 'https://snapextensions.uni-goettingen.de/handleTextfile.php';
    var url = serverURL + '?type=write' + '&content=' + encodeURIComponent(content) + '&filename=./textfiles/' + encodeURIComponent(variableName);

    try {
        let response = await fetch(url);
        return (await response.text()) === 'ok';
    } catch (error) {
        console.error('Error saving', variableName, error);
        return false;
    }
}

async function loadFromServer(variableName) {
    var serverURL = 'https://snapextensions.uni-goettingen.de/handleTextfile.php';
    var url = serverURL + '?type=read' + '&filename=./textfiles/' + encodeURIComponent(variableName);

    try {
        let response = await fetch(url);
        return (await response.text()).slice(0, -1);
    } catch (error) {
        console.error('Error loading', variableName, error);
        return "ERROR: file does not exist";
    }
}

async function loadUserData(filename) {
    var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
    return await loadFromServer("Rufflesavedatafromid" + passwordMD5hash + filename);
}

async function saveUserData(filename, txtdata) {
    var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
    return await saveToServer("Rufflesavedatafromid" + passwordMD5hash + filename, txtdata);
}

// UI code for the floppy disk icon and loading bars
var rufflecontainer = document.body;
var shadowRoot = document;

setTimeout(function(){
    var shadowHost = document.querySelector('#gameContainer > ruffle-object:nth-child(1)');
    shadowRoot = shadowHost.shadowRoot;
    rufflecontainer = shadowRoot.querySelector('#container');
    addSaveIcon();
}, 500);
setTimeout(function(){
    var shadowHost = document.querySelector('#gameContainer > ruffle-object:nth-child(1)');
    shadowRoot = shadowHost.shadowRoot;
    rufflecontainer = shadowRoot.querySelector('#container');
    addSaveIcon();
}, 1500);
setTimeout(function(){
    var shadowHost = document.querySelector('#gameContainer > ruffle-object:nth-child(1)');
    shadowRoot = shadowHost.shadowRoot;
    rufflecontainer = shadowRoot.querySelector('#container');
    addSaveIcon();
}, 4000);

// Floppy disk save button
function addSaveIcon() {
    const saveButton = document.createElement('div');
    saveButton.textContent = '💾'; // Floppy disc emoji
    saveButton.style.position = 'fixed';
    saveButton.style.top = '10px';
    saveButton.style.left = '10px';
    saveButton.style.padding = '5px';
    saveButton.style.fontSize = '30px';
    saveButton.style.cursor = 'pointer';
    saveButton.style.zIndex = '999999999';
    saveButton.style.opacity = '1';
    saveButton.style.transition = 'opacity 0.5s ease-in-out';

    rufflecontainer.appendChild(saveButton);

    saveButton.addEventListener('click', async function() {
        saveButton.style.display = 'none'; // Hide button while saving
        showSaveProgressBar();
        await savePackedData(); // Trigger the save function
        hideSaveProgressBar();
        saveButton.style.display = 'block'; // Show button again after saving
    });
}

// Save data in chunks of 1000 chars
async function savePackedData() {
    let allData = [];
    Object.keys(localStorage).forEach(key => {
        let solData = localStorage.getItem(key);
        if (isB64SOL(solData)) {
            allData.push({ key: key, value: solData });
        }
    });

    let packedData = JSON.stringify(allData);
    let chunks = packedData.match(/.{1,1000}/g); // Split into 1000-character chunks

    try {
        for (let i = 0; i < chunks.length; i++) {
            await saveUserData(`completeSave_part${i + 1}`, chunks[i]);
            updateSaveProgressBar((i + 1) / chunks.length * 100); // Update progress bar
        }
        await saveUserData(`completeSave_part${chunks.length + 1}`, "ERROR: file does not exist");
        console.log("Data saved successfully.");
    } catch (error) {
        console.error("Failed to save packed data", error);
    }
}

// Show save progress bar
function showSaveProgressBar() {
    const progressBarContainer = document.createElement('div');
    progressBarContainer.id = 'saveProgressBarContainer';
    progressBarContainer.style.position = 'absolute';
    progressBarContainer.style.top = '0';
    progressBarContainer.style.left = '0';
    progressBarContainer.style.width = '100%';
    progressBarContainer.style.height = '10px';
    progressBarContainer.style.backgroundColor = '#ddd';
    progressBarContainer.style.zIndex = '99999999999';
    progressBarContainer.style.opacity = '0'; // Start hidden
    progressBarContainer.style.transform = 'translateY(-100%)'; // Slide up
    progressBarContainer.style.transition = 'opacity 0.5s ease-in-out, transform 0.5s ease-in-out';
    
    const progressBar = document.createElement('div');
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = '#4caf50';
    progressBar.style.width = '0%';
    
    progressBarContainer.appendChild(progressBar);
    rufflecontainer.appendChild(progressBarContainer);

    // Trigger the animation to show the bar
    setTimeout(() => {
        progressBarContainer.style.opacity = '1';
        progressBarContainer.style.transform = 'translateY(0)'; // Slide down
    }, 0);
    
    window.saveProgressBar = progressBar; // Make progress bar accessible globally
}

// Update save progress bar
function updateSaveProgressBar(percentage) {
    const progressBarContainer = shadowRoot.getElementById('saveProgressBarContainer');
    if (progressBarContainer) {
        const progressBar = progressBarContainer.firstChild;
        progressBar.style.width = percentage + '%';
    }
}

// Hide save progress bar
function hideSaveProgressBar() {
    const progressBarContainer = shadowRoot.getElementById('saveProgressBarContainer');
    if (progressBarContainer) {
        progressBarContainer.style.opacity = '0'; // Fade out
        progressBarContainer.style.transform = 'translateY(-100%)'; // Slide up
        setTimeout(() => {
            progressBarContainer.remove();
            window.saveProgressBar = null; // Clear reference to avoid issues
        }, 500); // Wait for animation to finish
    }
}

// Show full-page loading screen with spinner
function showLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loadingScreen';
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    loadingScreen.style.zIndex = '99999999999';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.justifyContent = 'center';

    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinner.style.width = '50px';
    spinner.style.height = '50px';
    spinner.style.border = '5px solid #ddd';
    spinner.style.borderTop = '5px solid #4caf50';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 1s linear infinite';
    
    loadingScreen.appendChild(spinner);
    document.body.appendChild(loadingScreen);
    
    // Add spinner animation keyframes
    const styleSheet = document.styleSheets[0];
    styleSheet.insertRule('@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }', styleSheet.cssRules.length);
}

// Hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.remove();
    }
}

// Load data and refresh the page
async function loadPackedData() {
    let allParts = [];
    let partIndex = 1;
    let partData;

    Object.keys(localStorage).forEach(key => {
        let solData = localStorage.getItem(key);
        if (isB64SOL(solData)) {
            localStorage.removeItem(key);
        }
    });

    showLoadingScreen(); // Show full-page loading screen

    // Remove current Ruffle instance
    let ruffleObject = document.querySelector('#gameContainer > ruffle-object:nth-child(1)');
    if (ruffleObject) {
        ruffleObject.remove();
    }

    try {
        while (true) {
            partData = await loadUserData(`completeSave_part${partIndex}`);
            if (partData === "ERROR: file does not exist") break;
            allParts.push(partData);
            partIndex++;
        }
        
        let loadedData = allParts.join('');
        if (isB64SOL(loadedData)) {
            localStorage.setItem('packedData', loadedData);
        }
    } catch (error) {
        console.error("Failed to load packed data", error);
    }

    hideLoadingScreen(); // Hide loading screen after loading
}

// Automatically load data when the page starts, then reload
async function autoLoadAndReload() {
    if (!document.cookie.split('; ').find(row => row.startsWith('dataLoaded='))) {
        await loadPackedData();
        document.cookie = 'dataLoaded=true; max-age=60'; // Prevent endless reloading for 1 minute
        location.reload();
    }
}

// Utility function to check if the data is Base64 SOL
function isB64SOL(str) {
    try {
        let decodedData = atob(str);
        return decodedData.slice(6, 10) === 'TCSO';
    } catch(e) {
        return false;
    }
}

// Initialize the automatic load and reload process
autoLoadAndReload();
