const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI("AIzaSyAJKhsfG8rG3aLn8nBreao99ux-3Aq6Unk");

async function main() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    const result = await model.embedContent("Hello world");
    console.log("Dimension:", result.embedding.values.length);
  } catch (e) {
    console.error(e);
  }
}

main();
