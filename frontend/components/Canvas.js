import React, { useState, useEffect, useRef} from 'react'
// components
import LeftBar from './LeftBar';
import OnlineUsers from './OnlineUsers';
import FileUploader from './FileUploader';
import ShowInfoPanel from './ShowInfoPanel';
import ColorPickerBar from './ColorPickerBar';
import BottomRightBar from './BottomRightBar';
import MoreActionsBar from './MoreActionsBar';
// theme
import { ThemeContext } from '../context/ThemeContext';
// save functionality
import { saveAs } from 'file-saver';
import { saveDrawing } from '../utils/saveDrawing';
import { getDrawings } from '../utils/getDrawings';
import Spinner from './Spinner';

function Canvas({sendMessage, setRoomId, incomingDrawings, roomId, usersList, username, loading}) {
    // load theme
    const { theme, toggle, dark } = React.useContext(ThemeContext)
    const [background, setBackground] = useState('#15171A')
    const [lineWidth, setLineWidth] = useState(3);
    const [instrument, setInstrument] = useState('pencil');
    const [showFileUploader, setShowFileUploader] = useState(false);
    const [textReadFromFile, setTextReadFromFile] = useState('');
    const [canvasUploaded, setCanvasUploaded] = useState(false);
    const [showInfoPanel, setShowInfoPanel] = useState(true);

    const canvasContainerRef = useRef();
    const canvasRef = useRef();
    const cursorRef = useRef();

    // stroke style (the current color to draw on canvas)
    const [strokeStyle, setStrokeStyle] = useState('#fff');

    // list of all strokes drawn
    const [drawings, setDrawings] = useState([]);

    // coordinates of our cursor
    const [cursorX, setCursorX] = useState(10);
    const [cursorY, setCursorY] = useState(10);
    const [prevCursorX, setPrevCursorX] = useState(10);
    const [prevCursorY, setPrevCursorY] = useState(10);

    // distance from origin
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);

    // zoom amount
    const [scale, setScale] = useState(1);

    // mouse functions
    const [leftMouseDown, setLeftMouseDown] = useState(false);
    const [rightMouseDown, setRightMouseDown] = useState(false);

    const [drawingHistory, setDrawingHistory] = useState([]);
    const [disabled, setDisabled] = useState(true);

    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);

    useEffect(() => {
        // disable right clicking
        document.oncontextmenu = function () {
            return false;
        }

        // if the window changes size, redraw the canvas
        window.addEventListener("resize", (event) => {
            redrawCanvas();
        });
        redrawCanvas();
    }, [])

    useEffect(() => {
        // Every time a user joins a room, fetch drawings from server
        if(roomId) {
            getDrawings(roomId)
            .then((resp) => {
                let allNewDrawingsCoords = [];
                for(let i = 0; i < resp.length; i++) {
                    // for every drawing from DB
                    for(let j = 0; j < resp[i].line.length; j++) {
                        allNewDrawingsCoords.push(resp[i].line[j])   
                    }
                }
                // set drawings
                setDrawings(drawings => [...drawings, allNewDrawingsCoords]);
                // redraw canvas
                drawToCanvas(allNewDrawingsCoords)
            })
            .catch((err) => {
                console.log(err)
            })
        }
    }, [roomId])

    useEffect(() => {
        redrawCanvas();
    }, [background])

    useEffect(() => {
        if(drawings.length) setDisabled(false);
        else setDisabled(true);
    }, [drawings])

    useEffect(() => {
        if(!theme.backgroundColor) return;
        setBackground(theme.backgroundColor);
    }, [theme])
  
    useEffect(() => {
        if(instrument === 'eraser') document.body.style.cursor = 'none';
        else if(instrument === 'pencil') document.body.style.cursor = 'default';
        else document.body.style.cursor = 'default';
        
    }, [instrument])

    // convert coordinates
    const toScreenX = xTrue => ((xTrue + offsetX) * scale)
    const toScreenY = yTrue => ((yTrue + offsetY) * scale)
    const toTrueX = xScreen => ((xScreen / scale) - offsetX)
    const toTrueY = yScreen => ((yScreen / scale) - offsetY)
    const trueHeight = () => (canvasRef.current.clientHeight / scale)
    const trueWidth = () => (canvasRef.current.clientWidth / scale)

    const drawItem = (x0, y0, x1, y1, color, lineWidth, instrument, text) => {
        let context = canvasRef.current.getContext("2d");
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = lineWidth;
        context.lineCap = 'round';

        if (instrument === 'pencil' || instrument === 'line') {
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            context.stroke();
        } else if (instrument === 'eraser') {
            context.strokeStyle = background;
            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            context.stroke();
        } else if (instrument === 'rectangle') {
            context.beginPath();
            context.strokeRect(x0, y0, x1 - x0, y1 - y0);
        } else if (instrument === 'circle') {
            const radius = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
            context.beginPath();
            context.arc(x0, y0, radius, 0, 2 * Math.PI);
            context.stroke();
        } else if (instrument === 'text') {
            context.font = `${lineWidth * 5}px Arial`;
            context.fillText(text, x0, y0);
        }
    }

    const redrawCanvas = () => {      
        if (!canvasRef.current || !canvasContainerRef.current) return;
        canvasRef.current.width = canvasContainerRef.current.clientWidth;
        canvasRef.current.height = canvasContainerRef.current.clientHeight;

        const context = canvasRef.current.getContext("2d");
        context.fillStyle = background;
        context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
       if(drawings.length) {
            for (let i = 0; i < drawings.length; i++) {
                const item = drawings[i];
                drawItem(toScreenX(item.x0), toScreenY(item.y0), toScreenX(item.x1), toScreenY(item.y1), item.color, item.lineWidth || lineWidth, item.instrument, item.text);
            }
        }   
    }

    const drawToCanvas = (drawings) => {      
        if (!canvasRef.current || !canvasContainerRef.current) return;
        canvasRef.current.width = canvasContainerRef.current.clientWidth;
        canvasRef.current.height = canvasContainerRef.current.clientHeight;

        const context = canvasRef.current.getContext("2d");
        context.fillStyle = background;
        context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
       if(drawings.length) {
            for (let i = 0; i < drawings.length; i++) {
                const item = drawings[i];
                drawItem(toScreenX(item.x0), toScreenY(item.y0), toScreenX(item.x1), toScreenY(item.y1), item.color, item.lineWidth, item.instrument, item.text);
            }
        }   
    }

    // every time a new drawing comes from server, draw it only if it wasn't sent by the same client that receives it
    useEffect(() => {
        // If this client sent the last drawing coordinates to server, do not redraw them
        // Else if this client hasn't sent last drawing coordinates to server, draw the received coordinates
        if(!incomingDrawings || incomingDrawings.username === username) return;
        
        if (incomingDrawings.instrument === 'clear') {
            setDrawings([]);
            setDrawingHistory([]);
            redrawCanvas();
        } else {
            drawItem(toScreenX(incomingDrawings.x0), toScreenY(incomingDrawings.y0), toScreenX(incomingDrawings.x1), toScreenY(incomingDrawings.y1), incomingDrawings.color, incomingDrawings.lineWidth, incomingDrawings.instrument, incomingDrawings.text);
        }
    }, [incomingDrawings])

    useEffect(() => {
        let start, finish;
        if(leftMouseDown) {
            start = {
                x: toTrueX(cursorX),
                y: toTrueY(cursorY)
            }

            // Add to history the first point of the new draw (from where it begins)
            setDrawingHistory(drawingHistory => [...drawingHistory, start]);
            return;
        }

        if(!leftMouseDown) {
            finish = {
                x: toTrueX(prevCursorX),
                y: toTrueY(prevCursorY)
            }

            // Add to history the last point of the new draw (where it finished)
            setDrawingHistory(drawingHistory => [...drawingHistory, finish]);
            return;
        }
    }, [leftMouseDown])

    const onMouseDown = (event) => {

        // detect left clicks
        if (event.button == 0) {
            setLeftMouseDown (true);
            setRightMouseDown (false);
        }
        // detect right clicks
        if (event.button == 2) {
            setRightMouseDown (true);
            setLeftMouseDown (false);
        }

        // update the cursor coordinates
        setCursorX(event.pageX);
        setCursorY(event.pageY);
        setPrevCursorX(event.pageX);
        setPrevCursorY(event.pageY);
        setStartX(toTrueX(event.pageX));
        setStartY(toTrueY(event.pageY));

        if (instrument === 'text') {
            const text = prompt('Enter your text:');
            if (text) {
                const drawing = {
                    x0: toTrueX(event.pageX),
                    y0: toTrueY(event.pageY),
                    text: text,
                    color: strokeStyle,
                    username: username,
                    lineWidth: lineWidth,
                    instrument: 'text'
                };
                setDrawings(drawings => [...drawings, drawing]);
                sendMessage(drawing);
                redrawCanvas();
            }
        }
    }

    const onMouseMove = (event) => {
        // get mouse position
        setCursorX(event.pageX);
        setCursorY(event.pageY);

        const scaledX = toTrueX(cursorX);
        const scaledY = toTrueY(cursorY);
        const prevScaledX = toTrueX(prevCursorX);
        const prevScaledY = toTrueY(prevCursorY);

        if (leftMouseDown) {
            if (instrument === 'pencil' || instrument === 'eraser') {
                // add the line to our drawing history
                const drawing = {
                    x0: prevScaledX,
                    y0: prevScaledY,
                    x1: scaledX,
                    y1: scaledY,
                    color: strokeStyle,
                    username: username,
                    lineWidth: lineWidth,
                    instrument: instrument
                };

                setDrawings(drawings => [...drawings, drawing]);
                
                // broadcast coordinates of the latest drawing in the current room
                sendMessage(drawing);
                
                // draw a line
                drawItem(prevCursorX, prevCursorY, cursorX, cursorY, strokeStyle, lineWidth, instrument);
            } else if (instrument === 'rectangle' || instrument === 'circle' || instrument === 'line') {
                redrawCanvas();
                const context = canvasRef.current.getContext("2d");
                context.strokeStyle = strokeStyle;
                context.lineWidth = lineWidth;
                context.beginPath();

                if (instrument === 'rectangle') {
                    context.strokeRect(toScreenX(startX), toScreenY(startY), toScreenX(scaledX) - toScreenX(startX), toScreenY(scaledY) - toScreenY(startY));
                } else if (instrument === 'circle') {
                    const radius = Math.sqrt(Math.pow(toScreenX(scaledX) - toScreenX(startX), 2) + Math.pow(toScreenY(scaledY) - toScreenY(startY), 2));
                    context.arc(toScreenX(startX), toScreenY(startY), radius, 0, 2 * Math.PI);
                    context.stroke();
                } else if (instrument === 'line') {
                    context.moveTo(toScreenX(startX), toScreenY(startY));
                    context.lineTo(toScreenX(scaledX), toScreenY(scaledY));
                    context.stroke();
                }
            }
        }
        if (rightMouseDown) {
            // move the screen
            setOffsetX(offsetX + (cursorX - prevCursorX) / scale);
            setOffsetY(offsetY + (cursorY - prevCursorY) / scale);
            redrawCanvas();
        }

        setPrevCursorX(cursorX);
        setPrevCursorY(cursorY);
    }

    const onMouseUp = (event) => {
        if (leftMouseDown && (instrument === 'rectangle' || instrument === 'circle' || instrument === 'line')) {
            const scaledX = toTrueX(event.pageX);
            const scaledY = toTrueY(event.pageY);
            
            const drawing = {
                x0: startX,
                y0: startY,
                x1: scaledX,
                y1: scaledY,
                color: strokeStyle,
                username: username,
                lineWidth: lineWidth,
                instrument: instrument
            };

            setDrawings(drawings => [...drawings, drawing]);
            sendMessage(drawing);
            redrawCanvas();
        }

        setLeftMouseDown(false);
        setRightMouseDown(false);
    }

    const onMouseWheel = (event) => {
        const deltaY = event.deltaY;
        const scaleAmount = -deltaY / 500;
        setScale(scale * (1 + scaleAmount));

        // zoom the page based on where the cursor is
        let distX = event.pageX / canvasRef.current.clientWidth;
        let distY = event.pageY / canvasRef.current.clientHeight;

        // calculate how much we need to zoom
        const unitsZoomedX = trueWidth() * scaleAmount;
        const unitsZoomedY = trueHeight() * scaleAmount;

        const unitsAddLeft = unitsZoomedX * distX;
        const unitsAddTop = unitsZoomedY * distY;

        setOffsetX(offsetX - unitsAddLeft);
        setOffsetY(offsetY - unitsAddTop);

        redrawCanvas();
    }

    const undo = () => {    
        if(disabled || drawingHistory.length < 2) return;    
        // remove all points drawed between the first and last point of the last draw
        const startPointOfLastDraw = drawingHistory.slice(drawingHistory.length-2, drawingHistory.length-1);
        const lastPointOfLastDraw = drawingHistory.slice(drawingHistory.length-1, drawingHistory.length);
        let firstIndex = -1;
        let lastIndex = -1;

        for(let i=0; i < drawings.length; i++) {
            if(drawings[i].x1 === startPointOfLastDraw[0].x && drawings[i].y1 === startPointOfLastDraw[0].y) {
                firstIndex = i;
            }

            if(Math.abs(drawings[i].x1 - lastPointOfLastDraw[0].x)  < 8 && Math.abs(drawings[i].y1 - lastPointOfLastDraw[0].y) < 8) {
                lastIndex = i;
            }
        }

        // the new drawings array
        const newDrawings = [];

        // if firstIndex and lastIndex are different than -1, it means that there was a last object drawn
        // so we will iterate over the current drawings array and remove the the elements of the array with indexes
        // between firstIndex and lastIndex
        for(let i=0; i<drawings.length; i++) 
            if(firstIndex >= 0 && lastIndex >= 0) 
                if(i < firstIndex || i > lastIndex) 
                    newDrawings.push(drawings[i]); 
            
        if(newDrawings.length) setDrawings([...newDrawings]); 
        else if(newDrawings.length === 0 && !(firstIndex === -1 || lastIndex === -1)) {
            setDrawings([]);
        }
        
        // remove the last two items from history (the beginning and finish points of last drawing)
        setDrawingHistory(drawingHistory.slice(0, drawingHistory.length-2));
        
        // redraw the canvas
        canvasRef.current.width = canvasContainerRef.current.clientWidth;
        canvasRef.current.height = canvasContainerRef.current.clientHeight;

        canvasRef.current.getContext("2d").fillStyle = background;
        canvasRef.current.getContext("2d").fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        if(newDrawings.length) {
            for (let i = 0; i < newDrawings.length; i++) {
                const item = newDrawings[i];
                drawItem(toScreenX(item.x0), toScreenY(item.y0), toScreenX(item.x1), toScreenY(item.y1), item.color, item.lineWidth || lineWidth, item.instrument, item.text);
            }
        } else {
            console.log('Canvas empty')
        } 
    }

    const save = () => {
        if(disabled) return;    

        const lastDrawingsJSON = {
            drawings: drawings,
            history: drawingHistory
        }

        let blob = new Blob([JSON.stringify(lastDrawingsJSON, null, 2)], {type : 'application/json'});

        saveAs(blob, "canvas.txt");
    }

    const importFile = ()  => {
        setShowFileUploader(true)
    }   

    const clearCanvas = () => {
        setDrawings([]);
        setDrawingHistory([]);
        redrawCanvas();
        // optionally notify others to clear their canvas
        sendMessage({instrument: 'clear'});
    }

    // when a canvas.txt file was uploaded, read it and set the state
    useEffect(() => {
        if(textReadFromFile === '') return;
        const result = JSON.parse(textReadFromFile)
        setDrawings([...result.drawings])
        setDrawingHistory([...result.history])
        setTimeout(() => {
            setCanvasUploaded(true);
        }, 1000)        
    }, [textReadFromFile])

    // after the state has changed and if a new .txt file was uploaded, redraw canvas
    useEffect(() => {
        if(!canvasUploaded) return;
        redrawCanvas();
        setCanvasUploaded(false);
    }, [canvasUploaded])

    // every time a new element is drawn, save it to DB
    useEffect(() => {
        if(!drawingHistory || drawingHistory.length < 2) return;
        else {
            // get all the coordinates of the last drawing and send it to server
            const startPointOfLastDraw = drawingHistory.slice(drawingHistory.length-2, drawingHistory.length-1);
            const lastPointOfLastDraw = drawingHistory.slice(drawingHistory.length-1, drawingHistory.length);
            let firstIndex = -1;
            let lastIndex = -1;

            for(let i=0; i < drawings.length; i++) {
                if(drawings[i].x1 === startPointOfLastDraw[0].x && drawings[i].y1 === startPointOfLastDraw[0].y) {
                    firstIndex = i;
                }

                if(Math.abs(drawings[i].x1 - lastPointOfLastDraw[0].x)  < 8 && Math.abs(drawings[i].y1 - lastPointOfLastDraw[0].y) < 8) {
                    lastIndex = i;
                }
            }

            // the new drawings array
            const newDrawings = [];

            // if firstIndex and lastIndex are different than -1, it means that there was a last object drawn
            // so we will iterate over the current drawings array and save the elements of the array with indexes
            // between firstIndex and lastIndex
            for(let i=0; i<drawings.length; i++) 
                if(firstIndex >= 0 && lastIndex >= 0) 
                    if(i > firstIndex && i < lastIndex) 
                        newDrawings.push(drawings[i]); 

            if(newDrawings.length)   
                saveDrawing(roomId, newDrawings);

            /* 
            {
                "line": [
                    {
                        "x0":"892",
                        "y0":"459",
                        "x1":"893",
                        "y1":"458",
                        "color":"#fff",
                        "username":"costin",
                        "lineWidth":"3",
                        "instrument":"pencil"
                    }
                ]
            }
            */

            /* 
                [
                    {
                        "line": [
                            {
                                "x0": 735,
                                "y0": 529,
                                "x1": 737,
                                "y1": 527,
                                "color": "#fff",
                                "userID": null,
                                "lineWidth": 3,
                                "instrument": "pencil"
                            },
                        ]
                    }
                ]
            */
        }
    }, [drawingHistory])
    return (
        <div 
            ref={canvasContainerRef}
            style={{position: 'relative', zIndex: '1', width: '100vw', height: '100vh'}}
        >
            {loading &&
                <div style={{ background: '#15171A', position: 'absolute', zIndex: 99999999, width: '100vw', height: '100vh'}}>
                    <Spinner
                        color={'#fff'} 
                        loading={loading}
                        connecting={true}
                    />
                </div>
            }
            <ColorPickerBar 
                setStrokeStyle={setStrokeStyle}
            />
            <LeftBar 
                save={save} 
                disabled={disabled}
                importFile={importFile}
                clear={clearCanvas}
            />
            <OnlineUsers usersList={usersList}/>
            {showFileUploader 
                && <FileUploader 
                    setShowFileUploader={setShowFileUploader}
                    setTextReadFromFile={setTextReadFromFile}    
                />
            }
            {showInfoPanel && <ShowInfoPanel setShowInfoPanel={setShowInfoPanel}/>}
            <BottomRightBar 
                scale={scale} 
                undo={undo} 
                disabled={disabled}
                setRoomId={setRoomId}
                roomId={roomId}
            />
            <MoreActionsBar 
                lineWidth={lineWidth} 
                setLineWidth={setLineWidth} 
                setInstrument={setInstrument} 
                instrument={instrument}
                color={strokeStyle}
            />
            <canvas 
                id="canvas" 
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                onMouseMove={onMouseMove}
                onWheel={onMouseWheel}
            >Your browser does not support HTML5 canvas</canvas>
            {instrument === 'eraser'
                &&  <div
                        ref={cursorRef}
                        style={{
                            width: lineWidth,
                            height: lineWidth,
                            borderRadius: "50%",
                            border: `1px solid ${theme.secondaryColor}`,
                            position: "absolute",
                            zIndex: 999999999,
                            top: cursorY - lineWidth/2,
                            left: cursorX - lineWidth/2,
                            pointerEvents: "none"
                        }}
                    ></div>

            }
        </div>
    )
}

export default Canvas
