import fs from 'fs';
import path from 'path';

export interface NewsItem {
  title: string;
  link: string;
  summary: string;
  source: string;
}

export interface Newsletter {
  date: string;
  title: string;
  intro: string;
  items: NewsItem[];
}

const dataDirectory = path.join(process.cwd(), 'data', 'newsletters');

export function getAllNewsletters(): Newsletter[] {
  if (!fs.existsSync(dataDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(dataDirectory);
  const allNewslettersData = fileNames
    .filter((fileName) => fileName.endsWith('.json'))
    .map((fileName) => {
      const fullPath = path.join(dataDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(fileContents) as Newsletter;
    });

  // Sort newsletters by date descending
  return allNewslettersData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export function getNewsletterByDate(date: string): Newsletter | undefined {
  const fullPath = path.join(dataDirectory, `${date}.json`);
  if (!fs.existsSync(fullPath)) {
    return undefined;
  }
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  return JSON.parse(fileContents) as Newsletter;
}
