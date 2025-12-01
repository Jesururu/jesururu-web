import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './App.css';

// Professional Environment Variable Handling
const STRAPI_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:1337';

function App() {
  const [songs, setSongs] = useState([]);
  const [books, setBooks] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState(null);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', churchName: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState('');

  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [songRes, bookRes, movieRes] = await Promise.all([
          axios.get(`${STRAPI_URL}/api/songs?populate=*`),
          axios.get(`${STRAPI_URL}/api/books?populate=*`),
          axios.get(`${STRAPI_URL}/api/movies?populate=*`)
        ]);
        
        setSongs(songRes.data.data);
        setBooks(bookRes.data.data);
        setMovies(movieRes.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error connecting to Strapi:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleBooking = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      await axios.post(`${STRAPI_URL}/api/bookings`, {
        data: { Name: formData.name, ChurchName: formData.churchName, Email: formData.email, Message: formData.message }
      });
      setFormStatus('success');
      setTimeout(() => { setShowModal(false); setFormStatus(''); setFormData({ name: '', churchName: '', email: '', message: '' }); }, 2000);
    } catch (error) { setFormStatus('error'); }
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="app-container">
      
      {/* NAVIGATION BAR */}
      <nav className="navbar">
        <div className="nav-logo">JUDE JESURURU</div>
        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <button onClick={() => scrollToSection('home')}>Home</button>
          <button onClick={() => scrollToSection('books')}>Books</button>
          <button onClick={() => scrollToSection('films')}>Films</button>
          <button onClick={() => scrollToSection('worship')}>Worship</button>
          <button className="nav-cta" onClick={() => setShowModal(true)}>Invite</button>
        </div>
        <div className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>☰</div>
      </nav>

      {/* HERO SECTION */}
      <header id="home" className="hero-split">
        <div className="hero-content">
          <span className="hero-subtitle">The Official Ministry Portfolio of</span>
          <h1>Jude Jesururu</h1>
          <p>Proclaiming the Kingdom through Worship, Writing, and Filmmaking.</p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => setShowModal(true)}>Invite for Ministry</button>
            <button className="btn-outline" onClick={() => scrollToSection('books')}>Explore Resources</button>
          </div>
        </div>
        <div className="hero-image">
           {/* Placeholder for your portrait - Replace src later */}
           <div className="portrait-placeholder"></div>
        </div>
      </header>

      {/* BOOKS SECTION */}
      <section id="books" className="section light-bg">
        <div className="section-header">
          <h2>Latest Books</h2>
          <div className="underline"></div>
        </div>
        <div className="grid">
          {books.map((book) => {
             const imageUrl = book.CoverArt ? book.CoverArt.url : null;
             return (
              <div key={book.id} className="card clean-card">
                <div className="card-img-container">
                    {imageUrl && <img src={imageUrl} alt={book.Title} />}
                </div>
                <div className="card-content">
                  <h3>{book.Title}</h3>
                  <p className="price">{book.Price}</p>
                  <a href={book.BuyLink} className="text-link">Get Copy →</a>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* FILMS SECTION */}
      <section id="films" className="section dark-bg">
        <div className="section-header">
          <h2>Films & Scripts</h2>
          <div className="underline gold"></div>
        </div>
        <div className="grid">
          {movies.map((movie) => {
            const posterUrl = movie.Poster ? movie.Poster.url : null;
            return (
              <div key={movie.id} className="card dark-card">
                <div className="card-img-container">
                  {posterUrl && <img src={posterUrl} alt={movie.Title} />}
                </div>
                <div className="card-content">
                  <h3>{movie.Title}</h3>
                  <span className="badge">{movie.Category}</span>
                  <br/>
                  <a href={movie.VideoLink} target="_blank" rel="noreferrer" className="btn-watch">Watch Trailer</a>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* WORSHIP SECTION */}
      <section id="worship" className="section worship-bg">
        <div className="worship-container">
          <div className="section-header">
            <h2>Worship Moments</h2>
            <div className="underline"></div>
          </div>
          <div className="song-list-clean">
            {songs.map((song) => (
              <div key={song.id} className="song-row-clean" onClick={() => setCurrentSong(song)}>
                <div className="play-icon">▶</div>
                <div className="song-details">
                  <strong>{song.Title}</strong>
                  <span>Jude Jesururu</span>
                </div>
                <div className="song-duration">Listen</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <h3>Jude Jesururu</h3>
          <p>© {new Date().getFullYear()} All Rights Reserved.</p>
          <div className="social-links">
            <span>Instagram</span> • <span>YouTube</span> • <span>Twitter</span>
          </div>
        </div>
      </footer>

      {/* PERSISTENT AUDIO PLAYER */}
      {currentSong && (
        <div className="fixed-player">
          <AudioPlayer
            autoPlay
            src={currentSong.AudioFile.url}
            header={`Now Playing: ${currentSong.Title}`}
            showSkipControls={false}
          />
        </div>
      )}

      {/* BOOKING MODAL (Same as before) */}
      {showModal && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
                <h2>Invite Jude</h2>
                {formStatus === 'success' ? (
                    <div className="success-message">Request Sent! God bless you.</div>
                ) : (
                    <form onSubmit={handleBooking}>
                        <input type="text" placeholder="Your Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <input type="text" placeholder="Church / Ministry Name" required value={formData.churchName} onChange={e => setFormData({...formData, churchName: e.target.value})} />
                        <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        <textarea placeholder="Tell us about the event..." rows="4" required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                        <button type="submit" className="btn-primary full-width">{formStatus === 'sending' ? 'Sending...' : 'Send Invitation'}</button>
                    </form>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

export default App;