const Parser = require('rss-parser');
const { GoogleGenAI } = require('@google/genai');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Configuration
const FEEDS = [
  'https://www.artificialintelligence-news.com/feed/',
  'https://cset.georgetown.edu/news/feed/',
  'https://news.mit.edu/rss/topic/artificial-intelligence2'
];

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO_EMAIL = process.env.TO_EMAIL;

if (!GEMINI_API_KEY || !RESEND_API_KEY || !TO_EMAIL) {
  console.error("Missing required environment variables: GEMINI_API_KEY, RESEND_API_KEY, TO_EMAIL");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const resend = new Resend(RESEND_API_KEY);
const parser = new Parser();

async function fetchNews() {
  let allArticles = [];
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  for (const feedUrl of FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      const recentArticles = feed.items.filter(item => {
        const pubDate = new Date(item.pubDate).getTime();
        return pubDate > oneDayAgo;
      });
      allArticles.push(...recentArticles.map(item => ({
        title: item.title,
        link: item.link,
        contentSnippet: item.contentSnippet || item.content || '',
        source: feed.title || new URL(feedUrl).hostname
      })));
    } catch (error) {
      console.error(`Error fetching feed ${feedUrl}:`, error);
    }
  }
  return allArticles;
}

async function summarizeNews(articles) {
  if (articles.length === 0) {
    return null;
  }

  // To avoid hitting context limits or sending too much data, let's take the top 10 recent articles
  const topArticles = articles.slice(0, 10);
  
  const prompt = `
    You are an expert AI news editor. I am providing you with a list of recent AI news articles from the last 24 hours.
    Your task is to select the 3-5 most important and impactful stories, and write a cohesive, engaging summary for a daily newsletter.
    
    Output the response STRICTLY as a JSON object with the following structure:
    {
      "title": "A catchy title for today's newsletter (e.g. 'OpenAI's New Model & The Future of Agents')",
      "intro": "A short, engaging introductory paragraph summarizing the overall theme of today's news.",
      "items": [
        {
          "title": "The article title",
          "summary": "A 2-3 sentence summary explaining why this is important.",
          "link": "The original URL provided",
          "source": "The source name provided"
        }
      ]
    }

    Here are the articles:
    ${JSON.stringify(topArticles, null, 2)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return null;
  }
}

function generateHtmlEmail(newsletterData) {
  const itemsHtml = newsletterData.items.map(item => `
    <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #333;">
      <h2 style="font-size: 20px; margin-bottom: 10px; color: #ffffff;">
        <a href="${item.link}" style="color: #66fcf1; text-decoration: none;">${item.title}</a>
      </h2>
      <p style="color: #c5c6c7; font-size: 16px; line-height: 1.6;">${item.summary}</p>
      <div style="margin-top: 10px; font-size: 14px; color: #8c8c8e;">
        Source: ${item.source}
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${newsletterData.title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0b0c10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #1f2833; padding: 40px 30px; border-radius: 10px; margin-top: 20px; margin-bottom: 20px; border: 1px solid rgba(102, 252, 241, 0.15);">
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
          <h1 style="color: #ffffff; font-size: 28px; margin: 0;">AI<span style="color: #66fcf1;">Daily</span></h1>
          <p style="color: #8c8c8e; margin-top: 5px; font-size: 14px;">Your daily curated insights</p>
        </div>
        
        <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 15px;">${newsletterData.title}</h1>
        <p style="color: #c5c6c7; font-size: 16px; line-height: 1.6; font-style: italic; margin-bottom: 30px;">
          ${newsletterData.intro}
        </p>

        ${itemsHtml}

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); color: #8c8c8e; font-size: 12px;">
          <p>&copy; ${new Date().getFullYear()} AI Daily Briefing. Automatically generated.</p>
          <p>You received this email because you subscribed to the AI Daily Newsletter.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function main() {
  console.log("Fetching news from the last 24 hours...");
  const articles = await fetchNews();
  console.log(`Found ${articles.length} articles.`);

  if (articles.length === 0) {
    console.log("No new articles found. Exiting.");
    return;
  }

  console.log("Summarizing news with Gemini...");
  const newsletterData = await summarizeNews(articles);

  if (!newsletterData) {
    console.error("Failed to generate newsletter data. Exiting.");
    process.exit(1);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  newsletterData.date = todayStr;

  console.log("Saving newsletter to data folder...");
  const dataDir = path.join(process.cwd(), 'data', 'newsletters');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(dataDir, \`\${todayStr}.json\`),
    JSON.stringify(newsletterData, null, 2)
  );

  console.log("Generating HTML email...");
  const htmlContent = generateHtmlEmail(newsletterData);

  console.log("Sending email via Resend...");
  try {
    await resend.emails.send({
      from: 'AI Daily <newsletter@resend.dev>', // Depending on Resend domain setup, usually requires a verified domain. Use resend.dev for testing.
      to: [TO_EMAIL],
      subject: `AI Daily: ${newsletterData.title}`,
      html: htmlContent
    });
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
    process.exit(1);
  }
}

main().catch(console.error);
