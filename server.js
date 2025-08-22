const http = require("http");
const https = require("https");

function cleanTitle(title) {
  return title
    .replace(/<[^>]*>/g, "") 
    .replace(/&[^;]+;/g, "") 
    .trim();
}

function isValidLink(link) {
  return link.startsWith("https://time.com/") && !link.includes("?");
}

function extractStories(html) {
  const regex = /<a[^>]+href="(https:\/\/time\.com\/\d+[^"]+)"[^>]*>(.*?)<\/a>/g;
  const stories = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    const link = match[1];
    const title = cleanTitle(match[2]);

    if (title && isValidLink(link)) {
      stories.push({ title, link });
    }
    if (stories.length >= 6) break; 
  }

  return stories;
}

function fetchTimeStories(callback) {
  https.get("https://time.com", (res) => {
    let data = "";

    res.on("data", (chunk) => (data += chunk));
    res.on("end", () => callback(extractStories(data)));
  }).on("error", (err) => {
    console.error("Error fetching:", err);
    callback([]);
  });
}

const server = http.createServer((req, res) => {
  if (req.url === "/getTimeStories") {
    fetchTimeStories((stories) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(stories));
    });
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Use /getTimeStories to see latest stories");
  }
});

server.listen(3001, () => {
  console.log("Server running at http://localhost:3001");
});
