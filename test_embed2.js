const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI("AIzaSyAJKhsfG8rG3aLn8nBreao99ux-3Aq6Unk");

async function main() {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent("Hello world");
    console.log("text-embedding-004 Dimension:", result.embedding.values.length);
  } catch (e) {
    console.log("text-embedding-004 failed", e.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent({
      content: { parts: [{ text: "Hello" }], role: 'user' },
      outputDimensionality: 768,
    });
    console.log("gemini-embedding-2 (768) Dimension:", result.embedding.values.length);
  } catch (e) {
    console.log("gemini-embedding-2 with 768 failed:", e.message);
  }
}

main();
