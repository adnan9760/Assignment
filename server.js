const http = require("http");
const https = require("https");

function cleanTitle(title) {
  let cleaned = title;
  while (cleaned.includes("<")) {
    const start = cleaned.indexOf("<");
    const end = cleaned.indexOf(">", start);
    if (end === -1) break;
    cleaned = cleaned.slice(0, start) + cleaned.slice(end + 1);
  }
  
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " "
  };
  
  for (const [entity, replacement] of Object.entries(entities)) {
    while (cleaned.includes(entity)) {
      cleaned = cleaned.replace(entity, replacement);
    }
  }
  
  return cleaned.trim();
}

function isValidLink(link) {
  return link.startsWith("https://time.com/") && !link.includes("?");
}

function extractStories(html) {
  const stories = [];
  let position = 0;
  
  while (stories.length < 6 && position < html.length) {
    const aTagStart = html.indexOf("<a", position);
    if (aTagStart === -1) break;
    
    const aTagEnd = html.indexOf(">", aTagStart);
    if (aTagEnd === -1) break;
    
    const aTag = html.slice(aTagStart, aTagEnd + 1);
    
    const hrefStart = aTag.indexOf('href="');
    if (hrefStart === -1) {
      position = aTagEnd + 1;
      continue;
    }
    
    const linkStart = hrefStart + 6; 
    const linkEnd = aTag.indexOf('"', linkStart);
    if (linkEnd === -1) {
      position = aTagEnd + 1;
      continue;
    }
    
    const link = aTag.slice(linkStart, linkEnd);
    
    if (!isValidLink(link)) {
      position = aTagEnd + 1;
      continue;
    }
    
    const closingTagStart = html.indexOf("</a>", aTagEnd);
    if (closingTagStart === -1) {
      position = aTagEnd + 1;
      continue;
    }
    
    const textContent = html.slice(aTagEnd + 1, closingTagStart);
    const title = cleanTitle(textContent);
    
    if (title) {
      stories.push({ title, link });
    }
    
    position = closingTagStart + 4; // Move past </a>
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