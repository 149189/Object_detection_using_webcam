let voiceSpoken = false;

async function startWebcam() {
    const videoElement = document.getElementById('webcam');
    if (navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        return new Promise(resolve => {
            videoElement.onloadedmetadata = () => {
                resolve(videoElement);
            };
        });
    } else {
        alert('getUserMedia is not supported by this browser');
    }
}

async function detectObjects() {
    const videoElement = await startWebcam();
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoElement.width;
    canvas.height = videoElement.height;

    
    const model = await cocoSsd.load();

   
    async function detectFrame() {
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        const predictions = await model.detect(canvas);

       
        if (predictions.length > 0 && !voiceSpoken) {
            const text = `${predictions[0].class} has been detected`;
            speak(text);
            voiceSpoken = true;
        }

       
        if (predictions.length === 0) {
            voiceSpoken = false;
        }

      
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
}


function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
}


window.onload = detectObjects;
