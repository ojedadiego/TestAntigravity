import { getAllNewsletters, getNewsletterByDate } from '@/lib/data';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const newsletters = getAllNewsletters();
  return newsletters.map((newsletter) => ({
    date: newsletter.date,
  }));
}

export default function NewsletterPage({ params }: { params: { date: string } }) {
  const newsletter = getNewsletterByDate(params.date);

  if (!newsletter) {
    notFound();
  }

  const formattedDate = new Date(newsletter.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="article-view">
      <header className="article-header">
        <span className="date">{formattedDate}</span>
        <h1>{newsletter.title}</h1>
      </header>
      
      <div className="article-content">
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '3rem', fontStyle: 'italic' }}>
          {newsletter.intro}
        </p>

        {newsletter.items.map((item, index) => (
          <div key={index} className="news-item">
            <h2>
              <a href={item.link} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
            </h2>
            <p>{item.summary}</p>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Source: {item.source}
            </div>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="read-more">
              Read Original Article &rarr;
            </a>
          </div>
        ))}
      </div>
    </article>
  );
}
