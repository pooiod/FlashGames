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
        console.error('Error saving '+variableName, error);
        return false;
    }
}

async function loadFromServer(variableName) {
    console.log("Loading", variableName);
    var serverURL = 'https://snapextensions.uni-goettingen.de/handleTextfile.php';
    var url = serverURL + '?type=read' + '&filename=./textfiles/' + encodeURIComponent(variableName);

    try {
        let response = await fetch(url);
        return (await response.text()).slice(0, -1);
    } catch (error) {
        console.error('Error loading '+variableName, error);
        return "ERROR: file does not exist";
    }
}

async function loadUserData(filename) {
    var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
    return await decompress(loadFromServer("Rufflesavedatafromid" + passwordMD5hash + filename));
}

async function saveUserData(filename, txtdata) {
    var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
    return saveToServer("Rufflesavedatafromid" + passwordMD5hash + filename, await compress(txtdata));
}

async function loadUserFilesList() {
    var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
    let content = await loadFromServer("Rufflesavedatafromid" + passwordMD5hash + "RuffleInstanceFiles");
    try {
        return JSON.parse(content) || [];
    } catch(err) {
        console.warn(err);
        return [];
    }
}

async function saveUserFilesList(array) {
    var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
    return saveToServer("Rufflesavedatafromid" + passwordMD5hash + "RuffleInstanceFiles", JSON.stringify(array));
}



// Compression libs (wip)
var compressionloaded = false;
var compressionscript = document.createElement('script');
compressionscript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.4/pako.min.js';
compressionscript.onload = function() {
    compressionloaded = true
};
document.head.appendChild(compressionscript);
async function waitForCompressionLoaded() {
    return new Promise((resolve, reject) => {
        const checkInterval = 100;
        const maxAttempts = 300;
        let attempts = 0;
        if (compressionloaded) {
            resolve();
        }
        const intervalId = setInterval(() => {
            if (compressionloaded) {
                clearInterval(intervalId);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(intervalId);
                reject(new Error('Timeout: compressionLoaded did not become true.'));
            }
            attempts++;
        }, checkInterval);
    });
}

async function compress(str) {
    await waitForCompressionLoaded();
    try {
        const compressed = pako.deflate(str); // Compress to a Uint8Array
        return String.fromCharCode.apply(null, compressed); // Convert Uint8Array to string
    } catch(err) {
        console.warn(err);
        return str;
    }
}
async function decompress(str) {
    await waitForCompressionLoaded();
    try {
        const charData = str.split('').map(function(c) {
            return c.charCodeAt(0);
        });
        const binData = new Uint8Array(charData);
        return pako.inflate(binData, { to: 'string' });
    } catch(err) {
        console.warn(err);
        return str;
    }
}



// Ruffle vars
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
    cloudIcon.style.top = '-1px';
    cloudIcon.style.left = '5';
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
        setTimeout(() => cloudIcon.remove(), 100);
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

var unsavedfiles = [];
async function userSaveIntervalFunction() {
    showCloudIcon();
    unsavedfiles = [];

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
        var fileNames2 = [];

        for (let data of dataURIs) {
            await saveUserData(data.filename, data.data);
            var datacheck = await loadUserData(data.filename);
            if (datacheck == "" || datacheck == "ERROR: file does not exist") {
                console.warn("Unsaved file", data.filename);
                unsavedfiles.push(data.filename);
            } else {
                fileNames2.push(data.filename);
            }
        }

        await saveUserFilesList(fileNames2);

        for (let filename of unsavedfiles) {
            showNotification('Unable to save '+filename, '#f8f3d7');
            await new Promise(resolve => setTimeout(resolve, 3000));
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
        setTimeout(function(){
            showNotification('Please do not close the game while the save icon is blinking', '#e2e3e5');
        }, 3000);
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
                        if (content == "ERROR: file does not exist") {
                            localStorage.setItem(filename.slice(0, -4), content); // Store the data into local storage
                            dataURIs.push({ filename: filename });
                        } else {
                            throw new Error("Unable to load " + filename);
                        }
                    }
                }

                document.cookie = 'dataLoaded=true; max-age=60';
                location.reload();
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
