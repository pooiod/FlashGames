// Server libs
async function saveToServer(variableName, content) {
    console.log("Saving", variableName);
    var serverURL = 'https://snapextensions.uni-goettingen.de/handleTextfile.php';
    var url = serverURL + '?type=write' + '&content=' + encodeURIComponent(content) + '&filename=./textfiles/' + encodeURIComponent(variableName);

    try {
        let response = await fetch(url);
        let result = await response.text();
        return result === 'ok';
    } catch (error) {
        console.error('Failed to save data to the server:', error);
        return false;
    }
}

async function loadFromServer(variableName) {
    console.log("Loading", variableName);
    var serverURL = 'https://snapextensions.uni-goettingen.de/handleTextfile.php';
    var url = serverURL + '?type=read' + '&filename=./textfiles/' + encodeURIComponent(variableName);

    try {
        let response = await fetch(url);
        return await response.text();
    } catch (error) {
        console.error('Failed to load data from the server:', error);
        return "can't get data";
    }
}

async function loadUserData(filename) {
    var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
    return loadFromServer("Rufflesavedatafromid" + passwordMD5hash + filename);
}

async function saveUserData(filename, txtdata) {
    var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
    return saveToServer("Rufflesavedatafromid" + passwordMD5hash + filename, txtdata);
}

async function loadUserFilesList() {
    var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
    let content = await loadFromServer("Rufflesavedatafromid" + passwordMD5hash + "RuffleInstanceFiles");
    return JSON.parse(content) || [];
}

async function saveUserFilesList(array) {
    var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
    return saveToServer("Rufflesavedatafromid" + passwordMD5hash + "RuffleInstanceFiles", JSON.stringify(array));
}

var rufflecontainer = document.body;
var shadowRoot = document;
setTimeout(function(){
    var shadowHost = document.querySelector('#gameContainer > ruffle-object:nth-child(1)');
    var shadowRoot = shadowHost.shadowRoot;
    rufflecontainer = shadowRoot.querySelector('#container');
}, 500);
setTimeout(function(){
    var shadowHost = document.querySelector('#gameContainer > ruffle-object:nth-child(1)');
    shadowRoot = shadowHost.shadowRoot;
    rufflecontainer = shadowRoot.querySelector('#container');
}, 1500);
setTimeout(function(){
    var shadowHost = document.querySelector('#gameContainer > ruffle-object:nth-child(1)');
    shadowRoot = shadowHost.shadowRoot;
    rufflecontainer = shadowRoot.querySelector('#container');
}, 4000);

// Autosave ui and function code
function showCloudIcon() {
    let cloudIcon = document.createElement('div');
    cloudIcon.id = 'saveCloudIcon';
    cloudIcon.textContent = '💾';
    cloudIcon.style.position = 'fixed';
    cloudIcon.style.top = '-5px';
    cloudIcon.style.left = '0';
    cloudIcon.style.fontSize = '30px';
    cloudIcon.style.opacity = '1';
    cloudIcon.style.transition = 'opacity 0.5s ease-in-out';
    cloudIcon.style.zIndex = '9999999999999999';
    rufflecontainer.appendChild(cloudIcon);
    cloudIcon.style.animation = 'fade 2s infinite';
    saveButton.style.display = "none";
}

function hideCloudIcon() {
    saveButton.style.display = "block";
    let cloudIcon = shadowRoot.getElementById('saveCloudIcon');
    if (cloudIcon) {
        setTimeout(() => cloudIcon.remove(), 1000);
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

    let spinner = document.createElement('div');
    spinner.textContent = '💿 ';
    spinner.style.fontSize = '50px';
    spinner.style.animation = 'fade 2s infinite';

    let message = document.createElement('div');
    message.textContent = 'Loading save data';
    message.style.color = '#000';
    message.style.fontSize = '24px';
    message.style.marginTop = '20px';
    message.style.animation = 'fade 2s infinite';

    //loader.appendChild(spinner);
    loader.appendChild(message);
    document.body.appendChild(loader);
}

function hideLoader() {
    let loader = document.getElementById('dataLoader');
    if (loader) {
        setTimeout(() => loader.remove(), 1000);
    }
}

function showNotification(message, color) {
    let notification = document.createElement('div');
    notification.id = 'saveNotification';
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '10px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = color;
    notification.style.color = '#000';
    notification.style.padding = '10px 20px';
    notification.style.border = '1px solid #ccc';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '9999999999999999';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 1s ease-in-out';
    notification.style.fontSize = '16px';
    rufflecontainer.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 1000);
    }, 3000);
}

let style = document.createElement('style');
style.textContent = `
    @keyframes fade {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);
setTimeout(function(){
    rufflecontainer.appendChild(style);
}, 800);

async function userSaveIntervalFunction() {
    showCloudIcon();

    function isB64SOL(str) {
        try {
            let decodedData = atob(str);
            return decodedData.slice(6, 10) === 'TCSO';
        } catch(e) {
            return false;
        }
    }

    let dataURIs = [];

    try {
        Object.keys(localStorage).forEach(function(key) {
            let solName = key.split('/').pop();
            let solData = localStorage.getItem(key);
            if (isB64SOL(solData)) {
                let mimeType = 'application/octet-stream';
                let dataURI = 'data:' + mimeType + ';base64,' + solData;
                dataURIs.push({ filename: solName + '.sol', data: solData });
            }
        });

        let fileNames = dataURIs.map(data => data.filename);
        await saveUserFilesList(fileNames);

        for (let data of dataURIs) {
            await saveUserData(data.filename, data.data);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    } catch (error) {
        showNotification('An error occurred while saving data.', '#f8d7da');
        console.error(error);
    } finally {
        await new Promise(resolve => setTimeout(resolve, 1000));
        hideCloudIcon();
    }
}

async function loadSavedDataAfterRuffle() {
    let cookie = document.cookie.split('; ').find(row => row.startsWith('dataLoaded='));
    if (!cookie) {
      showLoader();
    } else {
        showNotification('Please do not close the game while the save icon is blinking', '#e2e3e5');
    }
    setTimeout(async () => {
        try {
            if (!document.cookie.split('; ').find(row => row.startsWith('dataLoaded='))) {
                /** Clear code (disabled)
                Object.keys(localStorage).forEach(async function(key) {
                    let solData = localStorage.getItem(key);
                    if (isB64SOL(solData)) {
                        localStorage.removeItem(key);
                    }
                });
                **/

                let fileNames = await loadUserFilesList() || [];
                let dataURIs = [];

                for (let filename of fileNames) {
                    if (filename.endsWith('.sol')) {
                        let content = await loadUserData(filename);
                        localStorage.setItem(filename.slice(0, -4), content); // Store the data into local storage
                        dataURIs.push({ filename: filename });
                    }
                }

                document.cookie = 'dataLoaded=true; max-age=60';
                location.reload();
            } else {
                document.cookie = 'dataLoaded=true; max-age=60';
            }
            try { hideLoader(); } catch(err) { err = err; }
        } catch (error) {
            showNotification('An error occurred while loading data.', '#f8d7da');
            console.error(error);
            try { hideLoader(); } catch(err) { err = err; }
        }
    }, 1000);
}

function isB64SOL(str) {
    try {
        let decodedData = atob(str);
        return decodedData.slice(6, 10) === 'TCSO';
    } catch(e) {
        return false;
    }
}

function handleKeyDown(event) {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        userSaveIntervalFunction();
    }
}

function isMobileDevice() {
    return /Mobi|Android/i.test(navigator.userAgent);
}
const saveButton = document.createElement('button');
saveButton.textContent = '💾';
saveButton.style.position = 'fixed';
saveButton.style.top = '0px';
saveButton.style.left = '0px';
saveButton.style.padding = '5px';
saveButton.style.backgroundColor = 'transparent';
saveButton.style.color = 'black';
saveButton.style.border = 'none';
saveButton.style.borderRadius = '5px';
saveButton.style.cursor = 'pointer';
saveButton.style.fontSize = '24px';
saveButton.addEventListener('click', userSaveIntervalFunction);
if (isMobileDevice()) {
    setTimeout(function() {
        rufflecontainer.appendChild(saveButton);
    }, 2000);
}

document.addEventListener('keydown', handleKeyDown);

setInterval(userSaveIntervalFunction, 600000);
loadSavedDataAfterRuffle();
