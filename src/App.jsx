import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AudioPlayer from 'react-h5-audio-player';
import emailjs from '@emailjs/browser';
import 'react-h5-audio-player/lib/styles.css';
import './App.css';

const STRAPI_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:1337';

// =========================================
// HELPER 1: Currency Formatter
// Turns (5000, 'NGN') into "₦5,000.00"
// =========================================
const formatCurrency = (amount, currencyCode) => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (error) {
    return `${currencyCode} ${amount}`;
  }
};

// =========================================
// HELPER 2: Extract Text from Strapi Blocks
// Handles both Rich Text (Arrays) and Simple Text (Strings)
// =========================================
const getSynopsisText = (synopsis) => {
  if (!synopsis) return '';
  if (typeof synopsis === 'string') return synopsis;
  if (Array.isArray(synopsis)) {
    return synopsis.map(block => {
      if (block.children) return block.children.map(child => child.text).join(' ');
      return '';
    }).join(' ');
  }
  return '';
};

// =========================================
// COMPONENT: Book Card (Smart Pricing & Layout)
// =========================================
const BookCard = ({ book, userCurrency }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const synopsis = getSynopsisText(book.Synopsis);
  
  const formattedDate = new Date(book.publishedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  // --- PRICING LOGIC ---
  // 1. Start with default Price field
  let displayPrice = book.Price; 

  // 1. Get the pricing list (Check both Capital 'L' and small 'l')
  // Strapi usually sends 'localPrices', but we check 'LocalPrices' just in case.
  const prices = book.localPrices || book.LocalPrices || [];

  // 2. Check if we have data
  if (prices.length > 0) {
    // Try to find the user's local currency
    const localMatch = prices.find(p => p.Currency === userCurrency);
    // Try to find USD as a fallback
    const usdMatch = prices.find(p => p.Currency === 'USD');

    if (localMatch) {
      displayPrice = formatCurrency(localMatch.Amount, localMatch.Currency);
    } else if (usdMatch) {
      displayPrice = formatCurrency(usdMatch.Amount, 'USD');
    }
  }

  return (
    <div className="group bg-white rounded-sm shadow-sm hover:shadow-xl transition duration-300 border border-gray-100 flex flex-col h-full">
      {/* Image */}
      <div className="h-64 sm:h-80 overflow-hidden bg-gray-100 relative flex-shrink-0">
        {book.CoverArt && (
          <img src={book.CoverArt.url} alt={book.Title} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" />
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow relative">
        <h3 className="text-xl font-bold text-gray-900 mb-3 font-serif leading-tight">{book.Title}</h3>
        
        {/* Synopsis Area */}
        <div className="relative mb-4 flex-grow">
            <p className={`text-gray-600 text-sm transition-all duration-300 ${!isExpanded ? 'line-clamp-3 md:line-clamp-none' : ''}`}>
                {synopsis}
            </p>
           {/* Mobile Expand Button */}
           {synopsis && !isExpanded && (
              <button onClick={() => setIsExpanded(true)} className="md:hidden mt-2 text-xs font-bold text-ministry-blue uppercase tracking-wider flex items-center focus:outline-none hover:text-ministry-gold">
                View More ↓
              </button>
           )}
           {/* Mobile Collapse Button */}
           {isExpanded && (
              <button onClick={() => setIsExpanded(false)} className="md:hidden mt-2 text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center focus:outline-none hover:text-ministry-blue">
                Show Less ↑
              </button>
           )}
        </div>

        {/* Footer Row: Date | Price | Button */}
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between bg-gray-50/50 -mx-6 -mb-6 p-4">
            <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{formattedDate}</span>
                <span className="text-ministry-gold font-bold text-lg leading-none mt-1">{displayPrice}</span>
            </div>
            <a href={book.BuyLink} className="inline-flex items-center justify-center px-4 py-2 bg-ministry-blue text-white text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-ministry-gold transition shadow-sm">
              Get Copy
            </a>
        </div>
      </div>
    </div>
  );
};

// =========================================
// MAIN APP COMPONENT
// =========================================
function App() {
  // 1. STATE DEFINITIONS
  const [songs, setSongs] = useState([]);
  const [books, setBooks] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', churchName: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userCurrency, setUserCurrency] = useState('USD'); // Default to USD

  // 2. DATA FETCHING (Using useEffect)
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🚀 Starting Data Fetch...");

        // A. Detect User Location (For Currency)
        try {
          const geoRes = await axios.get('https://ipapi.co/json/');
          if (geoRes.data.currency) {
            console.log("📍 User detected in:", geoRes.data.country_name, "Currency:", geoRes.data.currency);
            setUserCurrency(geoRes.data.currency);
          }
        } catch (geoError) {
          console.warn("Location detection failed, defaulting to USD.");
        }

        // B. Fetch Content from Strapi
        const [songRes, bookRes, movieRes] = await Promise.all([
          axios.get(`${STRAPI_URL}/api/songs?populate=*`),
          axios.get(`${STRAPI_URL}/api/books?populate=*`),
          axios.get(`${STRAPI_URL}/api/movies?populate=*`)
        ]);

        console.log("📚 Books Data:", bookRes.data.data); // Debug log

        setSongs(songRes.data.data);
        setBooks(bookRes.data.data);
        setMovies(movieRes.data.data);
        setLoading(false);
        console.log(bookRes.data);
      } catch (error) {
        console.error("❌ Error connecting to Strapi:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 3. BOOKING HANDLER
  const handleBooking = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    
    // Prepare EmailJS Data
    const emailParams = { 
      name: formData.name, 
      churchName: formData.churchName, 
      email: formData.email, 
      message: formData.message 
    };

    try {
      // Step A: Save to Strapi Database
      await axios.post(`${STRAPI_URL}/api/bookings`, { 
        data: { 
            Name: formData.name, 
            ChurchName: formData.churchName, 
            Email: formData.email, 
            Message: formData.message 
        } 
      });
      
      // Step B: Send Email Notification (Uncomment and add keys to use)
      // await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', emailParams, 'YOUR_PUBLIC_KEY');
      
      setFormStatus('success');
      setTimeout(() => { 
        setShowModal(false); 
        setFormStatus(''); 
        setFormData({ name: '', churchName: '', email: '', message: '' }); 
      }, 2000);
    } catch (error) { 
        console.error("Booking Error:", error); 
        setFormStatus('error'); 
    }
  };

  // 4. SCROLL HANDLER
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // 5. LOADING SCREEN
  if (loading) return <div className="h-screen flex justify-center items-center bg-ministry-blue text-ministry-gold font-bold tracking-widest">LOADING PORTFOLIO...</div>;

  // 6. MAIN RENDER
  return (
    <div className="w-full overflow-x-hidden font-sans text-gray-800">
      
      {/* NAVBAR */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={() => scrollToSection('home')}>
              <span className="font-serif text-2xl font-bold text-ministry-blue tracking-wider">
                JUDE <span className="text-ministry-gold">JESURURU</span>
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 items-center">
              {['Home', 'About', 'Books', 'Films', 'Worship'].map((item) => (
                <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="text-sm font-bold uppercase text-ministry-blue hover:text-ministry-gold transition">{item}</button>
              ))}
              <button onClick={() => setShowModal(true)} className="bg-ministry-gold text-white px-6 py-2 rounded-sm font-bold uppercase text-xs tracking-widest hover:bg-ministry-blue transition">Invite</button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-ministry-blue hover:text-ministry-gold focus:outline-none">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />)}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 flex flex-col items-center">
              {['Home', 'About', 'Books', 'Films', 'Worship'].map((item) => (
                <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="block px-3 py-4 text-base font-bold text-ministry-blue hover:text-ministry-gold">{item}</button>
              ))}
              <button onClick={() => setShowModal(true)} className="w-full mt-4 bg-ministry-gold text-white py-3 font-bold uppercase tracking-widest">Invite</button>
            </div>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <header id="home" className="relative pt-20 min-h-screen flex items-center bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left order-2 md:order-1">
             <div className="inline-block border-b-2 border-ministry-gold pb-2 mb-4">
                <span className="text-ministry-gold font-bold tracking-[0.2em] uppercase text-xs">Official Ministry Portfolio</span>
             </div>
             <h1 className="text-5xl md:text-7xl font-serif font-bold text-ministry-blue leading-tight mb-6">
               Jude <br/><span className="text-ministry-gold">Jesururu</span>
             </h1>
             <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto md:mx-0">
               Proclaiming the Kingdom through worship, writing, and filmmaking. Bridging the gap between faith and excellence.
             </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
               <button onClick={() => setShowModal(true)} className="bg-ministry-blue text-white px-8 py-4 font-bold tracking-widest uppercase hover:bg-ministry-gold transition shadow-lg">
                 Invite For Ministry
               </button>
               <button onClick={() => scrollToSection('books')} className="border-2 border-ministry-blue text-ministry-blue px-8 py-4 font-bold tracking-widest uppercase hover:bg-ministry-blue hover:text-white transition">
                 Resources
               </button>
             </div>
          </div>
          {/* Floating Portrait */}
          <div className="relative order-1 md:order-2 flex justify-center items-center">
             <div className="relative h-[450px] w-[320px] md:h-[600px] md:w-[420px]">
                <div className="absolute top-5 right-5 w-full h-full border-[1px] border-ministry-gold/50 rounded-sm -z-0"></div>
                <div className="relative h-full w-full bg-gray-100 rounded-sm shadow-[0_20px_50px_rgba(0,35,102,0.2)] overflow-hidden z-10">
                   <img src="/me.jpg" alt="Jude Jesururu" className="w-full h-full object-cover" onError={(e) => {e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=800&q=80'}} /> 
                </div>
             </div>
          </div>
        </div>
      </header>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold text-ministry-blue mb-8">About The Ministry</h2>
          <div className="w-16 h-1 bg-ministry-gold mx-auto mb-10"></div>
          <div className="text-lg text-gray-600 leading-relaxed space-y-6">
            <p>Jude Jesururu is a multi-dimensional minister of the Gospel, dedicated to expressing the truth of God's Kingdom through various creative mediums.</p>
            <p>With a mandate to <strong>"Bridge the gap between Faith and Excellence,"</strong> Jude combines theological depth with professional artistry in music, literature, and cinema.</p>
            <div className="pt-8"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Signature_sample.svg/1200px-Signature_sample.svg.png" alt="Signature" className="h-12 mx-auto opacity-50" /></div>
          </div>
        </div>
      </section>

      {/* BOOKS SECTION (Using the New Component) */}
      <section id="books" className="py-24 bg-ministry-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-ministry-blue mb-4">Books & Resources</h2>
            <div className="w-20 h-1 bg-ministry-gold mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 items-start">
            {books.map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                userCurrency={userCurrency} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* FILMS SECTION */}
      <section id="films" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-ministry-blue mb-4">Films & Scripts</h2>
            <div className="w-20 h-1 bg-ministry-gold mx-auto"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {movies.map((movie) => (
              <div key={movie.id} className="bg-white shadow-lg rounded-sm overflow-hidden flex flex-col md:flex-row border border-gray-100">
                 <div className="md:w-1/2 h-64 md:h-auto overflow-hidden">
                    {movie.Poster && <img src={movie.Poster.url} alt={movie.Title} className="w-full h-full object-cover" />}
                 </div>
                 <div className="p-8 md:w-1/2 flex flex-col justify-center">
                    <span className="text-xs font-bold text-ministry-gold uppercase tracking-widest mb-2">{movie.Category}</span>
                    <h3 className="text-2xl font-serif font-bold text-ministry-blue mb-6">{movie.Title}</h3>
                    <a href={movie.VideoLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-sm font-bold uppercase tracking-wider hover:border-ministry-blue hover:text-ministry-blue transition text-gray-600">
                       Watch Trailer
                    </a>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WORSHIP SECTION */}
      <section id="worship" className="py-24 bg-ministry-blue text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-white mb-4">Worship Moments</h2>
            <div className="w-20 h-1 bg-ministry-gold mx-auto"></div>
          </div>
          <div className="space-y-4">
            {songs.map((song) => (
              <div key={song.id} onClick={() => setCurrentSong(song)} 
                   className="group flex items-center p-6 bg-white/5 border border-white/10 hover:bg-ministry-gold hover:border-ministry-gold hover:text-ministry-blue cursor-pointer transition duration-300 rounded-sm">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-ministry-gold text-ministry-blue group-hover:bg-ministry-blue group-hover:text-white transition">▶</div>
                <div className="ml-6 flex-1">
                  <h4 className="text-lg font-bold">{song.Title}</h4>
                  <p className="text-sm opacity-70 group-hover:opacity-100">Jude Jesururu</p>
                </div>
                <div className="text-xs font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">Listen</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-ministry-blue text-white py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="font-serif text-2xl font-bold text-ministry-gold mb-4">JUDE JESURURU</h3>
          <p className="text-gray-400 text-sm mb-6">© {new Date().getFullYear()} All Rights Reserved.</p>
          <div className="flex justify-center space-x-6 text-sm font-bold uppercase tracking-widest text-gray-400">
            <a href="#" className="hover:text-ministry-gold transition">Instagram</a>
            <a href="#" className="hover:text-ministry-gold transition">YouTube</a>
            <a href="#" className="hover:text-ministry-gold transition">Twitter</a>
          </div>
        </div>
      </footer>

      {/* FIXED AUDIO PLAYER */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-ministry-blue border-t border-ministry-gold">
          <AudioPlayer
            autoPlay
            src={currentSong.AudioFile.url}
            header={`Now Playing: ${currentSong.Title}`}
            showSkipControls={false}
            layout="horizontal-reverse" 
            customAdditionalControls={[]}
            style={{ background: 'transparent', color: 'white', boxShadow: 'none' }}
          />
        </div>
      )}

      {/* BOOKING MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-lg p-8 rounded-sm shadow-2xl relative">
                <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-xl font-bold" onClick={() => setShowModal(false)}>✕</button>
                <h2 className="text-2xl font-serif font-bold text-ministry-blue mb-6 border-b border-gray-100 pb-2">Invite Jude</h2>
                {formStatus === 'success' ? (
                    <div className="text-center py-8 text-green-600 font-bold text-lg">Request Sent! God bless you.</div>
                ) : (
                    <form onSubmit={handleBooking} className="space-y-4">
                        <input type="text" placeholder="Your Name" required className="w-full p-3 border border-gray-300 focus:border-ministry-gold focus:outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        <input type="text" placeholder="Church / Ministry Name" required className="w-full p-3 border border-gray-300 focus:border-ministry-gold focus:outline-none" value={formData.churchName} onChange={e => setFormData({...formData, churchName: e.target.value})} />
                        <input type="email" placeholder="Email Address" required className="w-full p-3 border border-gray-300 focus:border-ministry-gold focus:outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        <textarea placeholder="Tell us about the event..." rows="4" required className="w-full p-3 border border-gray-300 focus:border-ministry-gold focus:outline-none" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                        <button type="submit" className="w-full bg-ministry-blue text-white py-4 font-bold uppercase tracking-widest hover:bg-ministry-gold transition duration-300">{formStatus === 'sending' ? 'Sending...' : 'Send Invitation'}</button>
                    </form>
                )}
            </div>
        </div>
      )}

    </div>
  );
}

export default App;