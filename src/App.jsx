import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './App.css';

// Using 127.0.0.1 to avoid Node v24 connection issues
const STRAPI_URL = 'http://127.0.0.1:1337';

function App() {
  const [songs, setSongs] = useState([]);
  const [books, setBooks] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data from Strapi..."); // Debug log

        // 1. Fetch Songs
        const songRes = await axios.get(`${STRAPI_URL}/api/songs?populate=*`);
        setSongs(songRes.data.data);

        // 2. Fetch Books
        const bookRes = await axios.get(`${STRAPI_URL}/api/books?populate=*`);
        setBooks(bookRes.data.data);

        // 3. Fetch Movies
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

  if (loading) return <div className="loading">Loading Ministry Content...</div>;

  return (
    <div className="app-container">
      {/* HEADER SECTION */}
      <header className="hero">
        <h1>Jude Jesururu</h1>
        <p>Worship | Writing | Filmmaking</p>
        <button className="cta-button">Invite for Ministry</button>
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
              <button 
                className="btn-play"
                onClick={() => setCurrentSong(song)}
              >
                ▶ Play
              </button>
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
    </div>
  );
}

export default App;