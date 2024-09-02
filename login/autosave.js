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

// Autosave ui and function code
function showCloudIcon() {
    let cloudIcon = document.createElement('div');
    cloudIcon.id = 'saveCloudIcon';
    cloudIcon.textContent = '💾';
    cloudIcon.style.position = 'fixed';
    cloudIcon.style.top = '-5px';
    cloudIcon.style.left = '0';
    cloudIcon.style.fontSize = '50px';
    cloudIcon.style.opacity = '1';
    cloudIcon.style.transition = 'opacity 0.5s ease-in-out';
    cloudIcon.style.zIndex = '9999999999999999';
    document.body.appendChild(cloudIcon);
    cloudIcon.style.animation = 'fade 2s infinite';
}

function hideCloudIcon() {
    let cloudIcon = document.getElementById('saveCloudIcon');
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
    loader.style.width = '100%';
    loader.style.height = '100%';
    loader.style.backgroundColor = '#fff';
    loader.style.display = 'flex';
    loader.style.justifyContent = 'center';
    loader.style.alignItems = 'center';
    loader.style.zIndex = '9999999999999999';

    let spinner = document.createElement('div');
    spinner.textContent = '💿';
    spinner.style.fontSize = '100px';
    spinner.style.animation = 'fade 2s infinite';

    let message = document.createElement('div');
    message.textContent = 'Loading save data';
    message.style.color = '#000';
    message.style.fontSize = '24px';
    message.style.marginTop = '20px';

    loader.appendChild(spinner);
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
    document.body.appendChild(notification);

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
    }
    setTimeout(async () => {
        try {
            if (document.cookie.split('; ').find(row => row.startsWith('dataLoaded='))) {
                // Clear existing saves
                Object.keys(localStorage).forEach(async function(key) {
                    let solData = localStorage.getItem(key);
                    if (isB64SOL(solData)) {
                        localStorage.removeItem(key);
                    }
                });

                let fileNames = await loadUserFilesList() || [];
                let dataURIs = [];

                for (let filename of fileNames) {
                    if (filename.endsWith('.sol')) {
                        let content = await loadUserData(filename);
                        localStorage.setItem(filename, content); // Store the data into local storage
                        dataURIs.push({ filename: filename });
                    }
                }

                document.cookie = 'dataLoaded=true; max-age=3600'; // 1 hour
                location.reload();
            } else {
                document.cookie = 'dataLoaded=true; max-age=3600'; // 1 hour
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

document.addEventListener('keydown', handleKeyDown);

showNotification('Please do not close the game while the save icon is blinking', '#e2e3e5');

setInterval(userSaveIntervalFunction, 600000);
loadSavedDataAfterRuffle();
