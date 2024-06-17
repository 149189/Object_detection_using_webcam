import React, { useEffect, useRef, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [lastSpokenPrediction, setLastSpokenPrediction] = useState(null);

  useEffect(() => {
    const startWebcam = async () => {
      if (navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
      } else {
        alert('getUserMedia is not supported by this browser');
      }
    };

    const detectObjects = async () => {
      const videoElement = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      videoElement.onloadedmetadata = async () => {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;

        const model = await cocoSsd.load();

        const detectFrame = async () => {
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const predictions = await model.detect(canvas);

          if (predictions.length > 0) {
            const currentPrediction = predictions[0].class;
            if (currentPrediction !== lastSpokenPrediction) {
              speak(`${currentPrediction} has been detected`);
              setLastSpokenPrediction(currentPrediction);
            }
          } else {
            setLastSpokenPrediction(null);
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
        };

        detectFrame();
      };
    };

    startWebcam();
    detectObjects();

    const speak = (text) => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => voice.name.includes("Female") || voice.gender === "female" || voice.name.includes("woman"));
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      } else if (voices.length > 0) {
        utterance.voice = voices[0];
      }
      speechSynthesis.speak(utterance);
    };

    window.speechSynthesis.onvoiceschanged = () => {
      speak("");
    };
  }, [lastSpokenPrediction]);

  return (
    <div>
      <video id="webcam" autoPlay playsInline ref={videoRef} style={{ position: 'absolute', top: 0, left: 0 }}></video>
      <canvas id="canvas" ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}></canvas>
    </div>
  );
};

export default App;
