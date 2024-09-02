
// Server libs
async function saveToServer(variableName, content) {
  var serverURL = 'https://snapextensions.uni-goettingen.de/handleTextfile.php';
  var url =
    serverURL +
    '?type=write' +
    '&content=' +
    encodeURIComponent(content) +
    '&filename=./textfiles/' +
    encodeURIComponent(variableName);

  fetch(url)
    .then(function (response) {
      return response.text();
    })
    .then(function (result) {
      if (result === 'ok') {
        return(true);
      } else {
        return(false);
      }
    })
    .catch(function (error) {
      console.error('Failed to save data to the server:', error);
      return(false);
    });
}

async function loadFromServer(variableName) {
  var serverURL = 'https://snapextensions.uni-goettingen.de/handleTextfile.php';
  var url =
    serverURL +
    '?type=read' +
    '&filename=./textfiles/' +
    encodeURIComponent(variableName);

  fetch(url)
    .then(function (response) {
      return response.text();
    })
    .then(function (content) {
      return(content);
    })
    .catch(function (error) {
      console.error('Failed to load data from the server:', error);
      return("can't get data");
    });
}

async function loadUserData(filename) {
  var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
  return loadFromServer("Rufflesavedatafromid"+passwordMD5hash+filename);
}
async function saveUserData(filename, txtdata) {
  var passwordMD5hash = document.cookie.split('; ').find(row => row.startsWith('rufflesave=')).split('=')[1];
  return saveToServer("Rufflesavedatafromid"+passwordMD5hash+filename, txtdata);
}

// Autosave ui and function code
function showCloudIcon() { // Ignore that it's called "Cloud Icon" when it's clearly a floppy disc
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

    let style = document.createElement('style');
    style.textContent = `
        @keyframes fade {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    cloudIcon.style.animation = 'fade 2s infinite';
}

function hideCloudIcon() {
    let cloudIcon = document.getElementById('saveCloudIcon');
    if (cloudIcon) {
        cloudIcon.remove();
    }
}

function showLoader() {
    let loader = document.createElement('div');
    loader.id = 'dataLoader';
    loader.textContent = '💿';
    loader.style.position = 'fixed';
    loader.style.top = '-3px';
    loader.style.left = '0';
    loader.style.fontSize = '50px';
    loader.style.opacity = '1';
    loader.style.transition = 'opacity 0.5s ease-in-out';
    loader.style.zIndex = '9999999999999999';
    document.body.appendChild(loader);
}

function hideLoader() {
    let loader = document.getElementById('dataLoader');
    if (loader) {
        loader.remove();
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

        for (let data of dataURIs) {
            showLoader();
            await saveUserData(data.filename, data.data);
            hideLoader();
        }
    } catch (error) {
        showNotification('An error occurred while saving data.', '#f8d7da');
        console.error(error);
    } finally {
        hideCloudIcon();
    }
}

async function loadSavedDataAfterRuffle() {
    setTimeout(async () => {
        try {
            let dataURIs = [];
            Object.keys(localStorage).forEach(function(key) {
                let solName = key.split('/').pop();
                let solData = localStorage.getItem(key);
                if (isB64SOL(solData)) {
                    dataURIs.push({ filename: solName + '.sol', data: solData });
                }
            });

            showLoader();

            for (let data of dataURIs) {
                await loadUserData(data.filename);
            }

            hideLoader();
        } catch (error) {
            showNotification('An error occurred while loading data.', '#f8d7da');
            console.error(error);
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

showNotification('Please do not close the game while the save icon is blinking', '#e2e3e5');

setInterval(userSaveIntervalFunction, 10000);
loadSavedDataAfterRuffle();
