const apiKey = process.env.GEMINI_API_KEY;
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data.models.slice(0, 2), null, 2)))
  .catch(console.error);
