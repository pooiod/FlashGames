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



// ruffle vars
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



// everything else
function showNotification(message, color, time) {
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
    }, time || 2000);
}

var savekeydebounce = false;

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

    window.saveButton = saveButton;

    saveButton.addEventListener('click', async function() {
        if (savekeydebounce) {
            showNotification("Spamming may corrupt your save data!", "#ffbaba");
            return;
        }
        savekeydebounce = true;
        saveButton.style.display = 'none';
        showSaveProgressBar();
        await savePackedData();
        saveButton.style.display = 'block';
    });

    if (false) { // replaced by context menu button
        rufflecontainer.appendChild(saveButton);
    } else {
        setTimeout(function(){
            showNotification("Always save with the context menu before leaving!", "#fff");
        }, 1000);
    }
}

// does not work on all games
document.addEventListener('keydown', async function(e) {
    if (e.ctrlKey && e.key === 's') {
        if (savekeydebounce) {
            showNotification("Spamming may corrupt your save data!", "#ffbaba");
            return;
        }
        savekeydebounce = true;
        e.preventDefault();
        showSaveProgressBar();
        await savePackedData();
    }
});

document.addEventListener('contextmenu', function(e) {
    function addButton(text, onClick) {
        const contextMenu = shadowRoot.querySelector('#context-menu');
        
        if (contextMenu) {
            const menuItem = document.createElement('li');
            menuItem.className = 'menu-item';
            menuItem.textContent = text;
    
            menuItem.addEventListener('click', async function(e) {
                e.preventDefault();
                await onClick(e);
            });
    
            contextMenu.appendChild(menuItem);
        }
    }
    function addSeparator() {
        const contextMenu = shadowRoot.querySelector('#context-menu');
        
        if (contextMenu) {
            const separator = document.createElement('li');
            separator.className = 'menu-separator';
            separator.innerHTML = '<hr>';
    
            contextMenu.appendChild(separator);
        }
    }

    const contextMenu = shadowRoot.querySelector('#context-menu');
    
    if (contextMenu && contextMenu.lastElementChild) {
        contextMenu.removeChild(contextMenu.lastElementChild);
    }

    addButton('Save data to cloud', async function() {
        shadowRoot.querySelector('#context-menu-overlay').classList.add("hidden");
        if (savekeydebounce) {
            showNotification("Spamming may corrupt your save data!", "#ffbaba");
            return;
        }
        savekeydebounce = true;
        showSaveProgressBar();
        await savePackedData();
    });
    addButton('Back to games', async function() {
        shadowRoot.querySelector('#context-menu-overlay').classList.add("hidden");
        window.location.href = "/";
    });
});

setTimeout(function(){
    const modalAreaDiv = shadowRoot.querySelector('#modal-area > div');

    if (modalAreaDiv) {
        const modalButton = document.createElement('span');
        modalButton.className = 'modal-button';
        modalButton.textContent = 'Save data to cloud';
        modalButton.style.marginLeft = '5px';

        modalButton.addEventListener('click', async function(e) {
            e.preventDefault();
            if (savekeydebounce) {
                showNotification("Spamming may corrupt your save data!", "#ffbaba");
                return;
            }
            savekeydebounce = true;
            showSaveProgressBar();
            await savePackedData();
        });

        modalAreaDiv.appendChild(modalButton);
    }
}, 900);

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
        updateSaveProgressBar(100);
        await saveUserData(`completeSave_part${chunks.length + 1}`, "end");
        console.log("Data saved successfully.");

        // showNotification("Your data has been saved.", "#fff", 1000);
        hideSaveProgressBar();
        savekeydebounce = false;

        return true;
    } catch (error) {
        console.error("Failed to save packed data", error);
    }
}

// Show save progress bar
function showSaveProgressBar() {
    hideSaveProgressBar();

    const progressBarContainer = document.createElement('div');
    progressBarContainer.id = 'saveProgressBarContainer';
    progressBarContainer.style.position = 'absolute';
    progressBarContainer.style.top = '0';
    progressBarContainer.style.left = '0';
    progressBarContainer.style.width = '100%';
    progressBarContainer.style.height = '10px';
    // progressBarContainer.style.backgroundColor = '#5475ba';
    progressBarContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    progressBarContainer.style.pointerEvents = "none";
    progressBarContainer.style.zIndex = '99999999999';
    progressBarContainer.style.opacity = '0'; // Start hidden
    progressBarContainer.style.transform = 'translateY(-100%)'; // Slide up
    progressBarContainer.style.transition = 'opacity 0.7s ease-in-out, transform 0.7s ease-in-out';
    
    const progressBar = document.createElement('div');
    progressBar.style.height = '100%';
    progressBar.style.backgroundColor = '#4caf50';
    progressBar.style.width = '0%';
    progressBar.style.transition = 'width 0.5s ease-in-out';
    
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
        const progressBar = progressBarContainer.firstChild;
        progressBar.style.width = '100%';
    }

    setTimeout(() => {
        const progressBarContainer = shadowRoot.getElementById('saveProgressBarContainer');
        if (progressBarContainer) {
            progressBarContainer.style.opacity = '0'; // Fade out
            progressBarContainer.style.transform = 'translateY(-100%)'; // Slide up
            setTimeout(() => {
                progressBarContainer.remove();
                window.saveProgressBar = null; // Clear reference to avoid issues
            }, 500); // Wait for animation to finish
        }
    }, 700);
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

    showLoadingBar(); // Show loading bar in Ruffle container

    // Remove current Ruffle instance
    let ruffleObject = document.querySelector('#gameContainer > ruffle-object:nth-child(1)');
    if (ruffleObject) {
        ruffleObject.remove();
    }

    try {
        while (true) {
            partData = await loadUserData(`completeSave_part${partIndex}`);
            if (partData === "end") break;
            if (partData === "ERROR: file does not exist") {
                if (confirm("Data load error, continue?")) {
                    break
                } else {
                    if (confirm("Replace cloud data with local data?")) {
                        const overlay = document.createElement('div');
                        overlay.id = 'loadingOverlay';
                        overlay.style.position = 'fixed';
                        overlay.style.top = '0';
                        overlay.style.left = '0';
                        overlay.style.width = '100%';
                        overlay.style.height = '100%';
                        overlay.style.backgroundColor = '#37528c';
                        overlay.style.zIndex = '99999999';
                        overlay.style.transition = 'opacity 0.5s ease-in-out';
                        document.body.appendChild(overlay);
                    
                        setTimeout(async function(){
                            let ruffleObject = document.querySelector('#gameContainer > ruffle-object:nth-child(1)');
                            if (ruffleObject) {
                                ruffleObject.remove();
                            }
                    
                            showSaveProgressBar();
                            await savePackedData();
                    
                            setTimeout(() => {
                                window.location.reload();
                            }, 1000);
                        }, 100);

                        return;
                    } else {
                        window.location.href = "/";
                    }
                }
            }
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

// Show loading progress bar in Ruffle container
function showLoadingBar() {
    const loadingBarContainer = document.createElement('div');
    loadingBarContainer.id = 'loadingProgressBarContainer';
    loadingBarContainer.style.position = 'absolute';
    loadingBarContainer.style.top = '0';
    loadingBarContainer.style.left = '0';
    loadingBarContainer.style.width = '100%';
    loadingBarContainer.style.height = '10px';
    // loadingBarContainer.style.backgroundColor = '#5475ba';
    loadingBarContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    loadingBarContainer.style.pointerEvents = "none";
    loadingBarContainer.style.zIndex = '99999999999';
    loadingBarContainer.style.opacity = '0'; // Start hidden
    loadingBarContainer.style.transform = 'translateY(-100%)'; // Slide up
    loadingBarContainer.style.transition = 'opacity 0.7s ease-in-out, transform 0.7s ease-in-out';
    
    const loadingBar = document.createElement('div');
    loadingBar.style.height = '100%';
    loadingBar.style.backgroundColor = '#2196F3';
    loadingBar.style.width = '0%';
    loadingBar.style.transition = 'width 0.5s ease-in-out';
    
    loadingBarContainer.appendChild(loadingBar);
    rufflecontainer.appendChild(loadingBarContainer);

    // Trigger the animation to show the bar
    setTimeout(() => {
        loadingBarContainer.style.opacity = '1';
        loadingBarContainer.style.transform = 'translateY(0)'; // Slide down
    }, 100);
    
    window.loadingProgressBar = loadingBar; // Make loading progress bar accessible globally
}

// Update loading progress bar
function updateLoadingBar(percentage) {
    if (window.loadingProgressBar) {
        window.loadingProgressBar.style.width = percentage + '%';
    }
}

// Hide loading progress bar
function hideLoadingBar() {
    window.loadingProgressBar.style.width = '100%';
    setTimeout(() => {
        const loadingBarContainer = document.getElementById('loadingProgressBarContainer');
        if (loadingBarContainer) {
            loadingBarContainer.style.opacity = '0'; // Fade out
            loadingBarContainer.style.transform = 'translateY(-100%)'; // Slide up
            setTimeout(() => {
                loadingBarContainer.remove();
                window.loadingProgressBar = null; // Clear reference to avoid issues
            }, 700); // Wait for animation to finish
        }
    }, 300);
}

// Automatically load data when the page starts, then reload
async function autoLoadAndReload() {
    if (!document.cookie.split('; ').find(row => row.startsWith('dataLoaded='))) {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#37528c';
        overlay.style.zIndex = '9999999999';
        overlay.style.transition = 'opacity 0.5s ease-in-out';
        document.body.appendChild(overlay);

        await loadPackedData();
        document.cookie = 'dataLoaded=true; max-age=60'; // Prevent endless reloading

        setTimeout(() => {
            location.reload();
        }, 700);
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
if (!new URLSearchParams(window.location.search).get('transfer')) {
    autoLoadAndReload();
    setInterval(async function(){
        if (!shadowRoot.getElementById('saveProgressBarContainer') && document.hasFocus()){
            showSaveProgressBar();
            await savePackedData();
        }
    }, 60 * 1000);
} else {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(255, 255, 255, 1)';
    overlay.style.zIndex = '99999999';
    overlay.style.transition = 'opacity 0.5s ease-in-out';
    document.body.appendChild(overlay);

    setTimeout(async function(){
        let ruffleObject = document.querySelector('#gameContainer > ruffle-object:nth-child(1)');
        if (ruffleObject) {
            ruffleObject.remove();
        }

        showSaveProgressBar();
        await savePackedData();

        setTimeout(() => {
            window.location.href = "/";
        }, 700);
    }, 100);
}
