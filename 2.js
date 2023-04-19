var s = 'http://clips.vorwaerts-gmbh.de/VfE_html5.mp4';
fetch(s).then((res) => res.blob()).then((blob) => {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(blob);
    fileReader.onload = () => {
        const videoEl = document.createElement('video');
        videoEl.src = fileReader.result;
        videoEl.controls = true;
        document.body.appendChild(videoEl);
    };
});
