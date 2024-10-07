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

// UI code for the floppy disk icon
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
        saveButton.style.display = 'none'; // Hide save button while saving
        showSavingProgressBar(); // Show saving progress bar
        await savePackedData(); // Trigger the save function
        hideSavingProgressBar(); // Hide progress bar after save
        saveButton.style.display = 'block'; // Restore save button
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
            updateSavingProgressBar((i + 1) / chunks.length * 100); // Update progress
        }
        await saveUserData(`completeSave_part${chunks.length + 1}`, "ERROR: file does not exist");
        console.log("Data saved successfully.");
    } catch (error) {
        console.error("Failed to save packed data", error);
    }
}

// Loading progress bar
function showLoadingProgressBar() {
    const loadingBar = document.createElement('div');
    loadingBar.id = 'loadingProgressBar';
    loadingBar.style.position = 'fixed';
    loadingBar.style.top = '0';
    loadingBar.style.left = '0';
    loadingBar.style.width = '100%';
    loadingBar.style.height = '5px';
    loadingBar.style.backgroundColor = 'green';
    loadingBar.style.zIndex = '99999999999';
    loadingBar.style.width = '0%'; // Start with 0% width
    document.body.appendChild(loadingBar);
}

function updateLoadingProgressBar(percent) {
    const loadingBar = document.getElementById('loadingProgressBar');
    if (loadingBar) {
        loadingBar.style.width = percent + '%'; // Update width based on percent
    }
}

function hideLoadingProgressBar() {
    const loadingBar = document.getElementById('loadingProgressBar');
    if (loadingBar) {
        loadingBar.remove();
    }
}

// Saving progress bar
function showSavingProgressBar() {
    const savingBar = document.createElement('div');
    savingBar.id = 'savingProgressBar';
    savingBar.style.position = 'fixed';
    savingBar.style.top = '0';
    savingBar.style.left = '0';
    savingBar.style.width = '100%';
    savingBar.style.height = '5px';
    savingBar.style.backgroundColor = 'blue';
    savingBar.style.zIndex = '999999999';
    savingBar.style.width = '0%'; // Start with 0% width
    rufflecontainer.appendChild(savingBar);
}

function updateSavingProgressBar(percent) {
    const savingBar = document.getElementById('savingProgressBar');
    if (savingBar) {
        savingBar.style.width = percent + '%'; // Update width based on percent
    }
}

function hideSavingProgressBar() {
    const savingBar = document.getElementById('savingProgressBar');
    if (savingBar) {
        savingBar.remove();
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

    showLoadingProgressBar(); // Show loading progress bar

    try {
        while (true) {
            partData = await loadUserData(`completeSave_part${partIndex}`);
            if (partData === "ERROR: file does not exist") break;
            allParts.push(partData);
            updateLoadingProgressBar((partIndex / (partIndex + 1)) * 100); // Update progress
            partIndex++;
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
        hideLoadingProgressBar(); // Hide loading progress bar after loading
    }
}

// Automatically load data when the page starts, then reload
async function autoLoadAndReload() {
    if (!document.cookie.split('; ').find(row => row.startsWith('dataLoaded='))) {
        showLoader();
        await loadPackedData();
        document.cookie = 'dataLoaded=true; max-age=60'; // Prevent endless reloading
        location.reload();
    }
}

function showLoader() {
    let loader = document.createElement('div');
    loader.id = 'dataLoader';
    loader.style.position = 'fixed';
    loader.style.top = '0';
    loader.style.left = '0';
    loader.style.width = '100vw';
    loader.style.height = '100vh';
    loader.style.backgroundColor = '#fff';
    loader.style.display = 'flex';
    loader.style.justifyContent = 'center';
    loader.style.alignItems = 'center';
    loader.style.zIndex = '9999999999999999';

    let message = document.createElement('div');
    message.textContent = 'Loading save data';
    message.style.color = '#000';
    message.style.fontSize = '24px';
    message.style.marginTop = '20px';

    loader.appendChild(message);
    document.body.appendChild(loader);
}

function hideLoader() {
    let loader = document.getElementById('dataLoader');
    if (loader) {
        loader.remove();
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
