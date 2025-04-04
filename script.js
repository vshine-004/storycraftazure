const form = document.getElementById("story-form");
const storyEl = document.getElementById("story");
const speakBtn = document.getElementById("speak-btn");
const stopBtn = document.getElementById("stop-btn");
const saveBtn = document.getElementById("save-btn");

// Hugging Face Token
const HUGGING_FACE_API_TOKEN = "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";

// Azure Keys
const AZURE_SPEECH_KEY = "6siXlmXbDoab14hWXAuHCALCr77pSNxAyrl5YZmCYEKWEDJJrVMWJQQJ99BDACGhslBXJ3w3AAAYACOGKGni";
const AZURE_SPEECH_REGION = "centralindia";

// Azure Blob SAS URL
const AZURE_BLOB_SAS_URL = "https://storycraftblob.blob.core.windows.net/stories?sp=rcw&st=2025-04-04T10:42:01Z&se=2025-06-10T18:42:01Z&spr=https&sv=2024-11-04&sr=c&sig=rDfkWCz8JHt1XIc5W1QYIV51hgonFS7wcWJ0P7gGF5w%3D";

let synthesizer = null; // Global variable

// STORY GENERATION
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = document.getElementById("prompt").value;
  const prompt = `Write a short and simple story for kids in easy English about: ${userInput}`;
  storyEl.textContent = "📝 Generating story... please wait.";
  console.log("📨 Prompt submitted:", prompt);

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/gpt2", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    });

    const data = await response.json();
    console.log("✅ Hugging Face response:", data);

    const story = data[0]?.generated_text || "No story generated.";
    storyEl.textContent = story.trim();
    console.log("📘 Story generated:", story);
  } catch (error) {
    console.error("❌ Error generating story:", error);
    storyEl.textContent = "❌ Error generating story. Please try again.";
  }
});

// TEXT TO SPEECH
speakBtn.addEventListener("click", () => {
  const SpeechSDK = window.SpeechSDK;
  const storyText = storyEl.textContent;

  if (!SpeechSDK) {
    console.error("🛑 Azure Speech SDK not loaded.");
    return;
  }
  if (!storyText) {
    console.warn("⚠️ No story to speak.");
    return;
  }

  const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(AZURE_SPEECH_KEY, AZURE_SPEECH_REGION);
  const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
  synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);

  console.log("🔊 Speaking started...");

  synthesizer.speakTextAsync(
    storyText,
    result => {
      if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
        console.log("✅ Speech synthesis completed.");
      } else {
        console.error("❌ Speech synthesis failed:", result.errorDetails);
      }
      // Don’t close immediately — let the stop button control it
    },
    error => {
      console.error("❌ Speech synthesis error:", error);
      synthesizer?.close();
      synthesizer = null;
    }
  );
});

// STOP VOICE
stopBtn.addEventListener("click", () => {
  if (synthesizer) {
    console.log("🛑 Trying to stop speech...");
    synthesizer.stopSpeakingAsync(() => {
      synthesizer.close();
      synthesizer = null;
      console.log("✅ Speech stopped.");
    }, error => {
      console.error("❌ Error stopping speech:", error);
    });
  } else {
    console.warn("⚠️ No active synthesizer.");
  }
});

// SAVE TO AZURE BLOB
saveBtn.addEventListener("click", async () => {
  const storyText = storyEl.textContent;
  if (!storyText || storyText.includes("Generating") || storyText.includes("Error")) {
    alert("⚠️ No valid story to save.");
    return;
  }

  const fileName = `story-${Date.now()}.txt`;
  const uploadUrl = `${AZURE_BLOB_SAS_URL.split('?')[0]}/${fileName}?${AZURE_BLOB_SAS_URL.split('?')[1]}`;
  console.log("⬆️ Uploading to Blob:", uploadUrl);

  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": "text/plain",
      },
      body: storyText,
    });

    if (response.ok) {
      console.log("✅ Story uploaded to Azure.");
      alert("✅ Story saved to Azure Blob Storage!");
    } else {
      console.error("❌ Upload failed:", response.status);
      const errText = await response.text();
      console.error("Response text:", errText);
      alert("❌ Error saving story.");
    }
  } catch (error) {
    console.error("❌ Blob upload error:", error);
    alert("❌ Network or CORS error while uploading.");
  }
});
