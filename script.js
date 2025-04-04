const form = document.getElementById("story-form");
const storyEl = document.getElementById("story");
const speakBtn = document.getElementById("speak-btn");
const stopBtn = document.getElementById("stop-btn");
const saveBtn = document.getElementById("save-btn");

const REPLICATE_API_KEY = "r8_aEDOBKgHzirH2QPl62COUT9ohJtVmeP3goB3C";  // Your Replicate API Key

let synthesizer = null;
let isSpeaking = false;

// Story Generation
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("prompt").value.trim();
  const prompt = `Write a fun, detailed, and simple children's story (about 300-400 words) in easy English. Do not include this prompt in the story. Story topic: ${userInput}`;

  storyEl.textContent = "Generating story...";

  try {
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${REPLICATE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "b17e8c2c80b23cf9517c94476825b772c43d9449", // GPT-3 Model Version for text generation
        input: {
          prompt: prompt,
        },
      }),
    });

    const data = await response.json();
    console.log(data); // Log the data for debugging

    const story = data?.output?.[0] || "No story generated.";
    storyEl.textContent = story;
  } catch (error) {
    console.error("Error generating story:", error);
    storyEl.textContent = "Error generating story. Please try again.";
  }
});

// Text to Speech
speakBtn.addEventListener("click", () => {
  const SpeechSDK = window.SpeechSDK;
  const storyText = storyEl.textContent;

  if (!SpeechSDK || !storyText || isSpeaking) return;

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
  const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
  synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);

  isSpeaking = true;

  synthesizer.speakTextAsync(
    storyText,
    result => {
      if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
        console.log("Speech synthesis completed.");
      } else {
        console.error("Speech synthesis failed:", result.errorDetails);
      }

      isSpeaking = false;
      synthesizer.close();
      synthesizer = null;
    },
    error => {
      console.error("Speech synthesis error:", error);
      isSpeaking = false;
      synthesizer?.close();
      synthesizer = null;
    }
  );
});

// Stop Speech
stopBtn.addEventListener("click", () => {
  if (synthesizer && isSpeaking) {
    synthesizer.stopSpeakingAsync(() => {
      console.log("Speech stopped.");
      isSpeaking = false;
      synthesizer.close();
      synthesizer = null;
    }, error => {
      console.error("Error stopping speech:", error);
    });
  }
});

