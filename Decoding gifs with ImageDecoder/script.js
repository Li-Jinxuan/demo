const select = document.querySelector("select")
const img = document.querySelector("img")
const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d")
const input = document.querySelector("input")
const pre = document.querySelector("pre")
const bw = document.querySelector("#bw")
const rand = document.querySelector("#rand")

let offscreenCanvas
let offscreenCtx

let imageDecoder = null
let imageIndex = 0

let factor = parseFloat(input.value)
let url = select.options[select.options.selectedIndex].value
img.src = url
let effect = bw.checked ? "bw" : "rand"

select.addEventListener("change", () => {
    url = select.options[select.options.selectedIndex].value
    img.src = url
    init()
})

const effectChange = () => {
    effect = bw.checked ? "bw" : "rand"
}
bw.addEventListener("change", effectChange)
rand.addEventListener("change", effectChange)

input.addEventListener("change", () => {
    factor = 1 / parseFloat(input.value)
})

const renderImage = async (imageFrame, track) => {
    offscreenCtx.drawImage(imageFrame.image, 0, 0)
    const temp = offscreenCtx.getImageData(
        0,
        0,
        offscreenCanvas.width,
        offscreenCanvas.height
    )
    for (let i = 0, len = temp.data.length; i < len; i += 4)
    {
        if (effect === "bw")
        {
            const avg = (temp.data[i] + temp.data[i + 1] + temp.data[i + 2]) / 3
            temp.data[i] = avg
            temp.data[i + 1] = avg
            temp.data[i + 2] = avg
        }
        else
        {
            temp.data[i] = Math.min(
                temp.data[i] + Math.floor(Math.random() * 50) + 1,
                255
            )
            temp.data[i + 1] = Math.min(
                temp.data[i + 1] + Math.floor(Math.random() * 50) + 1,
                255
            )
            temp.data[i + 2] = Math.min(
                temp.data[i + 2] + Math.floor(Math.random() * 50) + 1,
                255
            )
        }
    }
    ctx.putImageData(temp, 0, 0)

    if (track.frameCount === 1)
    {
        return
    }
    if (imageIndex + 1 >= track.frameCount)
    {
        imageIndex = 0
    }
    const nextImageFrame = await imageDecoder.decode({frameIndex: ++imageIndex})
    window.setTimeout(() => {
        renderImage(nextImageFrame, track)
    }, (imageFrame.image.duration / 1000) * factor)
}

const decodeImage = async imageByteStream => {
    imageDecoder = new ImageDecoder({
        data: imageByteStream,
        type: 'image/gif',
    })
    const imageFrame = await imageDecoder.decode({frameIndex: imageIndex})
    const track = imageDecoder.tracks.selectedTrack
    await renderImage(imageFrame, track)
    pre.textContent = `Frame Count: ${track.frameCount}
Type: ${imageDecoder.type}
Repetition Count: ${track.repetitionCount}`
}

const getDimensions = async blob => {
    return new Promise(resolve => {
        const img = document.createElement("img")
        img.addEventListener("load", e => {
            return resolve({width: img.naturalWidth, height: img.naturalHeight})
        })
        img.src = URL.createObjectURL(blob)
    })
}

const init = async () => {
    const message = '😔 Your browser does not support the ImageDecoder API.\n\n🚩 Try launching Chrome Canary with the --enable-blink-features=WebCodecs flag.'
    if (!('ImageDecoder' in window))
    {
        pre.textContent = message
        return alert(message)
    }
    const response = await fetch('./giphy.gif')
    const clone = response.clone()
    const blob = await response.blob()
    const {width, height} = await getDimensions(blob)
    canvas.width = width
    canvas.height = height
    offscreenCanvas = new OffscreenCanvas(width, height)
    offscreenCtx = offscreenCanvas.getContext("2d")
    decodeImage(clone.body)
}

init()
