import 'bulma/css/bulma.css'
// import * as Cookies from 'js-cookie'
import { merge, debounce } from 'lodash'
import '@/assets/fonts/css/icons.css'

import '@/assets/global.css'
import './meeting.css'
import StreamWatcher from '@/utils/StreamWatcher'
import ButtonControl from '@/utils/ButtonControl'
import Notify from '@/utils/Notify'
import {read} from '@/utils/Storage'
import { customRender } from '@/utils/Render'
import { SHARE_ID, RESOLUTION_ARR } from '@/utils/Settings'

(function($) {
    const AgoraRTC = require('../../library/AgoraRTC.js')


    let options = {},
        client = {},
        localStream = {},
        streamList = [],
        shareClient = null,
        shareStream = null

    const optionsInit = () => {
        let options = {
            videoProfile: (read('videoProfile')).split(',')[0] || '480p_4',
            channel: read('channel') || 'test',
            transcode: read('transcode') || 'interop',
            attendeeMode: read('attendeeMode') || 'video',
            baseMode: read('baseMode') || 'avc',
            displayMode: 1, // 0 Tile, 1 PIP, 2 screen share
            uid: undefined,  // In default it is dynamically generated
            resolution: undefined
        }

        let tempProfile = RESOLUTION_ARR[read('videoProfile')]
        options.resolution = tempProfile[0]/tempProfile[1] || 4/3

        if (options.baseMode === 'avc') {
            // agora video call
            options.key = 'PUT_YOUR_APPID_HERE'
        }
        else {
            // agora live
            options.key = 'PUT_YOUR_APPID_HERE'
        }

        return options
    }

    const UIInit = (options) => {
        $('#room-name').html(options.channel)
        switch (options.attendeeMode) {
            case 'audio-only':
                ButtonControl.hide(['.videoControlBtn', '.shareScreenBtn'])
                break;
            case 'audience':
                ButtonControl.hide(['.videoControlBtn', '.audioControlBtn', '.shareScreenBtn'])
                break;
            default:
            case 'video':
                break;
        }
    }

    const clientInit = (client, options) => {
        return new Promise((resolve, reject) => {
            client.init(options.key, () => {
                console.log("AgoraRTC client initialized")
                client.join(options.key, options.channel, options.uid, (uid) => {
                    console.log("User " + uid + " join channel successfully")
                    console.log(new Date().toLocaleTimeString())
                    // create localstream
                    resolve(uid)
                })
            })
        })
    }

    /**
     * 
     * @param {*} uid 
     * @param {*} options global option
     * @param {*} config stream config
     */
    const streamInit = (uid, options, config) => {
        let defaultConfig = {
            streamID: uid,
            audio: true,
            video: true,
            screen: false
        }

        switch (options.attendeeMode) {
            case 'audio-only':
                defaultConfig.video = false
                break;
            case 'audience':
                defaultConfig.video = false
                defaultConfig.audio = false
                break;
            default:
            case 'video':
                break;
        }

        let stream = AgoraRTC.createStream(merge(defaultConfig, config))
        stream.setVideoProfile(options.videoProfile)
        return stream
    }

    const shareStart = () => {
        shareClient = AgoraRTC.createClient({ mode: options.transcode })
        let shareOptions = merge(options, { uid: SHARE_ID })
        clientInit(shareClient, shareOptions).then(uid => {
            let config = {
                screen: true,
                video: false,
                audio: false,
                extensionId: 'minllpmhdgpndnkomcoccfekfegnlikg'
            }
            shareStream = streamInit(uid, shareOptions, config)
            let msg = `Please check if you have properly installed Agora Share
                                Extension, then try again. <a target="_blank" 
                                style="text-decoration: underline" 
                                href="https://chrome.google.com/webstore/detail/agora-web-screensharing/minllpmhdgpndnkomcoccfekfegnlikg?utm_source=chrome-ntp-icon">
                                The extension can be found here.</a>`
            shareStream.init(() => {
                shareStream.on('stopScreenSharing', () => {
                    shareEnd()
                    console.log('Stop Screen Sharing at'+new Date())
                })
                shareClient.publish(shareStream, err => {
                    console.log("Publish share stream error: " + err)
                    console.log("getUserMedia failed", err)
                })
            },(err) => {           
                Notify.danger(msg, 3000)
                console.log("getUserMedia failed", err)
                shareEnd()
            })
        })
    }

    const shareEnd = () => {
        try {
            shareClient && shareClient.unpublish(shareStream)
            shareStream && shareStream.close()
            shareClient && shareClient.leave(() => {
                console.log('Share client succeed to leave.')
            }, () => {
                console.log('Share client failed to leave.')
            })
        }
        finally {
            shareClient = null
            shareStream = null
        }
    }


    const removeStream = (id) => {
        streamList.map((item, index) => {
            if (item.getId() === id) {
                streamList[index].close()
                $('#ag-item-'+id).remove()
                streamList.splice(index, 1)            
            }
        })
        if (streamList.length <=4 && options.displayMode !== 2) {
            ButtonControl.enable('.displayModeBtn')
        }
        if (id === SHARE_ID) {
            options.displayMode = 0
            if (options.attendeeMode === 'video') {
                ButtonControl.enable('.shareScreenBtn')
            }
            shareEnd()
        }
        customRender(streamList, options.displayMode, options.resolution)


    }

    const addStream = (stream, push=false) => {
        let redundant = streamList.some(item => {
            return item.getId() === stream.getId()
        })
        if (redundant) {
            return
        }
        push?streamList.push(stream):streamList.unshift(stream)
        if (streamList.length>4) {
            options.displayMode = options.displayMode === 1 ?  0 : options.displayMode
            ButtonControl.disable(['.displayModeBtn', '.disableRemoteBtn'])
        }
        if (stream.getId() === SHARE_ID) {
            options.displayMode = 2
            if (!shareClient) {
                ButtonControl.disable('.shareScreenBtn')
            }
        }
        customRender(streamList, options.displayMode, options.resolution)

    }
    /**
     * add callback for client event to control streams
     * @param {*} client 
     * @param {*} streamList 
     */
    const subscribeStreamEvents = () => {
        client.on('stream-added', function (evt) {
            var stream = evt.stream
            console.log("New stream added: " + stream.getId())
            console.log(new Date().toLocaleTimeString())
            console.log("Subscribe ", stream)
            client.subscribe(stream, function (err) {
                console.log("Subscribe stream failed", err)
            })
        })

        client.on('peer-leave', function (evt) {
            console.log("Peer has left: " + evt.uid)
            console.log(new Date().toLocaleTimeString())
            console.log(evt)
            removeStream(evt.uid)
        })

        client.on('stream-subscribed', function (evt) {
            let stream = evt.stream
            console.log("Got stream-subscribed event")
            console.log(new Date().toLocaleTimeString())
            console.log("Subscribe remote stream successfully: " + stream.getId())
            console.log(evt)
            addStream(stream)
        })

        client.on("stream-removed", function (evt) {
            let stream = evt.stream
            console.log("Stream removed: " + stream.getId())
            console.log(new Date().toLocaleTimeString())
            console.log(evt)
            removeStream(stream.getId())
        })
    }

    const subscribeMouseEvents = () => {
        $('.displayModeBtn').on('click', function (e) {
            if (e.currentTarget.classList.contains('disabled') || streamList.length <= 1) {
                return
            }
            
            // 1 refer to pip mode
            if (options.displayMode === 1) {
                options.displayMode = 0
                ButtonControl.disable('.disableRemoteBtn')
            }
            else if (options.displayMode === 0) {
                options.displayMode = 1
                ButtonControl.enable('.disableRemoteBtn')
            }
            else {
                // do nothing when in screen share mode
            }

            customRender(streamList, options.displayMode, options.resolution)
        })

        $(".exitBtn").on('click', function () {
            try {
                shareClient && shareEnd()
                client && client.unpublish(localStream)
                localStream && localStream.close()
                client && client.leave(() => {
                    console.log('Client succeed to leave.')
                }, () => {
                    console.log('Client failed to leave.')
                })
            }
            finally {
                // redirect to index
                window.location.href = "index.html"
            }           
        })

        $(".videoControlBtn").on('click', function () {
            $(".videoControlBtn").toggleClass('off')
            localStream.isVideoOn() ? localStream.disableVideo() :
                localStream.enableVideo()
        })

        $(".audioControlBtn").on('click', function () {
            $(".audioControlBtn").toggleClass('off')
            localStream.isAudioOn() ? localStream.disableAudio() :
                localStream.enableAudio()
        })

        $(".shareScreenBtn").on('click', function (e) {
            if (e.currentTarget.classList.contains('disabled')) {
                return
            }
            if (shareClient) {
                shareEnd()
            }
            else {
                shareStart()
            }

        })

        $(".disableRemoteBtn").on('click', function (e) {
            if (e.currentTarget.classList.contains('disabled') || streamList.length <= 1) {
                return
            }
            let list
            let id = streamList[streamList.length-1].getId()
            list = Array.from(document.querySelectorAll(`.ag-item:not(#ag-item-${id})`))
            list.map(item => {
                if (item.style.display !== 'none') {
                    item.style.display = 'none'
                }
                else {
                    item.style.display = 'block'
                }
            })
        })

        $(window).resize(function(e) {
            customRender(streamList, options.displayMode, options.resolution)
        })

        $(document).mousemove(function (e) {
            if (global._toolbarToggle) {
                clearTimeout(global._toolbarToggle)
            }
            $('.ag-btn-group').addClass('active')
            global._toolbarToggle = setTimeout(function () {
                $('.ag-btn-group').removeClass('active')
            }, 2500)

        });


    }


    // ------------- start --------------
    // ----------------------------------

    (function () {
        options = optionsInit()
        UIInit(options)
        // add watcher for streamList and rerender
        // streamList.__proto__ = StreamWatcher(function () {
        //     customRender(streamList, options.displayMode, options.resolution)
        // })
        client = AgoraRTC.createClient({ mode: options.transcode })
        subscribeMouseEvents()
        subscribeStreamEvents()
        clientInit(client, options).then(uid => {
            localStream = streamInit(uid, options)
            console.log(localStream)
            localStream.init(() => {
                if(options.attendeeMode !== 'audience') {
                    addStream(localStream, true)
                    client.publish(localStream, err => {
                        console.log("Publish local stream error: " + err);
                    })
                }
            },
            err => {
                console.log("getUserMedia failed", err);
            })
        })
    })()
})(jQuery)



