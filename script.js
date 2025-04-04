const form = document.getElementById("story-form");
const promptInput = document.getElementById("prompt");
const storyPara = document.getElementById("story");
const outputSection = document.getElementById("output-section");
const speakBtn = document.getElementById("speak-btn");
const stopBtn = document.getElementById("stop-btn");
const saveBtn = document.getElementById("save-btn");

let utterance = null;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userInput = promptInput.value.trim();
  if (!userInput) return;

  const finalPrompt = `Write a fun, detailed, and simple children's story (about 300-400 words) in easy English. Do not include this prompt in the story. Story topic: ${userInput}`;
  console.log("Generated prompt:", finalPrompt);
  console.log("Making request to backend...");

  try {
    const res = await fetch("https://azurebackend-wbne.onrender.com/generate-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: finalPrompt })
    });

    const data = await res.json();
    console.log("Backend response:", data);

    const fullStory = data.story;
    const cleanedStory = fullStory.replace(/^Write.*?story topic:.*?\n?/i, "").trim();

    storyPara.textContent = cleanedStory;
    outputSection.classList.remove("hidden");

  } catch (err) {
    console.error("Error generating story:", err);
    storyPara.textContent = "Sorry! Something went wrong. Please try again later.";
    outputSection.classList.remove("hidden");
  }
});

// 🔊 Read Aloud
speakBtn.addEventListener("click", () => {
  const text = storyPara.textContent;
  if (!text) return;

  utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
});

// 🛑 Stop Voice
stopBtn.addEventListener("click", () => {
  if (utterance) speechSynthesis.cancel();
});

// 💾 Save Story
saveBtn.addEventListener("click", () => {
  const text = storyPara.textContent;
  if (!text) return;

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "my_ai_story.txt";
  a.click();
  URL.revokeObjectURL(url);
});
