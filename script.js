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

  const prompt = `Write a fun, detailed, and simple children's story (about 300-400 words) in easy English. Do not include this prompt in the story. Story topic: ${userInput}`;

  storyPara.textContent = "Generating story... ✨";
  outputSection.classList.remove("hidden");

  try {
    const res = await fetch("https://azurebackend-wbne.onrender.com/generate-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();
    storyPara.textContent = data.story || "Oops! No story was returned.";
  } catch (err) {
    console.error("Error:", err);
    storyPara.textContent = "Something went wrong. Try again!";
  }
});

speakBtn.addEventListener("click", () => {
  if (utterance) speechSynthesis.cancel();

  utterance = new SpeechSynthesisUtterance(storyPara.textContent);
  utterance.lang = "en-US";
  speechSynthesis.speak(utterance);
});

stopBtn.addEventListener("click", () => {
  speechSynthesis.cancel();
});

saveBtn.addEventListener("click", () => {
  const blob = new Blob([storyPara.textContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "my-story.txt";
  a.click();

  URL.revokeObjectURL(url);
});
