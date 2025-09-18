import React, { useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { io } from "socket.io-client";
import VideocamIcon from "@mui/icons-material/Videocam";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicIconOff from "@mui/icons-material/MicOff";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import IconButton from "@mui/material/IconButton";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";

import "../App.css";
import Badge from "@mui/material/Badge";
import server from "../environment";

const server_url = server;
var connections = {};

const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

export default function VideoMeet() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localIdRef = useRef();

  const { addToUserHistory } = useContext(AuthContext);

  let [videoAvaiable, setVideoAvaiabale] = useState(true);
  let [audioAvaiable, setAudioAvaiabale] = useState(true);

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const [isVideoOn, setIsVideoOn] = useState(true);
  let [video, setVideo] = useState();
  let [audio, setAudio] = useState();
  let [screen, setScreen] = useState();
  let [showModal, setModal] = useState(true);
  let [screenAvaiable, setScreenAvaiable] = useState();
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(4);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  let [videos, setVideos] = useState([]);
  const videoRef = useRef();

  const localVideoRef = useRef();

  const getPermission = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvaiabale(true);
      } else {
        setVideoAvaiabale(false);
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvaiabale(true);
      } else {
        setAudioAvaiabale(false);
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvaiable(true);
      } else {
        setScreenAvaiable(false);
      }

      if (videoAvaiable || audioAvaiable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    getPermission();
  }, []);

  let silence = () => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = ctx.createMediaStreamDestination();
    oscillator.connect(dst);
    oscillator.start();
    return dst.stream.getAudioTracks()[0];
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    const canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    const stream = canvas.captureStream();
    return stream.getVideoTracks()[0];
  };

  let getUserMediaSuccess = (stream) => {
    try {
      // stop old stream if it exists
      window.localStream?.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    // assign new stream (real camera/mic)
    window.localStream = stream || new MediaStream([black(), silence()]);
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = window.localStream;
    }

    // loop through connections and add tracks
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      window.localStream.getTracks().forEach((track) => {
        connections[id].addTrack(track, window.localStream);
      });

      // receive remote tracks
      connections[id].ontrack = (event) => {
        const [remoteStream] = event.streams;
        setVideos((prev) => {
          const exists = prev.find((v) => v.socketId === id);
          if (exists) {
            return prev.map((v) =>
              v.socketId === id ? { ...v, stream: remoteStream } : v
            );
          }
          return [...prev, { socketId: id, stream: remoteStream }];
        });
      };

      // create and send offer
      connections[id]
        .createOffer()
        .then((offer) => connections[id].setLocalDescription(offer))
        .then(() => {
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: connections[id].localDescription })
          );
        })
        .catch((e) => console.log(e));
    }

    // handle tracks ending (user stops cam/mic)
    stream?.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setVideo(false);
          setAudio(false);
        })
    );
  };

  // let getUserMediaSuccess = (stream) => {
  //   try {
  //     window.localStream.getTracks().forEach((track) => track.stop());
  //   } catch (e) {
  //     console.log(e);
  //   }

  //   window.localStream = stream;
  //   localVideoRef.current.srcObject = stream;

  //   // for (let id in connections) {
  //   //   if (id == socketIdRef.current) continue;

  //   //   //connections[id].addStream(window.localStream);

  //   //   window.localStream
  //   //     .getTracks()
  //   //     .forEach((track) =>
  //   //       connections[socketListId].addTrack(track, window.localStream)
  //   //     );

  //   //   connections[id].createOffer().then((description) => {
  //   //     connections[id]
  //   //       .setLocalDescription(description)
  //   //       .then(() => {
  //   //         socketRef.current.emit(
  //   //           "signal",
  //   //           id,
  //   //           JSON.stringify({ sdp: connections[id].localDescription })
  //   //         );
  //   //       })
  //   //       .catch((e) => console.log(e));
  //   //   });
  //   // }

  //   for (let id in connections) {
  //     if (id === socketIdRef.current) continue;

  //     // add each local track to the peer connection (modern API)
  //     window.localStream.getTracks().forEach((track) => {
  //       connections[id].addTrack(track, window.localStream);
  //     });

  //     // create and send offer
  //     connections[id]
  //       .createOffer()
  //       .then((offer) => connections[id].setLocalDescription(offer))
  //       .then(() => {
  //         socketRef.current.emit(
  //           "signal",
  //           id,
  //           JSON.stringify({ sdp: connections[id].localDescription })
  //         );
  //       })
  //       .catch((e) => console.log(e));
  //   }

  //   stream.getTracks().forEach(
  //     (track) =>
  //       (track.onended = () => {
  //         setVideo(false);
  //         setAudio(false);

  //         try {
  //           let tracks = localVideoRef.current.srcObject.getTracks();
  //           tracks.forEach((track) => track.stop());
  //         } catch (e) {
  //           console.log(e);
  //         }
  //       })
  //   );

  //   let blackSlice = (...arg) => new MediaStream([black(arg), silence()]);
  //   window.localStream = blackSlice();
  //   localVideoRef.current.srcObject = window.localStream;

  //   // for (let id in connections) {
  //   //   connections[id].addStream(window.localStream);

  //   //   window.localStream
  //   //     .getTracks()
  //   //     .forEach((track) =>
  //   //       connections[socketListId].addTrack(track, window.localStream)
  //   //     );

  //   //   connections[socketListId].ontrack = (event) => {
  //   //     const [stream] = event.streams;
  //   //     // same handling as before
  //   //     connections[id].createOffer().then((description) => {
  //   //       connections[id]
  //   //         .setLocalDescription(description)
  //   //         .then(() => {
  //   //           socketRef.current.emit(
  //   //             "signal",
  //   //             id,
  //   //             JSON.stringify({ sdp: connections[id].localDescription })
  //   //           );
  //   //         })
  //   //         .catch((e) => console.log(e));
  //   //     });
  //   //   };
  //   // }

  //   for (let id in connections) {
  //     // add tracks to peer connection (modern API)
  //     window.localStream.getTracks().forEach((track) => {
  //       connections[id].addTrack(track, window.localStream);
  //     });

  //     // ontrack handler: attach remote stream when received
  //     connections[id].ontrack = (event) => {
  //       const [remoteStream] = event.streams;
  //       // add or update videos state
  //       setVideos((prev) => {
  //         const exists = prev.find((v) => v.socketId === id);
  //         if (exists) {
  //           return prev.map((v) =>
  //             v.socketId === id ? { ...v, stream: remoteStream } : v
  //           );
  //         }
  //         return [...prev, { socketId: id, stream: remoteStream }];
  //       });
  //     };

  //     // create/send offer for this peer (if needed)
  //     connections[id]
  //       .createOffer()
  //       .then((offer) => connections[id].setLocalDescription(offer))
  //       .then(() => {
  //         socketRef.current.emit(
  //           "signal",
  //           id,
  //           JSON.stringify({ sdp: connections[id].localDescription })
  //         );
  //       })
  //       .catch((e) => console.log(e));
  //   }
  // };

  // // let silence = () => {
  // //   let ctx = new AudioContext();
  // //   let oscillator = ctx.createOscillator;

  // //   let dst = oscillator.current(ctx.createMediaStreamDestination());
  // //   oscillator.connect(dst);
  // //   oscillator.start();
  // //   ctx.resume();
  // //   return Object.assign(dst.stream.getAudioTracks()[0], { enable: false });
  // // };

  // let silence = () => {
  //   const ctx = new AudioContext();
  //   const oscillator = ctx.createOscillator();
  //   const dst = ctx.createMediaStreamDestination();
  //   oscillator.connect(dst);
  //   oscillator.start();
  //   return dst.stream.getAudioTracks()[0];
  // };

  // // let black = ({ width = 640, height = 480 } = {}) => {
  // //   let canvas = Object.assign(document.createElement("canvas"), {
  // //     width,
  // //     height,
  // //   });
  // //   canvas.getContext("2d").fillRect(0, 0, width, height);
  // //   let stream = canvas.captureStream();
  // //   return stream.getVideoTracks()[0];
  // // };

  // let black = ({ width = 640, height = 480 } = {}) => {
  //   const canvas = Object.assign(document.createElement("canvas"), {
  //     width,
  //     height,
  //   });
  //   canvas.getContext("2d").fillRect(0, 0, width, height);
  //   const stream = canvas.captureStream();
  //   return stream.getVideoTracks()[0];
  // };

  let getUserMedia = () => {
    // if ((video && videoAvaiable) || (audio && audioAvaiable)) {
    //   navigator.mediaDevices
    //     .getUserMedia({ video: true, audio: true })
    //     .then(getUserMediaSuccess)
    //     .then((stream) => {})
    //     .catch((e) => {
    //       console.log(e);
    //     });
    // } else {
    //   try {
    //     let tracks = localVideoRef.current.srcObject.getTracks();
    //     tracks.forEach((track) => track.stop());
    //   } catch (e) {}
    // }
    const constraints = {};
    if (video && videoAvaiable) constraints.video = true;
    if (audio && audioAvaiable) constraints.audio = true;

    if (Object.keys(constraints).length > 0) {
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(getUserMediaSuccess);
    } else {
      // stop existing tracks
      localVideoRef.current?.srcObject
        ?.getTracks()
        .forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [audio, video]);

  let getMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevMessages) => {
        prevMessages + 1;
      });
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });
    //socketRef.current.on("signal", gptMessageFromServer);
    // socket.on("message", (msg) => {
    //   console.log("Message from server:", msg);
    // });

    socketRef.current.on("signal", getMessageFromServer);

    socketRef.current.on("message", (msg) => {
      console.log("Message from server:", msg);
    });

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;
      socketRef.current.on("chat-message", addMessage);
      // socketRef.current.emit("chat-message", {
      //   from: socketIdRef.current,
      //   username,
      //   text: `${username || "Anonymous"} joined the call`,
      //   time: Date.now(),
      // });

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          (connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          )),
            (connections[socketListId].onicecandidate = (event) => {
              if (event.candidate != null) {
                socketRef.current.emit(
                  "signal",
                  socketListId,
                  JSON.stringify({ ice: event.candidate })
                );
              }
            }),
            (connections[socketListId].onaddstream = (event) => {
              let videoExists = videos.find(
                (video) => video.socketId === socketListId
              );

              console.log(
                "Adding new video stream:",
                socketListId,
                event.stream
              );

              if (videoExists) {
                setVideos((videos) => {
                  const updatedVideos = videos.map((video) =>
                    video.socketId == socketListId
                      ? { ...video, stream: event.stream }
                      : video
                  );
                  videoRef.current = updatedVideos;
                  return updatedVideos;
                });
              } else {
                let newVideos = {
                  socketId: socketListId,
                  stream: event.stream,
                  autoPlay: true,
                  playsinline: true,
                };

                setVideos((videos) => {
                  const updatedVideos = [...videos, newVideos];
                  videoRef.current = updatedVideos;
                  return updatedVideos;
                });
              }
            });

          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            let blackSlice = (...arg) =>
              new MediaStream([black(arg), silence()]);
            window.localStream = blackSlice();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id === socketIdRef.current) continue;
            try {
              connections[id2].addStream(window.localStream);
            } catch (e) {}

            connections[id2].createOffer().then((description) => {
              connections[id2].setLocalDescription(description).then(() => {
                socketRef.current
                  .emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  )
                  .catch((e) => console.log(e));
              });
            });
          }
        }
      });
    });
  };

  let getMedia = () => {
    setVideo(videoAvaiable);
    setAudio(audioAvaiable);
    connectToSocketServer();
  };

  let routeTo = useNavigate();

  let connect = async () => {
    setAskForUsername(false);
    getMedia();

    const meetingCode = window.location.pathname.substring(1);
    try {
      await addToUserHistory(meetingCode);
      console.log("Meeting saved in history:", meetingCode);
    } catch (e) {
      console.error("Error saving history:", e);
    }
  };

  let handelVideo = () => {
    setVideo(!video);
  };

  let handelAudio = () => {
    setAudio(!audio);
  };

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch {
      (e) => console.log(e);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);
      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (e) {
            console.log(e);
          }
        })
    );

    let blackSlice = (...arg) => new MediaStream([black(arg), silence()]);
    window.localStream = blackSlice();
    localVideoRef.current.srcObject = window.localStream;

    getDisplayMedia();
  };

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  useEffect(() => {
    if (screen != undefined) {
      getDisplayMedia();
    }
  }, [screen]);

  let handelScreen = () => {
    setScreen(!screen);
  };

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  let handelEndCall = async () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());

      const meetingCode = window.location.pathname.substring(1);
      await addToUserHistory(meetingCode);
    } catch {
      (e) => console.log(e);
    }
    routeTo("/home");
  };

  return (
    <div>
      {askForUsername === true ? (
        <div>
          <h2>Enter Into Lobby</h2>
          <TextField
            id="outlined-basic"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
          />
          <Button variant="contained" onClick={connect}>
            Connect
          </Button>

          <div>
            <video ref={localVideoRef} autoPlay muted></video>
          </div>
        </div>
      ) : (
        <div className="mainContainer">
          {/* Video Meeting Section */}
          <div
            className="meetVideoContainer"
            style={{ width: showModal ? "75%" : "100%" }}
          >
            {videos.length === 0 ? (
              // Only me
              <video
                className="singleUserVideo"
                ref={localVideoRef}
                autoPlay
                muted
              />
            ) : (
              <div className="videoGrid">

                
                {/* My Video */}
                <div className="conferenceView">
                  <video autoPlay muted ref={localVideoRef} />
                </div>

                {/* Other Participants */}
                {videos
                  .filter((v) => v.stream)
                  .map((video) => (
                    <div className="conferenceView" key={video.socketId}>
                      <video
                        autoPlay
                        playsInline
                        ref={(ref) => {
                          if (ref && video.stream) {
                            ref.srcObject = video.stream;
                          }
                        }}
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Chat Section */}
          {showModal && (
            <div className="chatRoom">
              <div className="chatContainer">
                <h1>Chat</h1>
                <div className="chattingDisplay">
                  {messages.length > 0 ? (
                    messages.map((item, index) => (
                      <div style={{ marginBottom: "20px" }} key={index}>
                        <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                        <p>{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p>No Messages Yet</p>
                  )}
                </div>
                <div className="chattingRoom">
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    id="outlined-basic"
                    label="Enter Your Chat"
                    variant="outlined"
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="buttonContainers">
        <IconButton style={{ color: "white" }} onClick={handelVideo}>
          {video === true ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>

        <IconButton onClick={handelEndCall} style={{ color: "red" }}>
          <CallEndIcon />
        </IconButton>

        <IconButton style={{ color: "white" }} onClick={handelAudio}>
          {audio === true ? <MicIcon /> : <MicIconOff />}
        </IconButton>

        {screenAvaiable === true ? (
          <IconButton onClick={handelScreen} style={{ color: "white" }}>
            {screen === true ? <ScreenShareIcon /> : <StopScreenShareIcon />}
          </IconButton>
        ) : null}

        <Badge badgeContent={newMessages} max={999} color="secondary">
          <IconButton
            onClick={() => {
              setModal(!showModal);
              setNewMessages(0);
            }}
            style={{ color: "white" }}
          >
            <ChatIcon />
          </IconButton>
        </Badge>
      </div>
    </div>
  );
}

// {showModal ? (
//             <div className="chatRoom">
//               <div className="chatContainer">
//                 <h1>Chat</h1>

//                 <div className="chattingDisplay">
//                   {messages.length > 0 ? messages.map((item,index)=>{
//                     return(
//                       <div style={{marginBottom: "20px"}} key={index}>
//                         <p style={{fontWeight: "bold"}}>{item.sender}</p>
//                         <p>{item.data}</p>
//                       </div>
//                     )
//                   }
//                 ) : <p>No Messages Yet</p>}
//                 </div>

//                 <div className="chattingRoom">

//                   <TextField value={message} onChange={(e) => setMessage(e.target.value)} id="outlined-basic" label="Enter Your Chat" variant="outlined" />
//                   <Button variant="contained" onClick={sendMessage}>Send</Button>
//                 </div>

//               </div>
//             </div>
//           ) : (
//             <></>
//           )}
