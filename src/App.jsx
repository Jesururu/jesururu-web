import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './App.css';

const STRAPI_URL = 'http://127.0.0.1:1337';

function App() {
  const [songs, setSongs] = useState([]);
  const [books, setBooks] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState(null);
  
  // NEW: State for the Booking Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', churchName: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState(''); // 'sending', 'success', 'error'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const songRes = await axios.get(`${STRAPI_URL}/api/songs?populate=*`);
        setSongs(songRes.data.data);
        const bookRes = await axios.get(`${STRAPI_URL}/api/books?populate=*`);
        setBooks(bookRes.data.data);
        const movieRes = await axios.get(`${STRAPI_URL}/api/movies?populate=*`);
        setMovies(movieRes.data.data);
        setLoading(false);
      } catch (error) {
        console.error("Error connecting to Strapi:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // NEW: Handle Form Submit
  const handleBooking = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      // Send data to Strapi 'Bookings' collection
      await axios.post(`${STRAPI_URL}/api/bookings`, {
        data: {
            Name: formData.name,
            ChurchName: formData.churchName,
            Email: formData.email,
            Message: formData.message
        }
      });
      setFormStatus('success');
      // Clear form after 2 seconds
      setTimeout(() => {
        setShowModal(false);
        setFormStatus('');
        setFormData({ name: '', churchName: '', email: '', message: '' });
      }, 2000);
    } catch (error) {
      console.error(error);
      setFormStatus('error');
    }
  };

  if (loading) return <div className="loading">Loading Ministry Content...</div>;

  return (
    <div className="app-container">
      {/* HEADER SECTION */}
      <header className="hero">
        <h1>Jude Jesururu</h1>
        <p>Worship | Writing | Filmmaking</p>
        <button className="cta-button" onClick={() => setShowModal(true)}>
            Invite for Ministry
        </button>
      </header>

      {/* BOOKS SECTION */}
      <section className="section">
        <h2>📚 Books & Resources</h2>
        <div className="grid">
          {books.map((book) => {
             const imageUrl = book.CoverArt ? `${STRAPI_URL}${book.CoverArt.url}` : null;
             return (
              <div key={book.id} className="card book-card">
                {imageUrl && <img src={imageUrl} alt={book.Title} className="book-cover" />}
                <div className="card-content">
                  <h3>{book.Title}</h3>
                  <p className="price">{book.Price}</p>
                  <a href={book.BuyLink} className="btn-buy">Get Copy</a>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* MOVIES SECTION */}
      <section className="section alt-bg">
        <h2>🎬 Films & Scripts</h2>
        <div className="grid">
          {movies.map((movie) => {
            const posterUrl = movie.Poster ? `${STRAPI_URL}${movie.Poster.url}` : null;
            return (
              <div key={movie.id} className="card movie-card">
                {posterUrl && <img src={posterUrl} alt={movie.Title} className="movie-poster" />}
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

      {/* MUSIC SECTION */}
      <section className="section" style={{ marginBottom: '100px' }}>
        <h2>🎵 Worship & Music</h2>
        <div className="song-list">
          {songs.map((song) => (
            <div key={song.id} className="song-row">
              <div className="song-info">
                <strong>{song.Title}</strong>
              </div>
              <button className="btn-play" onClick={() => setCurrentSong(song)}>▶ Play</button>
            </div>
          ))}
        </div>
      </section>

      {/* PERSISTENT AUDIO PLAYER */}
      {currentSong && (
        <div className="fixed-player">
          <AudioPlayer
            autoPlay
            src={`${STRAPI_URL}${currentSong.AudioFile.url}`}
            header={`Now Playing: ${currentSong.Title}`}
            showSkipControls={false}
          />
        </div>
      )}

      {/* NEW: BOOKING MODAL */}
      {showModal && (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={() => setShowModal(false)}>X</button>
                <h2>Invite Jude</h2>
                
                {formStatus === 'success' ? (
                    <div className="success-message">Request Sent! God bless you.</div>
                ) : (
                    <form onSubmit={handleBooking}>
                        <input type="text" placeholder="Your Name" required 
                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <input type="text" placeholder="Church / Ministry Name" required 
                             value={formData.churchName} onChange={e => setFormData({...formData, churchName: e.target.value})} />
                        <input type="email" placeholder="Email Address" required 
                             value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        <textarea placeholder="Tell us about the event..." rows="4" required
                             value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                        
                        <button type="submit" className="cta-button" style={{width: '100%', marginTop: '10px'}}>
                            {formStatus === 'sending' ? 'Sending...' : 'Send Invitation'}
                        </button>
                    </form>
                )}
            </div>
        </div>
      )}

    </div>
  );
}

export default App;