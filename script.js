const form = document.getElementById("story-form");
const storyEl = document.getElementById("story");
const speakBtn = document.getElementById("speak-btn");
const stopBtn = document.getElementById("stop-btn");
const saveBtn = document.getElementById("save-btn");

const HUGGING_FACE_API_TOKEN = "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";
const AZURE_SPEECH_KEY = "6siXlmXbDoab14hWXAuHCALCr77pSNxAyrl5YZmCYEKWEDJJrVMWJQQJ99BDACGhslBXJ3w3AAAYACOGKGni";
const AZURE_SPEECH_REGION = "centralindia";
const AZURE_BLOB_SAS_URL = "https://storycraftblob.blob.core.windows.net/stories?sp=rcw&st=2025-04-04T10:42:01Z&se=2025-06-10T18:42:01Z&spr=https&sv=2024-11-04&sr=c&sig=rDfkWCz8JHt1XIc5W1QYIV51hgonFS7wcWJ0P7gGF5w%3D";

let synthesizer = null;
let isSpeaking = false;

// Story Generation
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("prompt").value.trim();
  const prompt = `Write a short and simple story for children in easy English about: ${userInput}`;

  storyEl.textContent = "Generating story...";

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
        }
      }),
    });

    const data = await response.json();
    const story = data[0]?.generated_text || "No story generated.";
    storyEl.textContent = story.trim();
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

