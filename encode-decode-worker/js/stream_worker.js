'use strict'

let pl

self.addEventListener('message', async function(e) {
    console.log(456465, e)
    // In this demo, we expect at most two messages, one of each type.
    let type = e.data.type

    if (type == "stop")
    {
        self.postMessage({text: 'Stop message received.'})

        return
    }
    else if (type != "stream")
    {
        self.postMessage({severity: 'fatal', text: 'Invalid message received.'})
        return
    }
    // We received a "stream" event
    self.postMessage({text: 'Stream event received.'})

    try
    {
        pl = new pipeline(e.data)
        pl.start()
    }
    catch (e)
    {
        self.postMessage({severity: 'fatal', text: `Pipeline creation failed: ${e.message}`})
        return
    }
}, false)

class pipeline {
    constructor(eventData) {
        this.inputStream = eventData.streams.input
        this.outputStream = eventData.streams.output
        this.config = eventData.config
    }

    DecodeVideoStream(self) {
        return new TransformStream(
            {
                start(controller) {
                    this.decoder = new VideoDecoder({
                        output: frame => controller.enqueue(frame),
                        error: (e) => {
                            self.postMessage({severity: 'fatal', text: `Init Decoder error: ${e.message}`})
                        }
                    })
                },
                transform(chunk, controller) {
                    if (chunk.type == "config")
                    {
                        let config = JSON.parse(chunk.config)
                        VideoDecoder.isConfigSupported(config).then((decoderSupport) => {
                            if (decoderSupport.supported)
                            {
                                this.decoder.configure(decoderSupport.config)
                                self.postMessage({text: 'Decoder successfully configured:\n' + JSON.stringify(decoderSupport.config)})
                            }
                            else
                            {
                                self.postMessage({severity: 'fatal', text: 'Config not supported:\n' + JSON.stringify(decoderSupport.config)})
                            }
                        })
                            .catch((e) => {
                                self.postMessage({severity: 'fatal', text: `Configuration error: ${e.message}`})
                            })
                    }
                    else
                    {
                        this.decoder.decode(chunk)
                    }
                }
            })
    }

    EncodeVideoStream(self, config) {
        return new TransformStream({
            start(controller) {
                this.encoder = new VideoEncoder({
                    output: (chunk, cfg) => {
                        console.log(144, cfg.decoderConfig)
                        if (cfg.decoderConfig)
                        {
                            const decoderConfig = JSON.stringify(cfg.decoderConfig)
                            self.postMessage({text: 'Configuration: ' + decoderConfig})
                            const configChunk =
                                {
                                    type: "config",
                                    seqNo: 0,
                                    keyframeIndex: 0,
                                    deltaframeIndex: 0,
                                    timestamp: 0,
                                    pt: 0,
                                    config: decoderConfig
                                }
                            controller.enqueue(configChunk)
                        }
                        controller.enqueue(chunk)
                    },
                    error: (e) => {
                        self.postMessage({severity: 'fatal', text: `Encoder error: ${e.message}`})
                    }
                })
                VideoEncoder.isConfigSupported(config).then((encoderSupport) => {
                    if (encoderSupport.supported)
                    {
                        this.encoder.configure(encoderSupport.config)
                        self.postMessage({text: 'Encoder successfully configured:\n' + JSON.stringify(encoderSupport.config)})
                    }
                    else
                    {
                        self.postMessage({severity: 'fatal', text: 'Config not supported:\n' + JSON.stringify(encoderSupport.config)})
                    }
                }).catch((e) => {
                    self.postMessage({severity: 'fatal', text: `Configuration error: ${e.message}`})
                })
            },
            transform(frame, controller) {
                try
                {
                    this.encoder.encode(frame)
                }
                catch (e)
                {
                    self.postMessage({severity: 'fatal', text: 'Encoder Error: ' + e.message})
                }
                frame.close()
            }
        })
    }

    async start() {
        self.postMessage({text: 'Start method called.'})
        try
        {
            await this.inputStream
                .pipeThrough(this.EncodeVideoStream(self, this.config))
                .pipeThrough(this.DecodeVideoStream(self))
                .pipeTo(this.outputStream)
        }
        catch (e)
        {
            self.postMessage({severity: 'fatal', text: `start error: ${e.message}`})
        }
    }
}
