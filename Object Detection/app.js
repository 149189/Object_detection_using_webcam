let lastSpokenPrediction = null;

async function startWebcam() {
    const videoElement = document.getElementById('webcam');
    if (navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoElement.srcObject = stream;
            return new Promise(resolve => {
                videoElement.onloadedmetadata = () => {
                    resolve(videoElement);
                };
            });
        } catch (error) {
            alert('Error accessing the webcam: ' + error.message);
        }
    } else {
        alert('getUserMedia is not supported by this browser');
    }
}

async function detectObjects() {
    const videoElement = await startWebcam();
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    try {
        const model = await cocoSsd.load();

        async function detectFrame() {
            context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
            const predictions = await model.detect(canvas);

            if (predictions.length > 0) {
                const currentPrediction = predictions[0].class;
                if (currentPrediction !== lastSpokenPrediction) {
                    speak(`${currentPrediction} has been detected`);
                    lastSpokenPrediction = currentPrediction;
                }
            } else {
                lastSpokenPrediction = null;
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            predictions.forEach(prediction => {
                context.beginPath();
                context.rect(...prediction.bbox);
                context.lineWidth = 2;
                context.strokeStyle = 'red';
                context.fillStyle = 'red';
                context.stroke();
                context.fillText(`${prediction.class}: ${prediction.score.toFixed(2)}`, prediction.bbox[0], prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10);
            });

            requestAnimationFrame(detectFrame);
        }

        detectFrame();
    } catch (error) {
        alert('Error loading the model: ' + error.message);
    }
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
   
    const femaleVoice = voices.find(voice => voice.name.includes("Female") || voice.gender === "female" || voice.name.includes("woman"));
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    } else if (voices.length > 0) {
       
        utterance.voice = voices[0];
    }
    speechSynthesis.speak(utterance);
}


window.speechSynthesis.onvoiceschanged = detectObjects;
