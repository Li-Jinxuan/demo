importScripts("../third_party/mp4boxjs/mp4box.all.min.js")

// Wraps an MP4Box File as a WritableStream underlying sink.
class MP4FileSink {
    #setStatus = null
    #file = null
    #offset = 0

    constructor(file, setStatus) {
        this.#file = file
        this.#setStatus = setStatus
    }

    write(chunk) {
        // MP4Box.js requires buffers to be ArrayBuffers, but we have a Uint8Array.
        const buffer = new ArrayBuffer(chunk.byteLength)
        new Uint8Array(buffer).set(chunk)

        // Inform MP4Box where in the file this chunk is from.
        buffer.fileStart = this.#offset
        this.#offset += buffer.byteLength

        // Append chunk.
        this.#setStatus("fetch", (this.#offset / (1024 ** 2)).toFixed(1) + " MiB")
        this.#file.appendBuffer(buffer)
    }

    close() {
        this.#setStatus("fetch", "Done")
        this.#file.flush()
    }
}

// Demuxes the first video track of an MP4 file using MP4Box, calling
// `onConfig()` and `onChunk()` with appropriate WebCodecs objects.
class MP4Demuxer {
    #onConfig = null
    #onChunk = null
    #setStatus = null
    #file = null

    constructor(uri, {onConfig, onChunk, setStatus}) {
        this.#onConfig = onConfig
        this.#onChunk = onChunk
        this.#setStatus = setStatus

        console.log(45645, setStatus)
        // Configure an MP4Box File for demuxing.
        this.#file = MP4Box.createFile()
        this.#file.onError = error => setStatus("demux", error)
        this.#file.onReady = this.#onReady.bind(this)
        this.#file.onSamples = this.#onSamples.bind(this)

        this.isTest = 0

        // Fetch the file and pipe the data through.
        const fileSink = new MP4FileSink(this.#file, setStatus)
        console.log(fileSink)
        fetch(uri).then(response => {
            // highWaterMark should be large enough for smooth streaming, but lower is
            // better for memory usage.
            response.body.pipeTo(new WritableStream(fileSink, {highWaterMark: 2}))
            console.log(56446)
        })
    }

    // Get the appropriate `description` for a specific track. Assumes that the
    // track is H.264 or H.265.
    #description(track) {
        console.log(55555, track)
        const trak = this.#file.getTrackById(track.id)
        console.log(4545, trak)
        for (const entry of trak.mdia.minf.stbl.stsd.entries)
        {
            console.log('eeeeeee', entry)
            if (entry.avcC || entry.hvcC)
            {
                const stream = new DataStream(undefined, 0, DataStream.BIG_ENDIAN)
                if (entry.avcC)
                {
                    entry.avcC.write(stream)
                }
                else
                {
                    entry.hvcC.write(stream)
                }
                return new Uint8Array(stream.buffer, 8)  // Remove the box header.
            }
        }
        throw "avcC or hvcC not found"
    }

    #onReady(info) {
        console.log(11111, info)
        this.#setStatus("demux", "Ready")
        const track = info.videoTracks[0]
        console.log(22, track)

        // Generate and emit an appropriate VideoDecoderConfig.
        this.#onConfig(
            {
                codec: track.codec,
                codedHeight: track.video.height,
                codedWidth: track.video.width,
                description: this.#description(track),
            }
        )

        // Start demuxing.
        this.#file.setExtractionOptions(track.id)
        this.#file.start()
    }

    #onSamples(track_id, ref, samples) {
        console.log(456456, track_id, ref, samples)
        console.log('ttttttt', this.isTest)
        // Generate and emit an EncodedVideoChunk for each demuxed sample.
        for (const sample of samples)
        {
            // if (this.isTest <= 5)
            // {
            this.#onChunk(new EncodedVideoChunk({
                type: sample.is_sync ? "key" : "delta",
                timestamp: 1e6 * sample.cts / sample.timescale,
                duration: 1e6 * sample.duration / sample.timescale,
                data: sample.data
            }))

            this.isTest += 1
            // }
        }
    }
}
