const video = document.getElementById('webcam');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');


async function setupWebcam(){
    return new Promise((resolve,reject)=>{
        const constraints= {
            video: true
        };
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                 video.srcObject= stream;
                 video.addEventListener('loadeddata',()=>{
                     resolve();
                 });
                });
    })
    .catch((err)=>{
        reject(err);
    });
}

async function loadmodel(){
    const predictions = await model.detect(video);
    ctx.clearRect(0,0,canvas.clientWidth,canvas.height);
    ctx.drawImage(video,0,0,canvas.width , canvas.height);

    predictions.forEach(predictions=>{
        if(predictions.score>0.66){
            const[x,y,width,height] = predictions.bbox;
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 4;
            ctx.strokeRect(x,y,width,height);
            ctx.font = '18px Arial';
            ctx.fillStyle = "red";
            ctx.fillText(predictions.class, x, y >10? y-5 : y+20);
        }
    });
}

async function main(){
    await setupWebcam();
    const model = await loadmodel();
    setInterval(()=>{
        detectObjects(model);
    }, 100);
}
main();