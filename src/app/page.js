'use client'

import {generateResponse} from "./serverAI";
import {useState, useEffect} from "react";

const sleep = ms => new Promise(r => setTimeout(r, ms));

let recognition; // SpeechRecognition instance
let isListening = false;
let isSpeaking = false;
let speechSynthesisUtterance;

let voices = [];
//let mode = "greeter";
//let outputText = "";
//let statusText = "";
let speed = 1;

let color = {r: 0, g: 0, b: 0};
let targetColor = {r: 0, g: 0, b: 255};


let speechPart1Height = 200;
let speechPart2Height = 200;
let speechPart3Height = 200;

let speechPart1Color = {r: 0, g: 0, b: 0};
let speechPart2Color = {r: 0, g: 0, b: 0};
let speechPart3Color = {r: 0, g: 0, b: 0};

let t = 0;
let factor = 1;

let voiceOption = 101;

let fullContext = "";
let count = 0;

function lerp(a, b, t) {
  return a * (1-t) + b * t;
}



//let centerProfile = "math";\

// Actual REACT Code

function ChatNode({text}) {
  return (
    <p>
      {text}
    </p>
  );
}

function SpeechBubble() {
  const [speechData, setSpeechData] = useState([200,200,200, {r: 0, g: 0, b: 0}, {r: 0, g: 0, b: 0}, {r: 0, g: 0, b: 0}, false]);

  useEffect(() => {
    if (!speechData[6]) {
      window.setInterval(() => {
        color = {r: lerp(color.r, targetColor.r, 0.05), g: lerp(color.g, targetColor.g, 0.05), b: lerp(color.b, targetColor.b, 0.05)};
        let newFactor = 1 * (isListening ? 0.4 : 1) * (isSpeaking ? 1.5 : 1);
        factor = lerp(factor, newFactor, 0.05);
      
        let f1 = (Math.abs(Math.sin(t)) * 0.75 + 0.25);
        let speech1Height =  f1* factor * 200;
        speechPart1Height = speech1Height;
      
        let f2 = (Math.abs(Math.sin(t+0.2)) * 0.75 + 0.25);
        let speech2Height = f2 * factor * 200;
        speechPart2Height = speech2Height;
      
        let f3 = (Math.abs(Math.sin(t+0.4)) * 0.75 + 0.25);
        let speech3Height = f3 * factor * 200;
        speechPart3Height = speech3Height;
      
        let speech1Color = {r: lerp(0.5, color.r, Math.pow(f1, 2)), g: lerp(0.5, color.g, Math.pow(f1, 2)), b: lerp(0.5, color.b, Math.pow(f1, 2))};
        speechPart1Color = speech1Color;
      
        let speech2Color = {r: lerp(0.5, color.r, Math.pow(f2, 2)), g: lerp(0.5, color.g, Math.pow(f2, 2)), b: lerp(0.5, color.b, Math.pow(f2, 2))};
        speechPart2Color = speech2Color;
      
        let speech3Color = {r: lerp(0.5, color.r, Math.pow(f3, 2)), g: lerp(0.5, color.g, Math.pow(f3, 2)), b: lerp(0.5, color.b, Math.pow(f3, 2))};
        speechPart3Color = speech3Color;

        setSpeechData([speech1Height, speech2Height, speech3Height, speech1Color, speech2Color, speech3Color, true]);
        
        t+= 0.04;
      }, 20);
    }
  });
  return (
    <div id="speechBubble">
      <div className="circle" id="circle1" style={{height: speechPart1Height, backgroundColor: `rgb(${speechPart1Color.r}, ${speechPart1Color.g}, ${speechPart1Color.b})`}}></div>
      <div className="circle" id="circle2" style={{height: speechPart2Height, backgroundColor: `rgb(${speechPart2Color.r}, ${speechPart2Color.g}, ${speechPart2Color.b})`}}></div>
      <div className="circle" id="circle3" style={{height: speechPart3Height, backgroundColor: `rgb(${speechPart3Color.r}, ${speechPart3Color.g}, ${speechPart3Color.b})`}}></div>
    </div>
  )
}




function VoiceList() {
  const [voicesMenu, setVoices] = useState([]);
  useEffect(() => {
    function setSpeech() {
      return new Promise(
          function (resolve, reject) {
              if (window === undefined) { resolve([]); return null;}
              let synth = window.speechSynthesis;
              let id;
    
              id = setInterval(() => {
                  if (synth.getVoices().length !== 0) {
                      resolve(synth.getVoices());
                      clearInterval(id);   
                  }
              }, 10);
          }
      )
    }
    let s = setSpeech();
    s.then(v => {
      setVoices(v);
    })
    
    /*s.then(v => {voices = v;
        //let listBox = document.getElementById("voices");
        let i = 0;
        console.log(voices);
        setVoices(v);
    });*/
  });
  return (
    <div id="voices">
      <select id="voices" onChange = {(e) => voiceOption = e.target.value}>
        {voicesMenu.map((voice, index) => (
          <option key={voice.voiceURI.toString()} value={index}>{voice.voiceURI.toString().replace("Microsoft ", "")}</option>
        ))}
      </select>
    </div>
  )
}


function Start() {
  if (!isListening && !isSpeaking) {
    console.log("Go");
    startListening();
  }
}

function startListening() {
  if (recognition && !isListening && !isSpeaking) {
      try {
          recognition.start();
      } catch (error) {
          console.error("Error starting recognition:", error);
          //statusText = "Error starting: " + error.message;
          isListening = false;
      }
  }
}

function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

let tempLocalData = {statusText: "", outputText: "", mode:"greeter", centerProfile:"math", userId: makeid(5)};
export default function Home() {
  
  const [localData, setLocalData] = useState(tempLocalData);
  
  //rebuildLocalElements();

  function rebuildLocalElements() {
    setLocalData({statusText: tempLocalData.statusText, outputText: tempLocalData.outputText, mode: tempLocalData.mode, centerProfile: tempLocalData.centerProfile, userId: tempLocalData.userId});
  }

  function updateStatusText(text) {
    tempLocalData.statusText = text;
    //console.log("Updated status");
    //console.log(localData)
    rebuildLocalElements();
    //console.log(localData)
  }

  function updateOutputText(text) {
    tempLocalData.outputText = text;
    //console.log("Updated output");
    rebuildLocalElements();
  }

  function updateMode(m) {
    tempLocalData.mode = m;
    rebuildLocalElements();
  }

  function updateProfile(m) {
    tempLocalData.centerProfile = m;
    rebuildLocalElements();
  }

  function updateUserId(m) {
    tempLocalData.userId = m;
    rebuildLocalElements();
  }

  function SetMode(m) {
    updateMode(m)
    if (m == "greeter") {
      targetColor = {r: 0, g: 0, b: 255};
    } else if (m == "sidekick") {
      targetColor = {r: 0, g: 255, b: 0};
    } else if (m == "assistant") {
      targetColor = {r: 255, g: 0, b: 0};
    }
  }
  
  function SetProfile(m) {
    updateProfile(m)
  }


  useEffect(() => {
    function setSpeech() {
      return new Promise(
          function (resolve, reject) {
              if (window === undefined) { resolve([]); return null;}
              let synth = window.speechSynthesis;
              let id;
    
              id = setInterval(() => {
                  if (synth.getVoices().length !== 0) {
                      resolve(synth.getVoices());
                      clearInterval(id);   
                  }
              }, 10);
          }
      )
    }
    
    
    let s = setSpeech();
    s.then(v => {voices = v;
      //let listBox = document.getElementById("voices");
      let i = 0;
      for (let voice of voices) {
          /*let element = document.createElement("option");
          element.textContent = voice.voiceURI.toString().replace("Microsoft ", "");
          element.value = i;*/
          //listBox.appendChild(element);
    
      }
      console.log(voices);
    });

    async function processUserSpeech(speechResult) {
      // Replace this with your logic to generate a response based on speechResult
      let responseText;
    
      fullContext += `\nUser: ${speechResult} \n\nAI: `;
    
      /*let p = "";
      if (localData.mode  == "greeter") {
          p = getGreeterPrompt();
      } else {
          p = getSidekickPrompt();
      }
    
      let prompt = `${p} \n\n ${fullContext}`*/
    
      //console.log(prompt);
    
      if (localData.mode  == "greeter") {
          targetColor = {r: 0, g: 0, b: 30};
      } else if (localData.mode  == "sidekick") {
          targetColor = {r: 0, g: 30, b: 0};
      } else if (localData.mode  == "assistant") {
          targetColor = {r: 30, g: 0, b: 0};
      }
      //console.log(fullContext);
      responseText = await generateResponse("", localData.mode, localData.centerProfile, fullContext, localData.userId);
      
      fullContext += `${responseText} \n`
    
      updateOutputText(responseText);
      console.log(responseText);
    
      speak(responseText);
    }
    
    
    function initializeSpeechRecognition() {
      if (window === undefined) { return; }
      window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
      if (!window.SpeechRecognition) {
          updateStatusText("Speech recognition is not supported in this browser.");
          //startButton.disabled = true;
          return;
      }
    
      recognition = new window.SpeechRecognition();
      recognition.lang = 'en-US'; // You can change the language
      recognition.interimResults = false; // Only final results
      recognition.maxAlternatives = 1;
    
      recognition.onstart = () => {
          updateStatusText("Listening...");
          isListening = true;
      };
    
      recognition.onresult = async (event) => {
          const speechResult = event.results[0][0].transcript;
          updateStatusText("Processing...");
          await processUserSpeech(speechResult); // Call function to handle the transcribed text
      };
    
      recognition.onspeechend = () => {
          updateStatusText("Acknowledged response");
          count = 0;
          stopListening(); // Stop listening when speech ends
      };
    
      recognition.onerror = async (event) => {
          console.error("Speech Recognition Error:", event.error);
          updateStatusText("Error: " + event.error);
          if (event.error.toString() == "no-speech") {
              //This is the best thing ever
              count++;
              if (count > 5) {
                  count = 0;
                  updateOutputText("<b>Try speaking to me!</b>");
                  fullContext = "";
              }
          }
          stopListening();
          await sleep(200);
          startListening();
      };
    
      recognition.onend = () => {
          isListening = false;
          /*if (!isSpeaking) {
              // Restart listening only if not currently speaking
              startListening();
          }*/
      };
    }
    
    function speak(text) {
      if (window === undefined) { return; }
      if ('speechSynthesis' in window) {
          isSpeaking = true;
          s = setSpeech();
          s.then(v => {
              speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
          let getDesiredVoice = voiceOption;
          if (getDesiredVoice == null) {
              getDesiredVoice = 101;
          }
          if (v.length > getDesiredVoice) {
              speechSynthesisUtterance.voice = v[getDesiredVoice];
          } else {
              speechSynthesisUtterance.voice = v[14];
          }
    
          speechSynthesisUtterance.rate = speed;
    
          speechSynthesisUtterance.onstart = () => {
            updateStatusText( "Speaking...");
              if (localData.mode == "greeter") {
                  targetColor = {r: 50, g: 50, b: 255};
              } else if (localData.mode  == "sidekick") {
                  targetColor = {r: 50, g: 255, b: 50};
              } else if (localData.mode  == "assistant") {
                  targetColor = {r: 255, g: 50, b: 50};
              }
          };
    
          speechSynthesisUtterance.onend = () => {
              isSpeaking = false;
              updateStatusText("Speaking complete.");
              if (localData.mode  == "greeter") {
                  targetColor = {r: 0, g: 0, b: 255};
              } else if (localData.mode  == "sidekick") {
                  targetColor = {r: 0, g: 255, b: 0};
              } else if (localData.mode  == "assistant") {
                  targetColor = {r: 255, g: 0, b: 0};
              }
              // Restart listening after speaking is done
              startListening();
          };
    
          speechSynthesisUtterance.onerror = (event) => {
              console.error("TTS Error:", event.error);
              updateStatusText("TTS Error: " + event.error);
              isSpeaking = false;
              startListening();  // Try to recover and listen again
          };
    
          window.speechSynthesis.speak(speechSynthesisUtterance);
          })
      } else {
        updateStatusText("Text-to-speech not supported.");
          isSpeaking = false;
      }
    }
    
    function stopListening() {
      if (recognition && isListening) {
          recognition.stop();
          isListening = false;
      }
    }
    
    initializeSpeechRecognition();
  });

  function Output() {
    return (
      <div id="output">
        <p>{localData.outputText}</p>
      </div>
    )
  }
  
  function Status() {
    return (
      <div id="status">
        <p>{localData.statusText}</p>
      </div>
    )
  }

  function Button() {
    return (
      <button id="startButton" disabled = {isListening || isSpeaking} onClick = {() => Start()}>
        Start System
      </button>
    );
  }

  function ModeSelect() {
    return (
      <div className="modeSelect">
        <input type="radio" id="option1" name="mode" value="greeter" onClick = {() => SetMode("greeter")} />
        <label htmlFor="option1">Greeter</label>
      
        <input type="radio" id="option2" name="mode" value="sidekick" onClick = {() => SetMode("sidekick")} />
        <label htmlFor="option2">Sidekick</label> 

        <input type="radio" id="option5" name="mode" value="assistant" onClick = {() => SetMode("assistant")} />
        <label htmlFor="option5">Assistant</label> 
      </div>
    )
  }
  
  function ProfileSelect() {
    return (
      <div className="profileSelect">
          <input type="radio" id="option3" name="profile" value="math" onClick = {() => SetProfile("math")} />
          <label htmlFor="option3">Math</label>
        
          <input type="radio" id="option4" name="profile" value="computer-science" onClick = {() => SetProfile("computer-science")} />
          <label htmlFor="option4">Computer Science</label> 
      </div>
    )
  }

  function ProfileInput() {
    return (
      <div className="profileInput">
        <input type="text" id="profile" name="profile" placeholder="Enter Profile ID" Change={(e) => updateUserId(e.target.value)}></input>
        <p>Your ID: <span>{localData.userId}</span></p>
      </div>
    )
  }
  
  
  function SpeedSlider() {
    function updateSpeed(e) {
      speed = e.target.value;
      console.log(speed)
    }
    return (
      <div id="speedSlider">
        <span><b>Slow</b></span>
        <input type="range" min="0.5" max="2" value="1" step="0.5" id="rate" onChange = {(e) => updateSpeed(e)} />
        <span><b>Fast</b></span>
      </div>
    )
  }
  

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <SpeechBubble />
        <Output />
        <Status />
        <Button />
        <div id="options">
          <ProfileSelect />
          <ProfileInput />
          <VoiceList />
          <ModeSelect />
          <SpeedSlider />
        </div>
      </main>
    </div>
  );
}

