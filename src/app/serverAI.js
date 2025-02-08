'use server'


const { HarmBlockThreshold, HarmCategory, GoogleGenerativeAI } = require("@google/generative-ai");

let api_keys = [
    "V3JpdHRlbiBieSBBdXN0aW4gUGhpbGxpcHMgQXVnLVNlcCAyMDI0",
    "AIzaSyAkNOjhY-ayGISlV2yHXWIjrA-v0VOojHE",
    "VEhJUyBXQVMgTVkgSURFQS4gRmFsbCBvZiAyMDIz",
    "QWRkaXRpb25hbCBMaWJyYXJpZXMgTGljZW5zZXMgaW5jbHVkZWQ="
];

const API_KEY = api_keys[1];

// Access your API key (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(API_KEY);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

var model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: `You greet students, answer their questions, and speak in a friendly tone.`, safetySettings});

let centerProfileDict = {
  "math": {
      "name": "Math Learning Center",
      "field": "",
      "additionalData": `- The Math Learning Center is open to all students, but specifically serves math and physics students best.
  - Assistants are available to assist you with your work if you need it, but they will not assist with quizzes or exams.
  - Assistants are knowledgeable on Algebra, Pre-calculus, Trigonometry, Statistics, Calculus, Contemporary Math, Differential Equations, Discrete Math, Physics, and more.
  - If you need to take an exam, ask a tutor for assistance.
  - If you need to make up an exam, you may be able to use the Math Testing Center. Talk to a tutor to get additional information.`
  },
  "computer-science": {
      "name": "Computer Learning Center",
      "field": "",
      "additionalData": `- The Computer Learning Center is open to all students, but specifically serves computer science students best.
  - Assistants are available to assist you with your work if you need it, but they will not assist with quizzes or exam.
  - Assistants are knowledgeable on Microsoft Office, C++, Java, Python, Web Programming, Networking, Cloud Computing, General Computer Usage, and more.
  - If students express a need to work on graphics assignments, there is a dedicated Graphic Design lab located in NCAB.
  - If you need to take an exam, ask a tutor for assistance.`
  }
}

function getGreeterPrompt() {
    
  var time = new Date();
  let formattedTime = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })
  let profile = centerProfileDict[localData.centerProfile];

  let greeterPrompt = `You are a greeter for Tarrant County College students and visitors. Don't bring up your name- let students ask for it (Cassidy).

  Your job is to continue, as a greeter, the following conversation. If it has not been done yet, ask users for their name and refer to them by it.

  You are allowed to discuss the following material:
  - Students must sign in at the kiosk with either their student ID or email address. Don't forget to sign out!
  - All Learning Commons services (Library and Learning Centers) are open 7:30 am - 9:00 pm Monday through Thursday, 7:30 - 5:00 pm Friday, and 10:00 - 4:00 pm Saturday.
  ${profile.additionalData}

  You are also allowed to make general smalltalk with students. You may respond in the same language the student has spoken to you in, you can speak any language.

  It is currently ${formattedTime}. If that time is past 8:30 pm, inform the student that the ${profile.name} will be closing soon (if it has not been done already).

  Simply provide your response, with no formatting. Keep your response under 30 words.

  RESPOND TO STUDENTS IN ONLY THE LANGUAGE THEY HAVE SPOKEN TO YOU IN.
  
  The conversation begins below:`

  return greeterPrompt;
}

function getSidekickPrompt() {
  let profile = centerProfileDict[localData.centerProfile];
  let sidekickPrompt = `You are a assistant for Tarrant County College students and visitors. Don't bring up your name- let students ask for it (Cassidy).

  Your job is to continue, as an assistant, the following conversation.

  You assist students in their learning. They may ask you questions and you will answer them. You primarily serve the ${profile.name}.
  Your answers are no longer than 100 words. Your responses should be informative and factual.
  You should inquire as to the subject that the student is studying, if you have not done so.
  While you should entertain them with smalltalk if they so desire, you should not allow it to persist long, and you should work to keep them focused.
  
  RESPOND TO STUDENTS IN ONLY THE LANGUAGE THEY HAVE SPOKEN TO YOU IN.

  The conversation begins below:`

  return sidekickPrompt;
}

function getAssistantPrompt() {
  return `You are an assistant. You are here to assist your user. You speak in a formal tone but may do otherwise if instructed. Your name is Cassidy, and you speak formally with users. You speak in short sentences at first and let the user guide the conversation and tone.

  Your job is to continue, as an assistant, the following conversation.
  
  RESPOND TO STUDENTS IN ONLY THE LANGUAGE THEY HAVE SPOKEN TO YOU IN.

  The conversation begins below:`;
}



async function getResponse(prompt, mdl, depth) {
    if (mdl == null) {
        mdl = model;
    }
    //const prompt = textbox.value;
    if (depth == null) {
        depth = 0;
    }
    let contents = "";
    try {
        //console.log(prompt);
        let respo = await mdl.generateContent(prompt);
        respo = respo.response;
        
        //const result = respo.text();
        contents = respo;
        //console.log("**********RESULT*********\n\n\n\n\n\n");
        console.log(contents.text())
    } catch (error) {
        console.log(error);
        if (depth < 3) {
            contents = await getResponse(prompt,mdl, depth+1);
        }
        else {
            return {"contents":null, "text":"I'm sorry, can you please say that one more time for me?", "citations":null};
        }
    }
    
    return {"contents":contents, "text":contents.text(), "citations":contents.candidates[0].citationMetadata};
}

export async function generateResponse(data, mode, centerProfile, fullContext, userId) {
  let p = "";
  if (localData.mode  == "greeter") {
      p = getGreeterPrompt();
  } else if (localData.mode == "sidekick") {
      p = getSidekickPrompt();
  } else if (localData.mode == "assistant") {
    p = getAssistantPrompt();
  }

  let prompt = `${p} \n\n ${fullContext}`;
  let result = await getResponse(data, model, 0);
  return result.text;
}