const form = document.getElementById("story-form");
const storyEl = document.getElementById("story");
const speakBtn = document.getElementById("speak-btn");
const stopBtn = document.getElementById("stop-btn");
const saveBtn = document.getElementById("save-btn");

const AZURE_SPEECH_KEY = "6siXlmXbDoab14hWXAuHCALCr77pSNxAyrl5YZmCYEKWEDJJrVMWJQQJ99BDACGhslBXJ3w3AAAYACOGKGni";
const AZURE_SPEECH_REGION = "centralindia";

let synthesizer = null;
let isSpeaking = false;

// Story Generation
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("prompt").value.trim();
  const prompt = `Write a fun, detailed, and simple children's story (about 300-400 words) in easy English. Do not include this prompt in the story. Story topic: ${userInput}`;

  storyEl.textContent = "Generating story...";

  try {
    const response = await fetch("https://your-backend-url.com/generate-story", {  // Update this URL to your actual backend URL
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: userInput,
      }),
    });

    const data = await response.json();
    const story = data.story || "No story generated.";

    // Clean the story: Remove prompt if repeated
    const cleanedStory = story.replace(prompt, "").trim();
    storyEl.textContent = cleanedStory;
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

