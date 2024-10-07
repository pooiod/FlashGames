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

// Floppy disk save button with loading bar
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
        let progressBar = addProgressBar(rufflecontainer); // Show progress bar
        await savePackedData(progressBar); // Trigger the save function
        saveButton.style.display = 'block'; // Show button after saving
        progressBar.remove(); // Remove the progress bar
    });
}

// Add a progress bar to the top of the container
function addProgressBar(container) {
    const progressBar = document.createElement('div');
    progressBar.id = 'progressBar';
    progressBar.style.position = 'fixed';
    progressBar.style.top = '0';
    progressBar.style.left = '0';
    progressBar.style.width = '0%'; // Initial width at 0%
    progressBar.style.height = '5px';
    progressBar.style.backgroundColor = '#4caf50';
    progressBar.style.zIndex = '999999999';
    container.appendChild(progressBar);
    return progressBar;
}

// Update progress bar percentage
function updateProgressBar(progressBar, percentage) {
    progressBar.style.width = percentage + '%';
}

// Save data in chunks of 1000 chars with progress bar
async function savePackedData(progressBar) {
    let allData = [];
    Object.keys(localStorage).forEach(key => {
        let solData = localStorage.getItem(key);
        if (isB64SOL(solData)) {
            allData.push({ key: key, value: solData });
        }
    });

    let packedData = JSON.stringify(allData);
    let chunks = packedData.match(/.{1,1000}/g); // Split into 1000-character chunks
    let totalChunks = chunks.length + 1;

    try {
        for (let i = 0; i < chunks.length; i++) {
            await saveUserData(`completeSave_part${i + 1}`, chunks[i]);
            updateProgressBar(progressBar, ((i + 1) / totalChunks) * 100); // Update progress
        }
        await saveUserData(`completeSave_part${chunks.length + 1}`, "ERROR: file does not exist");
        updateProgressBar(progressBar, 100); // Complete the progress bar
        console.log("Data saved successfully.");
    } catch (error) {
        console.error("Failed to save packed data", error);
    }
}

// Loading bar in body when loading data
function showLoaderWithProgress() {
    const loader = document.createElement('div');
    loader.id = 'dataLoader';
    loader.style.position = 'fixed';
    loader.style.top = '0';
    loader.style.left = '0';
    loader.style.width = '100vw';
    loader.style.height = '5px'; // Loading bar height
    loader.style.backgroundColor = '#fff';
    loader.style.zIndex = '9999999999999999';

    const progressBar = document.createElement('div');
    progressBar.id = 'loadingProgressBar';
    progressBar.style.width = '0%';
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = '#4caf50'; // Green progress bar

    loader.appendChild(progressBar);
    document.body.appendChild(loader);
    return progressBar;
}

function updateLoaderProgress(progressBar, percentage) {
    progressBar.style.width = percentage + '%';
}

function hideLoader() {
    const loader = document.getElementById('dataLoader');
    if (loader) loader.remove();
}

// Load data and refresh the page with loading bar
async function loadPackedData() {
    let allParts = [];
    let partIndex = 1;
    let partData;

    let progressBar = showLoaderWithProgress(); // Show loading progress bar

    Object.keys(localStorage).forEach(key => {
        let solData = localStorage.getItem(key);
        if (isB64SOL(solData)) {
            localStorage.removeItem(key);
        }
    });

    try {
        while (true) {
            partData = await loadUserData(`completeSave_part${partIndex}`);
            if (partData === "ERROR: file does not exist") break;
            allParts.push(partData);
            updateLoaderProgress(progressBar, (partIndex / 10) * 100); // Update loader progress
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
        hideLoader(); // Hide the loading bar after load is complete
    }
}

// Automatically load data when the page starts, then reload
async function autoLoadAndReload() {
    if (!document.cookie.split('; ').find(row => row.startsWith('dataLoaded='))) {
        showLoaderWithProgress();
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
