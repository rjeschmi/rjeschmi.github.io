import { useState } from 'react'
import './App.css'

interface Post {
  id: number;
  title: string;
  date: string;
  excerpt: string;
  content: string;
}

const POSTS: Post[] = [
  {
    id: 1,
    title: "The Art of Letterpress",
    date: "February 22, 2026",
    excerpt: "Exploring the tactile beauty of traditional printing in a digital age.",
    content: "Letterpress printing is a technique of relief printing using a printing press, a process by which many copies are produced by repeated direct impression of an inked, raised surface against sheets or a continuous roll of paper. It was the normal form of printing text from its invention by Johannes Gutenberg in the mid-15th century until the 19th century and remained in wide use for books and other uses until the second half of the 20th century. Today, it has seen a revival as an artisanal craft, valued for its tactile qualities and the unique 'debossed' effect it leaves on the paper."
  },
  {
    id: 2,
    title: "Typography in the Digital Era",
    date: "February 20, 2026",
    excerpt: "Why serif fonts still hold a special place in our hearts and on our screens.",
    content: "While sans-serif fonts have dominated the web for years due to their clarity on low-resolution screens, the rise of high-DPI displays has brought about a renaissance for serif typography. Serif fonts, with their delicate strokes and historical weight, provide a reading experience that feels more grounded and intimate. In this blog, we celebrate the intersection of classic design and modern technology."
  }
];

function App() {
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);

  const currentPost = POSTS.find(p => p.id === currentPostId);

  return (
    <div className="container">
      <header className="blog-header">
        <h1 className="letterpress clickable" onClick={() => setCurrentPostId(null)}>The Inkwell</h1>
        <p className="subtitle">Musings on design, tech, and the tactile world.</p>
        <hr className="divider" />
      </header>

      <main>
        {currentPost ? (
          <article className="post-view">
            <button className="back-btn" onClick={() => setCurrentPostId(null)}>← Back to Archive</button>
            <h2 className="letterpress">{currentPost.title}</h2>
            <p className="post-date">{currentPost.date}</p>
            <div className="post-content">
              {currentPost.content.split('\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </article>
        ) : (
          <div className="post-list">
            {POSTS.map(post => (
              <div key={post.id} className="post-item clickable" onClick={() => setCurrentPostId(post.id)}>
                <h2 className="letterpress">{post.title}</h2>
                <p className="post-date">{post.date}</p>
                <p className="post-excerpt">{post.excerpt}</p>
                <span className="read-more">Read more...</span>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="blog-footer">
        <hr className="divider" />
        <p>© 2026 The Inkwell. Handcrafted with React.</p>
      </footer>
    </div>
  )
}

export default App
