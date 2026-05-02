const apiKey = "AIzaSyAJKhsfG8rG3aLn8nBreao99ux-3Aq6Unk";

async function main() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    console.log(data.models.map(m => m.name).join('\n'));
  } catch (e) {
    console.error(e);
  }
}

main();
