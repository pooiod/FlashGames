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
    progressBarContainer.style.position = 'fixed';
    progressBarContainer.style.top = '0';
    progressBarContainer.style.left = '0';
    progressBarContainer.style.width = '100%';
    progressBarContainer.style.height = '10px';
    progressBarContainer.style.backgroundColor = '#ddd';
    progressBarContainer.style.zIndex = '99999999999';
    
    const progressBar = document.createElement('div');
    progressBar.id = 'saveProgressBar';
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = '#4caf50';
    progressBar.style.width = '0%';
    progressBar.style.transition = 'width 0.4s ease'; // Improved animation
    
    progressBarContainer.appendChild(progressBar);
    rufflecontainer.appendChild(progressBarContainer);
}

// Update save progress bar
function updateSaveProgressBar(percentage) {
    const progressBar = document.getElementById('saveProgressBar');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
}

// Hide save progress bar
function hideSaveProgressBar() {
    const progressBarContainer = document.getElementById('saveProgressBarContainer');
    if (progressBarContainer) {
        progressBarContainer.remove();
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

    showLoadingBar(); // Show loading bar in body

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
            updateLoadingBar((partIndex - 1) / partIndex * 100); // Update loading progress
        }

        let combinedData = allParts.join('');
        let parsedData = JSON.parse(combinedData);

        parsedData.forEach(item => {
            localStorage.setItem(item.key, item.value);
        });

        console.log("Data loaded successfully.");
    } catch (error) {
        console.error("Failed to load packed data", error);
    } finally {
        hideLoadingBar(); // Hide loading bar after loading
    }
}

// Show loading progress bar in body
function showLoadingBar() {
    const loadingBarContainer = document.createElement('div');
    loadingBarContainer.id = 'loadingProgressBarContainer';
    loadingBarContainer.style.position = 'fixed';
    loadingBarContainer.style.top = '0';
    loadingBarContainer.style.left = '0';
    loadingBarContainer.style.width = '100%';
    loadingBarContainer.style.height = '10px';
    loadingBarContainer.style.backgroundColor = '#ddd';
    loadingBarContainer.style.zIndex = '99999999999';
    
    const loadingBar = document.createElement('div');
    loadingBar.id = 'loadingProgressBar';
    loadingBar.style.height = '100%';
    loadingBar.style.backgroundColor = '#2196F3';
    loadingBar.style.width = '0%';
    loadingBar.style.transition = 'width 0.4s ease'; // Improved animation
    
    loadingBarContainer.appendChild(loadingBar);
    document.body.appendChild(loadingBarContainer);
}

// Update loading progress bar
function updateLoadingBar(percentage) {
    const loadingBar = document.getElementById('loadingProgressBar');
    if (loadingBar) {
        loadingBar.style.width = percentage + '%';
    }
}

// Hide loading progress bar
function hideLoadingBar() {
    const loadingBarContainer = document.getElementById('loadingProgressBarContainer');
    if (loadingBarContainer) {
        loadingBarContainer.remove();
    }
}

// Automatically load data when the page starts, then reload
async function autoLoadAndReload() {
    if (!document.cookie.split('; ').find(row => row.startsWith('dataLoaded='))) {
        await loadPackedData();
        document.cookie = 'dataLoaded=true; max-age=60'; // Prevent endless reloading
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
