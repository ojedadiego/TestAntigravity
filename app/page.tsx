import Link from 'next/link';
import { getAllNewsletters } from '@/lib/data';

export default function Home() {
  const newsletters = getAllNewsletters();

  return (
    <div>
      <section className="hero-section">
        <h2 className="hero-title">Stay Ahead of the Curve</h2>
        <p className="hero-subtitle">
          Your daily dose of the most important Artificial Intelligence news,
          summarized by AI, delivered to your inbox and archived here.
        </p>
      </section>

      {newsletters.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>No newsletters generated yet. The first one will appear tomorrow morning.</p>
        </div>
      ) : (
        <div className="newsletters-grid">
          {newsletters.map((newsletter) => (
            <Link key={newsletter.date} href={`/newsletter/${newsletter.date}`} className="card">
              <span className="card-date">
                {new Date(newsletter.date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <h3 className="card-title">{newsletter.title}</h3>
              <p className="card-summary">{newsletter.intro}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
