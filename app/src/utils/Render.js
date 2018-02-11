import { SHARE_ID } from './Settings'

const tile_canvas = {
    '1': ['span 12/span 24'],
    '2': ['span 12/span 12/13/25', 'span 12/span 12/13/13'],
    '3': ['span 6/span 12', 'span 6/span 12', 'span 6/span 12/7/19'],
    '4': ['span 6/span 12', 'span 6/span 12', 'span 6/span 12', 'span 6/span 12/7/13'],
    '5': ['span 3/span 4/13/9', 'span 3/span 4/13/13', 'span 3/span 4/13/17', 'span 3/span 4/13/21', 'span 9/span 16/10/21'], 
    '6': ['span 3/span 4/13/7', 'span 3/span 4/13/11', 'span 3/span 4/13/15', 'span 3/span 4/13/19', 'span 3/span 4/13/23', 'span 9/span 16/10/21'],
    '7': ['span 3/span 4/13/5', 'span 3/span 4/13/9', 'span 3/span 4/13/13', 'span 3/span 4/13/17', 'span 3/span 4/13/21', 'span 3/span 4/13/25', 'span 9/span 16/10/21'], 
}

/**
 * To rerender the interface
 * @param {*} streamList all the streams 
 * @param {*} displayMode 1 refer to PIP mode, 0 refer to Tile mode, 2 refer to Share Screen
 */
const customRender = (streamList, displayMode, resolution) => {
    const canvas = document.querySelector('#ag-canvas')
    if (displayMode !== 2) {
        $('#ag-resize-container').remove()
    }
    // render in Tile mode
    if (displayMode === 0) {
        let no = streamList.length
        // no more than 7 people
        if (no>7) {
            return
        }
        streamList.map((item, index) => {
            let id = item.getId()
            let dom = document.querySelector('#ag-item-'+id)
            if (!dom) {
                dom = document.createElement('section')
                dom.setAttribute('id', 'ag-item-'+id)
                dom.setAttribute('class', 'ag-item')
                canvas.appendChild(dom)
                item.play('ag-item-'+id)
            }
            dom.setAttribute('style', `grid-area: ${tile_canvas[no][index]}`)
            item.player.resize && item.player.resize()
        })
    }
    // render in PIP Mode
    else if (displayMode === 1) {
        let no = streamList.length
        if( no > 4) {
            return
        }
        streamList.map((item, index) => {
            let id = item.getId()
            let dom = document.querySelector('#ag-item-'+id)
            if (!dom) {
                dom = document.createElement('section')
                dom.setAttribute('id', 'ag-item-'+id)
                dom.setAttribute('class', 'ag-item')
                canvas.appendChild(dom)
                item.play('ag-item-'+id)
            }
            if (index === no - 1) {
                dom.setAttribute('style', `grid-area: span 12/span 24/13/25`)
            }
            else{
                dom.setAttribute('style', `grid-area: span 3/span 4/${4+3*index}/25;
                z-index:1;width:calc(100% - 20px);height:calc(100% - 20px)`)
            }
            
            item.player.resize && item.player.resize()
            

        })
    }
    // render in Screen-Share mode
    else if (displayMode === 2) {
        let no = streamList.length
        if( no > 8) {
            return
        }
        for (let i=no-1; i>=0; i--) {
            let item = streamList[i]
            let id = item.getId()
            let dom = document.querySelector('#ag-item-'+id)
            if (!dom) {
                dom = document.createElement('section')
                dom.setAttribute('id', 'ag-item-'+id)
                dom.setAttribute('class', 'ag-item')
                canvas.appendChild(dom)
                item.play('ag-item-'+id)
            }


            if (id === SHARE_ID) {
                let containerWidth = canvas.clientWidth,
                    containerHeight = canvas.clientHeight
                // share stream
                if (no < 5) {
                    let width = 20/24*containerWidth,
                        height = containerHeight,
                        padding = calculateSize(width, height, resolution)
                    dom.setAttribute('style', `background-color:#000; grid-area: span 12/span 20/13/25; padding: ${padding}`)
                }
                else {
                    let width = 16/24*containerWidth,
                        height = containerHeight,
                        padding = calculateSize(width, height, resolution)
                    dom.setAttribute('style', `background-color:#000; grid-area: span 12/span 16/13/21; padding: ${padding}`)
                }
            }
            else {
                // normal item
                if (no===8 && index===no-1) {
                    dom.setAttribute('style', 'display: none')
                }
                else {
                    dom.setAttribute('style', `grid-area: span 4/span 4`)
                }
            }
            item.player.resize && item.player.resize()
        }
    }


}

const calculateSize = (width, height, resolution) => {
    let padding = ''
    if (width/height >= resolution) {
        padding = `0 ${(width-resolution*height)/2}px`
    }
    else {
        padding = `${(height-1/resolution*width)/2}px 0`
    }
    return padding
}

export {
   customRender
}