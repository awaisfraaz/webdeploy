function switchTab(tabName) {
    // Hide all sections
    document.getElementById('stream-key-section').style.display = 'none';
    document.getElementById('camera-section').style.display = 'none';

    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Show selected section
    document.getElementById(tabName + '-section').style.display = 'block';

    // Add active class to clicked tab
    // This is a simple way, assuming the order matches or finding by text
    // For robustness, we can pass the element itself, but let's just find it
    if (tabName === 'stream-key') {
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        stopCamera(); // Stop camera if switching away
    } else {
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Camera handling
let currentStream = null;

document.getElementById('startCameraBtn').addEventListener('click', async () => {
    try {
        const constraints = {
            video: true,
            audio: true
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const videoElement = document.getElementById('cameraFeed');
        videoElement.srcObject = stream;
        videoElement.style.display = 'block';
        document.querySelector('.placeholder-content').style.display = 'none';

        currentStream = stream;

        // Populate devices (simplified)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoSelect = document.getElementById('cameraSelect');
        const audioSelect = document.getElementById('micSelect');

        videoSelect.innerHTML = '';
        audioSelect.innerHTML = '';

        devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `${device.kind} - ${device.deviceId.slice(0, 5)}...`;

            if (device.kind === 'videoinput') {
                videoSelect.appendChild(option);
            } else if (device.kind === 'audioinput') {
                audioSelect.appendChild(option);
            }
        });

    } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please allow permissions.");
    }
});

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
        document.getElementById('cameraFeed').style.display = 'none';
        document.querySelector('.placeholder-content').style.display = 'block';
    }
}

document.getElementById('goLiveBtn').addEventListener('click', () => {
    alert('Going Live functionality is simulated.');
});