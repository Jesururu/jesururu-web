import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './App.css';

const STRAPI_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:1337';

// =========================================
// HELPERS
// =========================================
const getImageUrl = (photoField) => {
    if (!photoField) return null;
    let photoData = photoField;
    if (photoData.data) photoData = photoData.data;
    if (photoData.attributes) photoData = photoData.attributes;

    if (!photoData || !photoData.url) return null;
    if (photoData.url.startsWith('http')) return photoData.url;
    return `${STRAPI_URL}${photoData.url}`;
};

const formatCurrency = (amount, currencyCode) => {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
  } catch { return `${currencyCode} ${amount}`; }
};

const getSynopsisText = (synopsis) => {
  if (!synopsis) return '';
  if (typeof synopsis === 'string') return synopsis;
  if (Array.isArray(synopsis)) {
    return synopsis.map(block => block.children ? block.children.map(c => c.text).join(' ') : '').join(' ');
  }
  return '';
};

const generateTicketCode = () => {
    const prefix = "TKT";
    const randomNum = Math.floor(1000 + Math.random() * 9000); 
    return `${prefix}-${randomNum}`;
};

const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    const maskedName = name.length > 2 ? `${name.substring(0, 2)}***` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
};

const maskPhone = (phone) => {
    if (!phone) return '';
    return `*******${phone.slice(-4)}`;
};

// Helper to format 24h time to 12h AM/PM
const formatTimeWithAMPM = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// =========================================
// SUB-COMPONENTS
// =========================================
const BookCard = ({ book, userCurrency, onPreorder, onPurchase }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const synopsis = getSynopsisText(book.Synopsis);
  const isPreorder = book.LaunchDate && new Date(book.LaunchDate) > new Date();
  
  let displayPrice = "View Details";
  const prices = book.localPrices || book.LocalPrices || [];
  if (prices.length > 0) {
    const localMatch = prices.find(p => p.Currency === userCurrency) || prices.find(p => p.Currency === 'USD');
    if (localMatch) displayPrice = formatCurrency(localMatch.Amount, localMatch.Currency);
  }
  const isLongText = synopsis && synopsis.length > 120;
  const hasLinks = (book.purchaseLinks || book.PurchaseLinks || []).length > 0;

  return (
    <div className="group bg-white rounded-sm shadow-lg hover:-translate-y-2 transition-all duration-500 border-t-4 border-transparent hover:border-ministry-gold flex flex-col h-full overflow-hidden relative">
      <div className="h-64 sm:h-80 w-full overflow-hidden bg-gray-100 relative flex-shrink-0">
        {book.CoverArt && <img src={getImageUrl(book.CoverArt)} alt={book.Title} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" />}
        {isPreorder && <div className="absolute top-4 right-4 bg-ministry-gold text-white text-[10px] font-bold px-3 py-1 uppercase tracking-widest shadow-md">Coming Soon</div>}
      </div>
      <div className="p-6 flex flex-col flex-grow relative">
        <h3 className="text-xl font-bold text-gray-900 mb-3 font-serif leading-tight">{book.Title}</h3>
        <div className="relative mb-4 flex-grow">
            <p className={`text-gray-600 text-sm transition-all duration-300 ${!isExpanded ? 'line-clamp-3 md:line-clamp-6' : ''}`}>{synopsis}</p>
            {isLongText && <button onClick={() => setIsExpanded(!isExpanded)} className="mt-2 text-xs font-bold text-ministry-blue uppercase"> {isExpanded ? 'Show Less ↑' : 'Read More ↓'} </button>}
        </div>
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-ministry-gold font-bold text-lg">{displayPrice}</span>
            <div className={`inline-flex items-center justify-center rounded-sm transition shadow-sm ${isPreorder ? 'bg-gray-900 hover:bg-ministry-gold' : 'bg-ministry-blue hover:bg-ministry-gold'}`}>
              <button onClick={isPreorder ? onPreorder : onPurchase} disabled={!isPreorder && !hasLinks} className={`px-4 py-2 text-white text-xs font-bold uppercase tracking-widest ${(!isPreorder && !hasLinks) ? 'bg-gray-300 cursor-not-allowed' : ''}`}>
                  {isPreorder ? 'Preorder' : (hasLinks ? 'Get Copy' : 'Unavailable')}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const DynamicLinkButton = ({ link, icon }) => {
    const styles = {
        amazon: "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100",
        selar: "bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100",
        paystack: "bg-green-50 border-green-200 text-green-800 hover:bg-green-100",
        audible: "bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100",
        default: "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
    };

    const platformKey = link.Platform.toLowerCase();
    let activeStyle = styles.default;
    if (platformKey.includes('amazon')) activeStyle = styles.amazon;
    if (platformKey.includes('selar')) activeStyle = styles.selar;
    if (platformKey.includes('paystack')) activeStyle = styles.paystack;
    if (platformKey.includes('audible')) activeStyle = styles.audible;

    return (
        <a href={link.Link} target="_blank" rel="noreferrer" className={`group flex items-center justify-between p-3 border rounded-sm transition-all ${activeStyle}`}>
            <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="font-bold text-sm">{link.Platform}</span>
            </div>
            <div className="flex items-center gap-2">
                {link.PriceLabel && <span className="text-xs font-bold opacity-70">{link.PriceLabel}</span>}
                <span className="text-lg opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">→</span>
            </div>
        </a>
    );
};

const EventTicket = ({ event, isPast, onOpenEvent, onOpenGuestList, onOpenTeam, attendeeCount }) => {
  const eventDate = new Date(event.RawSortingDate || new Date());
  const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = eventDate.toLocaleDateString('en-US', { day: '2-digit' });
  const year = eventDate.getFullYear();
  const diffTime = eventDate - new Date();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

  return (
    <div className={`flex flex-col md:flex-row rounded-sm overflow-hidden shadow-lg transition-all duration-300 ${isPast ? 'bg-gray-100 opacity-80' : 'bg-ministry-blue text-white border-l-4 border-ministry-gold'}`}>
      {/* 1. DATE BOX */}
      <div className={`p-6 md:w-32 flex flex-col items-center justify-center border-r-2 border-dashed ${isPast ? 'bg-gray-200 border-gray-300 text-gray-500' : 'bg-ministry-gold text-ministry-blue border-ministry-blue/20'}`}>
         <span className="text-sm font-bold tracking-widest">{month}</span>
         <span className="text-5xl font-serif font-bold leading-none">{day}</span>
         <span className="text-xs font-bold mt-2 uppercase">{isPast ? year : (diffDays <= 0 ? 'TODAY' : `${diffDays} Days`)}</span>
      </div>

      {/* 2. POSTER */}
      {event.Poster && <div className="hidden md:block w-48 bg-black relative"><img src={getImageUrl(event.Poster)} alt="Event" className="w-full h-full object-cover opacity-90" /></div>}

      {/* 3. DETAILS */}
      <div className="p-6 md:p-8 flex-1 flex flex-col justify-center">
         
         {/* HEADER: Spaced Out Category and Time */}
         <div className="flex flex-wrap items-center gap-4 mb-3">
            <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-sm border ${isPast ? 'bg-gray-200 text-gray-500 border-gray-300' : 'bg-white/10 text-ministry-gold border-ministry-gold/30'}`}>
               {event.Category}
            </span>
            <span className="text-white/20 hidden sm:inline">|</span>
            <span className="text-sm opacity-70 flex items-center gap-2 font-bold tracking-wide">
               🕒 {event.EventDateTime}
            </span>
         </div>
         
         <h3 className={`text-2xl font-serif font-bold mb-3 ${isPast ? 'text-gray-700' : 'text-white'}`}>{event.Title}</h3>
         <p className="opacity-70 text-sm mb-6 line-clamp-2 leading-relaxed">{event.Description}</p>

         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-4 mt-auto border-t border-white/10">
            <div className="text-sm opacity-70 flex items-center gap-2">📍 {event.Venue}</div>
            
            <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
              {isPast ? (
                 <button disabled className="text-gray-400 text-xs font-bold uppercase tracking-widest">Event Ended</button>
              ) : (
                <>
                  <button 
                    onClick={() => onOpenEvent(event)} 
                    className="bg-ministry-gold text-ministry-blue px-8 py-3 font-bold uppercase text-xs tracking-widest hover:bg-white transition shadow-lg rounded-sm w-full sm:w-auto text-center"
                  >
                    {event.isBook ? 'RSVP for Launch' : 'Register / RSVP'}
                  </button>
                  
                  <div className="flex gap-5">
                     {onOpenGuestList && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); onOpenGuestList(event.Title); }} 
                           className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white underline decoration-ministry-gold underline-offset-4"
                        >
                           Attendees ({attendeeCount || 0})
                        </button>
                     )}
                     {event.Team && event.Team.length > 0 && (
                        <button 
                           onClick={(e) => { e.stopPropagation(); onOpenTeam(event); }} 
                           className="text-[10px] font-bold uppercase tracking-widest text-ministry-gold hover:text-white"
                        >
                           View Team ({event.Team.length})
                        </button>
                     )}
                  </div>
                </>
              )}
            </div>
         </div>
      </div>
    </div>
  );
};

// =========================================
// MAIN APP COMPONENT
// =========================================
function App() {
  // --- STATE ---
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState([]);
  const [movies, setMovies] = useState([]);
  const [songs, setSongs] = useState([]);
  const [events, setEvents] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  
  // Modals & UI
  const [showModal, setShowModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userCurrency] = useState('USD');
  const [formData, setFormData] = useState({ name: '', churchName: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState('');
  const bookScrollRef = useRef(null);
  const scrollInterval = useRef(null);
  
  // Registration States
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationData, setRegistrationData] = useState({ name: '', email: '', phone: '', attendanceType: 'Physical' });
  const [successData, setSuccessData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketSnapshot, setTicketSnapshot] = useState({ date: '', venue: '' });
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [guestListModalOpen, setGuestListModalOpen] = useState(false);
  const [viewingGuestsFor, setViewingGuestsFor] = useState(null);
  
  const [preorderModalOpen, setPreorderModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  // Admin & Gatekeeper State
  const [adminUser, setAdminUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  
  // GATEKEEPER SPECIFIC STATE
  const [cameraActive, setCameraActive] = useState(false);
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInStatus, setCheckInStatus] = useState(null); // 'success', 'error', 'warning', 'loading'
  const [checkInMessage, setCheckInMessage] = useState('');
  const [scannedGuest, setScannedGuest] = useState(null);
  
  const [adminFormData, setAdminFormData] = useState({
      activeTab: 'gatekeeper', 
      targetId: '', targetType: 'event', ministerName: '', ministerRole: '', ministerBio: '', ministerPhoto: null
  });

  // =========================================
  // LOGIC: TICKET VERIFICATION (UNIFIED)
  // =========================================
  const verifyTicket = async (codeToCheck) => {
      if (!codeToCheck) return;
      if (!adminUser || !adminUser.token) {
          setCheckInStatus('error');
          setCheckInMessage('Session Expired. Please Re-login.');
          return;
      }

      setCheckInStatus('loading');
      setCheckInMessage('Verifying ticket...');
      setScannedGuest(null);
      
      // Close camera immediately
      setCameraActive(false);

      const cleanCode = codeToCheck.trim();

      try {
          // 1. SEARCH
          const searchUrl = `${STRAPI_URL}/api/registrations?filters[ticketCode][$eq]=${cleanCode}&publicationState=preview`;
          const res = await axios.get(searchUrl, { headers: { Authorization: `Bearer ${adminUser.token}` } });
          
          if (res.data.data.length === 0) {
              setCheckInStatus('error');
              setCheckInMessage('❌ TICKET NOT FOUND');
              return;
          }

          const guestRecord = res.data.data[0];
          const guestData = guestRecord.attributes || guestRecord;
          const updateId = guestRecord.documentId || guestRecord.id; 
          const legacyId = guestRecord.id;

          // 2. CHECK STATUS
          if (guestData.isCheckedIn) {
              setCheckInStatus('warning');
              setCheckInMessage(`⚠️ ALREADY SCANNED!`);
              setScannedGuest(guestData);
              return;
          }

          // 3. UPDATE DATABASE
          await axios.put(`${STRAPI_URL}/api/registrations/${updateId}`, {
              data: { isCheckedIn: true }
          }, {
              headers: { Authorization: `Bearer ${adminUser.token}` }
          });

          // 4. UPDATE LOCAL LIST INSTANTLY
          setAllRegistrations(prev => prev.map(reg => reg.id === legacyId ? { ...reg, isCheckedIn: true } : reg));

          // 5. SUCCESS
          setCheckInStatus('success');
          setCheckInMessage('✅ ACCESS GRANTED');
          setScannedGuest(guestData);
          setCheckInCode(''); 

      } catch (error) {
          console.error("Gatekeeper Error:", error);
          setCheckInStatus('error');
          setCheckInMessage('System Error: Check Network');
      }
  };

  // --- TRIGGERS ---
  const handleScan = (scannedRawValue) => {
      if(scannedRawValue) {
          setCheckInCode(scannedRawValue); 
          verifyTicket(scannedRawValue);
      }
  };

  const handleManualSubmit = (e) => {
      e.preventDefault();
      verifyTicket(checkInCode);
  };

  // =========================================
  // LOGIC: ADMIN & TEAM
  // =========================================

  const handleAdminLogin = async (e) => {
      e.preventDefault();
      const form = e.target;
      const email = form.email.value;
      const password = form.password.value;
      try {
          const res = await axios.post(`${STRAPI_URL}/api/auth/local`, { identifier: email, password });
          setAdminUser({ token: res.data.jwt, username: res.data.user.username });
          setShowLoginModal(false);
          setShowAdminDashboard(true);
      } catch { alert("Login Failed: Invalid credentials"); }
  };

  const handleAddMinister = async (e) => {
      e.preventDefault();
      if (!adminUser) return alert("You must be logged in.");
      try {
          let photoId = null;
          if (adminFormData.ministerPhoto) {
              const uploadData = new FormData();
              uploadData.append('files', adminFormData.ministerPhoto);
              const uploadRes = await axios.post(`${STRAPI_URL}/api/upload`, uploadData, { headers: { Authorization: `Bearer ${adminUser.token}` } });
              photoId = uploadRes.data[0].id;
          }
          const collection = adminFormData.targetType === 'book' ? 'books' : 'events';
          const fieldName = adminFormData.targetType === 'book' ? 'TheTeam' : 'Team'; 
          const getRes = await axios.get(`${STRAPI_URL}/api/${collection}/${adminFormData.targetId}?populate[${fieldName}][populate]=*`);
          const currentData = getRes.data.data.attributes || getRes.data.data;
          const currentTeam = currentData[fieldName] || [];
          const cleanTeam = currentTeam.map(member => ({ Name: member.Name, Role: member.Role, Bio: member.Bio, Photo: member.Photo ? member.Photo.id : null }));
          const newMember = { Name: adminFormData.ministerName, Role: adminFormData.ministerRole, Bio: adminFormData.ministerBio, Photo: photoId };
          await axios.put(`${STRAPI_URL}/api/${collection}/${adminFormData.targetId}`, { data: { [fieldName]: [...cleanTeam, newMember] } }, { headers: { Authorization: `Bearer ${adminUser.token}` } });
          alert("Minister Added Successfully!");
          setAdminFormData({ ...adminFormData, ministerName: '', ministerRole: '', ministerBio: '', ministerPhoto: null });
          window.location.reload(); 
      } catch (error) {
          console.error(error);
          alert("Failed to add minister.");
      }
  };

  // =========================================
  // LOGIC: PUBLIC EVENTS & ACTIONS
  // =========================================
  const handleEventClick = (eventItem) => {
    setTicketSnapshot({ date: eventItem.EventDateTime, venue: eventItem.Venue });
    setSelectedEvent(eventItem);
    setIsRegistering(eventItem.isBook); 
    setEventModalOpen(true);
  };

  const handleRegistrationInput = (e) => {
      const { name, value } = e.target;
      setRegistrationData(prev => ({ ...prev, [name]: value }));
  };

  const handleEventRegistrationSubmit = async (e) => {
    e.preventDefault();
    if(!selectedEvent) return;
    setIsSubmitting(true);
    const ticketCode = generateTicketCode();
    const payload = {
        fullName: registrationData.name, emailAddress: registrationData.email, phoneNumber: registrationData.phone,
        attendanceType: registrationData.attendanceType, eventTitle: selectedEvent.Title, ticketCode: ticketCode,
    };
    if (!selectedEvent.isBook) payload.event = selectedEvent.documentId || selectedEvent.id;

    try {
      await axios.post(`${STRAPI_URL}/api/registrations`, { data: payload });
      setIsSubmitting(false);
      setSuccessData({
        name: registrationData.name, ticket: ticketCode, whatsAppLink: selectedEvent.WhatsAppLink || (selectedEvent.attributes && selectedEvent.attributes.WhatsAppLink),
        date: ticketSnapshot.date || "TBA", venue: ticketSnapshot.venue || "TBA"
      });
      setAllRegistrations(prev => [...prev, { ...payload, id: Date.now() }]);
      setRegistrationData({ name: '', email: '', phone: '', attendanceType: 'Physical' });
    } catch (error) {
      setIsSubmitting(false); alert("Registration failed.");
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    setFormStatus('sending');
    try {
      await axios.post(`${STRAPI_URL}/api/bookings`, { data: { Name: formData.name, ChurchName: formData.churchName, Email: formData.email, Message: formData.message } });
      setFormStatus('success');
      setTimeout(() => { setShowModal(false); setFormStatus(''); setFormData({ name: '', churchName: '', email: '', message: '' }); }, 2000);
    } catch { setFormStatus('error'); }
  };

  const handlePurchaseClick = (book) => {
    const normalizedBook = { ...book, PurchaseLinks: book.purchaseLinks || book.PurchaseLinks || [] };
    setSelectedBook(normalizedBook);
    setPurchaseModalOpen(true);
  };

  const handlePreorderClick = (book) => {
    setSelectedBook(book);
    setPreorderModalOpen(true);
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // --- SCROLLING ---
  const startScrolling = (direction) => {
    if (scrollInterval.current) clearInterval(scrollInterval.current);
    scrollInterval.current = setInterval(() => {
      if (bookScrollRef.current) {
        bookScrollRef.current.scrollLeft += (direction === 'left' ? -10 : 10);
      }
    }, 10);
  };
  const stopScrolling = () => {
    if (scrollInterval.current) { clearInterval(scrollInterval.current); scrollInterval.current = null; }
  };

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [songsRes, booksRes, moviesRes, regRes, eventRes] = await Promise.all([
             axios.get(`${STRAPI_URL}/api/songs?populate=*`),
             axios.get(`${STRAPI_URL}/api/books?populate[0]=CoverArt&populate[1]=TheTeam.Photo&populate[2]=LocalPrices`),
             axios.get(`${STRAPI_URL}/api/movies?populate=*`),
             axios.get(`${STRAPI_URL}/api/registrations?pagination[pageSize]=100`),
             axios.get(`${STRAPI_URL}/api/events?populate[0]=Poster&populate[1]=Team.Photo`).catch(() => ({ data: { data: [] } }))
        ]);
        setSongs(songsRes.data.data); setBooks(booksRes.data.data); setMovies(moviesRes.data.data); setEvents(eventRes.data.data);
        const flattened = regRes.data.data.map(item => ({ id: item.id, ...(item.attributes || item) }));
        setAllRegistrations(flattened);
      } catch (error) { console.error("Fetch Error:", error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // --- DATA PROCESSING (RESTORED TIME & WAT) ---
  const getEventsData = () => {
     const today = new Date(); today.setHours(0,0,0,0);
     let allEvents = [];
     
     const getBookLink = (b) => {
        const links = b.purchaseLinks || b.PurchaseLinks || [];
        const found = links.find(l => l.Type === 'Physical' || l.Platform.toLowerCase().includes('paystack'));
        return found ? found.Link : '#';
     };

     // 1. MANUAL EVENTS
     events.forEach(evt => {
        const e = evt.attributes || evt;
        const rawDate = e.Date || e.date;
        const rawTime = e.Time || e.time;
        
        let formattedDate = 'Date TBA';
        let formattedTime = '';

        if (rawDate) {
             try {
                 const d = new Date(rawDate);
                 if (!isNaN(d.getTime())) formattedDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
             } catch (err) {}
        }
        if (rawTime) formattedTime = formatTimeWithAMPM(rawTime);

        const finalDateTime = (rawDate) ? `${formattedDate}, ${formattedTime ? formattedTime + ' WAT' : 'Time TBA'}` : 'Date & Time TBA';

        allEvents.push({ 
            id: evt.id, documentId: e.documentId, Title: e.Title, Venue: e.Venue || 'Venue TBA', Category: e.Category, 
            RawSortingDate: rawDate, Poster: e.Poster, Description: e.Description, Team: e.Team, WhatsAppLink: e.WhatsAppLink,
            EventDateTime: finalDateTime 
        });
     });

     // 2. BOOKS
     books.forEach(book => {
        const b = book.attributes || book;
        const d = b.LaunchDate;
        const t = b.LaunchTime;
        
        const prices = b.LocalPrices || [];
        const localPriceObj = prices.find(p => p.Currency === 'NGN') || prices[0];
        let formattedPrice = "Free / Donation";
        if (localPriceObj && localPriceObj.Amount) formattedPrice = `${localPriceObj.Currency} ${localPriceObj.Amount}`;

        let formattedDate = 'Date TBA';
        if(d) formattedDate = new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        
        let formattedTime = '';
        if (t) formattedTime = formatTimeWithAMPM(t);

        const finalDateTime = (d) ? `${formattedDate}, ${formattedTime ? formattedTime + ' WAT' : 'Time TBA'}` : formattedDate;

        if(d) allEvents.push({
            id: `book-${book.id}`, Title: b.Title, Category: 'Book Launch',
            RawSortingDate: d, Venue: b.PhysicalVenue || 'TBA', isBook: true,
            EventDateTime: finalDateTime,
            Description: `Join us for the official launch.`,
            Poster: b.CoverArt, PriceTag: formattedPrice, WhatsAppLink: b.WhatsAppLink, Link: getBookLink(b), Team: b.TheTeam || []
        });
     });

     songs.forEach(song => {
        const s = song.attributes || song;
        if (s.ReleaseDate) allEvents.push({ id: `song-${song.id}`, Category: 'Single Release', Title: s.Title, EventDateTime: new Date(s.ReleaseDate).toLocaleDateString(), Venue: 'Streaming Globally', RawSortingDate: s.ReleaseDate, Description: `New worship sound "${s.Title}" drops.`, Poster: s.CoverArt, Link: s.SpotifyLink || '#' });
     });
     movies.forEach(movie => {
        const m = movie.attributes || movie;
        if (m.PremiereDate) allEvents.push({ id: `movie-${movie.id}`, Category: 'Movie Premiere', Title: m.Title, EventDateTime: new Date(m.PremiereDate).toLocaleDateString(), Venue: m.CinemaLocation || 'Cinemas', RawSortingDate: m.PremiereDate, Description: `Premiere of "${m.Title}".`, Poster: m.Poster, Link: m.TrailerLink || '#' });
     });

     const upcoming = allEvents.filter(e => e.RawSortingDate && new Date(e.RawSortingDate) >= today).sort((a,b) => new Date(a.RawSortingDate) - new Date(b.RawSortingDate));
     const past = allEvents.filter(e => !e.RawSortingDate || new Date(e.RawSortingDate) < today).sort((a,b) => new Date(b.RawSortingDate) - new Date(a.RawSortingDate));
     return { upcoming, past };
  };

  const { upcoming: upcomingEvents, past: pastEvents } = getEventsData();

  if (loading) return <div className="h-screen flex justify-center items-center bg-ministry-blue text-ministry-gold font-bold">LOADING...</div>;

  // =========================================
  // VIEW: ADMIN DASHBOARD (GATEKEEPER)
  // =========================================
  if (showAdminDashboard && adminUser) {
      return (
          <div className="min-h-screen bg-gray-100 font-sans">
              <div className="bg-ministry-blue text-white p-4 flex justify-between items-center shadow-lg">
                  <h2 className="font-bold text-xl">Admin Dashboard</h2>
                  <div className="flex gap-4">
                      <button onClick={() => setAdminFormData({...adminFormData, activeTab: 'gatekeeper'})} className={`px-4 py-2 rounded text-xs font-bold uppercase ${adminFormData.activeTab === 'gatekeeper' ? 'bg-ministry-gold text-ministry-blue' : 'bg-white/10'}`}>Gatekeeper</button>
                      <button onClick={() => setAdminFormData({...adminFormData, activeTab: 'team'})} className={`px-4 py-2 rounded text-xs font-bold uppercase ${adminFormData.activeTab === 'team' ? 'bg-ministry-gold text-ministry-blue' : 'bg-white/10'}`}>Team</button>
                      <button onClick={() => { setAdminUser(null); setShowAdminDashboard(false); }} className="bg-red-600 px-4 py-2 rounded text-xs font-bold uppercase">Logout</button>
                  </div>
              </div>

              <div className="max-w-4xl mx-auto p-6">
                  {/* TAB: GATEKEEPER */}
                  {adminFormData.activeTab === 'gatekeeper' && (
                      <div className="bg-white p-6 rounded shadow-lg max-w-lg mx-auto text-center">
                          <h3 className="text-2xl font-bold mb-6 text-gray-700">Ticket Scanner</h3>
                          
                          {/* Status Display */}
                          <div className={`w-full p-8 rounded-lg mb-8 border-2 transition-all duration-300 ${checkInStatus === 'success' ? 'bg-green-50 border-green-500' : checkInStatus === 'error' ? 'bg-red-50 border-red-500' : checkInStatus === 'warning' ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200'}`}>
                                <h2 className={`text-2xl font-black uppercase tracking-widest ${checkInStatus === 'success' ? 'text-green-600' : checkInStatus === 'error' ? 'text-red-600' : checkInStatus === 'warning' ? 'text-orange-600' : 'text-gray-400'}`}>{checkInMessage || 'Ready to Scan'}</h2>
                                {scannedGuest && (
                                    <div className="mt-4 pt-4 border-t border-gray-200/50">
                                        <p className="text-xl font-bold text-gray-800">{scannedGuest.fullName}</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-widest">{scannedGuest.attendanceType} Attendee</p>
                                    </div>
                                )}
                          </div>

                          {/* Scanner UI */}
                          {cameraActive && (
                            <div className="mb-6 bg-black rounded-lg overflow-hidden relative h-64 border-2 border-ministry-gold">
                                <Scanner
                                    onScan={(result) => { if (result && result.length > 0) handleScan(result[0].rawValue); }}
                                    components={{ audio: false, onOff: false }}
                                    styles={{ container: { height: '100%' }, video: { objectFit: 'cover' } }}
                                />
                                <button onClick={() => setCameraActive(false)} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg z-20">Stop Camera</button>
                            </div>
                          )}

                          {/* Manual Input */}
                          <form onSubmit={handleManualSubmit} className="relative">
                              <input autoFocus type="text" placeholder="Scan QR or Enter Ticket ID..." className="w-full p-4 pl-12 text-lg border-2 border-ministry-blue rounded-sm focus:outline-none focus:border-ministry-gold shadow-lg" value={checkInCode} onChange={(e) => setCheckInCode(e.target.value)} />
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔎</span>
                              <button type="button" onClick={() => setCameraActive(true)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 p-2 rounded-sm text-xl hover:bg-ministry-gold hover:text-white transition" title="Open Camera">📷</button>
                          </form>
                      </div>
                  )}

                  {/* TAB: TEAM MANAGER */}
                  {adminFormData.activeTab === 'team' && (
                      <div className="bg-white p-6 rounded shadow-lg">
                          <h3 className="text-xl font-bold mb-4">Add Team Member</h3>
                          <form onSubmit={handleAddMinister} className="space-y-4">
                              <div className="flex gap-4">
                                  <label className="flex items-center gap-2"><input type="radio" name="type" value="event" checked={adminFormData.targetType === 'event'} onChange={() => setAdminFormData({...adminFormData, targetType: 'event'})} /> Event</label>
                                  <label className="flex items-center gap-2"><input type="radio" name="type" value="book" checked={adminFormData.targetType === 'book'} onChange={() => setAdminFormData({...adminFormData, targetType: 'book'})} /> Book</label>
                              </div>
                              <select className="w-full p-2 border" onChange={(e) => setAdminFormData({...adminFormData, targetId: e.target.value})} required>
                                  <option value="">-- Select Item --</option>
                                  {adminFormData.targetType === 'event' ? events.map(e => <option key={e.id} value={e.documentId || e.id}>{e.Title}</option>) : books.map(b => <option key={b.id} value={b.documentId || b.id}>{b.Title}</option>)}
                              </select>
                              <input type="text" placeholder="Name" className="w-full p-2 border" required value={adminFormData.ministerName} onChange={e => setAdminFormData({...adminFormData, ministerName: e.target.value})} />
                              <input type="text" placeholder="Role" className="w-full p-2 border" required value={adminFormData.ministerRole} onChange={e => setAdminFormData({...adminFormData, ministerRole: e.target.value})} />
                              <textarea placeholder="Bio" className="w-full p-2 border" rows="2" value={adminFormData.ministerBio} onChange={e => setAdminFormData({...adminFormData, ministerBio: e.target.value})}></textarea>
                              <input type="file" className="w-full" onChange={e => setAdminFormData({...adminFormData, ministerPhoto: e.target.files[0]})} />
                              <button className="w-full bg-green-600 text-white py-3 font-bold uppercase">Add Member</button>
                          </form>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  // =========================================
  // VIEW: PUBLIC WEBSITE
  // =========================================
  return (
    <div className="w-full overflow-x-hidden font-sans text-gray-800">
      {/* NAVBAR */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => scrollToSection('home')}>
              <span className="font-serif text-2xl font-bold text-ministry-blue tracking-wider">
                JUDE <span className="text-ministry-gold">JESURURU</span>
              </span>
            </div>
            <div className="hidden md:flex space-x-8 items-center">
              {['Home', 'About', 'Books', 'Films', 'Worship'].map((item) => (
                <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="text-sm font-bold uppercase text-ministry-blue hover:text-ministry-gold transition">{item}</button>
              ))}
              <button onClick={() => setShowModal(true)} className="bg-ministry-gold text-white px-6 py-2 rounded-sm font-bold uppercase text-xs tracking-widest hover:bg-ministry-blue transition">Invite</button>
            </div>
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-ministry-blue hover:text-ministry-gold focus:outline-none">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />)}
                </svg>
              </button>
            </div>
          </div>
        </div>
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
      <header id="home" className="relative pt-24 pb-12 min-h-screen flex items-center bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="text-center lg:text-left order-2 lg:order-1 relative z-10">
            <div className="inline-block border-b-2 border-ministry-gold pb-2 mb-4">
                <span className="text-ministry-gold font-bold tracking-[0.2em] uppercase text-xs">Official Ministry Portfolio</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-ministry-blue leading-tight mb-6">Jude <br/><span className="text-gold-metallic">Jesururu</span></h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">Proclaiming the Kingdom through worship, writing, and filmmaking. Bridging the gap between faith and excellence.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button onClick={() => setShowModal(true)} className="bg-ministry-blue text-white px-8 py-4 font-bold tracking-widest uppercase hover:bg-ministry-gold transition shadow-lg rounded-sm">Invite For Ministry</button>
              <button onClick={() => scrollToSection('books')} className="border-2 border-ministry-blue text-ministry-blue px-8 py-4 font-bold tracking-widest uppercase hover:bg-ministry-blue hover:text-white transition rounded-sm">Resources</button>
            </div>
          </div>
          <div className="relative order-1 lg:order-2 flex justify-center items-center mt-6 lg:mt-0">
            <div className="relative h-[420px] w-[300px] sm:h-[550px] sm:w-[380px] lg:h-[600px] lg:w-[420px] animate-float mx-auto">
              <div className="absolute -inset-4 bg-ministry-gold/30 blur-3xl rounded-[30px] -z-10"></div>
              <div className="h-full w-full bg-gradient-to-tr from-[#BF953F] via-[#FCF6BA] to-[#B38728] p-[3px] rounded-[24px] shadow-[0_25px_60px_-15px_rgba(0,35,102,0.4)] relative z-10">
                  <div className="h-full w-full bg-ministry-blue rounded-[21px] overflow-hidden relative">
                      <img src="/me.jpg" alt="Jude Jesururu" className="w-full h-full object-cover" onError={(e) => {e.target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&w=800&q=80'}} />
                  </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* EVENTS SECTION */}
      {(upcomingEvents.length > 0 || pastEvents.length > 0) && (
        <section id="events" className="py-20 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {upcomingEvents.length > 0 && (
              <div className="mb-16">
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <span className="text-ministry-gold font-bold uppercase tracking-widest text-xs">Mark Your Calendar</span>
                    <h2 className="text-4xl font-serif font-bold text-ministry-blue">Upcoming Events</h2>
                  </div>
                </div>
                <div className="space-y-6">
                  {upcomingEvents.map((event) => {
                    const thisEventCount = allRegistrations.filter(r => r.eventTitle === event.Title).length;
                    return (
                      <EventTicket 
                        key={event.id} event={event} isPast={false} attendeeCount={thisEventCount}
                        onOpenEvent={handleEventClick} 
                        onOpenGuestList={(title) => { setViewingGuestsFor(title); setGuestListModalOpen(true); }}
                        onOpenTeam={(evt) => { setSelectedEvent(evt); setTeamModalOpen(true); }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
            {pastEvents.length > 0 && (
                <div>
                    <div className="mb-8 border-b border-gray-200 pb-2"><h2 className="text-xl font-serif font-bold text-gray-400">Past Ministry Events</h2></div>
                    <div className="space-y-6 opacity-75 hover:opacity-100 transition-opacity">{pastEvents.map((event) => <EventTicket key={event.id} event={event} isPast={true} />)}</div>
                </div>
            )}
          </div>
        </section>
      )}

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-serif font-bold text-ministry-blue mb-8">About The Ministry</h2>
          <div className="w-16 h-1 bg-ministry-gold mx-auto mb-10"></div>
          <div className="text-lg text-gray-600 leading-relaxed space-y-6">
            <p>Jude Jesururu is a multi-dimensional minister of the Gospel, dedicated to expressing the truth of God's Kingdom through various creative mediums.</p>
            <p>With a mandate to <strong>"Bridge the gap between Faith and Excellence,"</strong> Jude combines theological depth with professional artistry in music, literature, and cinema.</p>
          </div>
        </div>
      </section>

      {/* BOOKS SECTION */}
      <section id="books" className="py-24 bg-ministry-light overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold text-ministry-blue mb-4">Books & Resources</h2>
            <div className="w-20 h-1 bg-ministry-gold mx-auto"></div>
          </div>
          <button onMouseEnter={() => startScrolling('left')} onMouseLeave={stopScrolling} onClick={() => { if(bookScrollRef.current) bookScrollRef.current.scrollLeft -= 300; }} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-50 w-12 h-12 items-center justify-center bg-white shadow-2xl rounded-full text-ministry-blue border-2 border-ministry-gold cursor-pointer hover:scale-110 active:scale-95 transition-all">←</button>
          <button onMouseEnter={() => startScrolling('right')} onMouseLeave={stopScrolling} onClick={() => { if(bookScrollRef.current) bookScrollRef.current.scrollLeft += 300; }} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-50 w-12 h-12 items-center justify-center bg-white shadow-2xl rounded-full text-ministry-blue border-2 border-ministry-gold cursor-pointer hover:scale-110 active:scale-95 transition-all">→</button>
          <div ref={bookScrollRef} className="flex flex-col md:flex-row gap-8 overflow-x-auto pb-10 px-4 scrollbar-hide" style={{ scrollBehavior: 'auto' }}>
            {books.map((book) => (
              <div key={book.id} className="w-full md:w-[350px] flex-shrink-0">
                <BookCard key={book.id} book={book} userCurrency={userCurrency} onPreorder={() => handlePreorderClick(book)} onPurchase={() => handlePurchaseClick(book)} />
              </div>
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
                    {movie.Poster && <img src={getImageUrl(movie.Poster)} alt={movie.Title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-8 md:w-1/2 flex flex-col justify-center">
                    <span className="text-xs font-bold text-ministry-gold uppercase tracking-widest mb-2">{movie.Category}</span>
                    <h3 className="text-2xl font-serif font-bold text-ministry-blue mb-6">{movie.Title}</h3>
                    <a href={movie.VideoLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-sm font-bold uppercase tracking-wider hover:border-ministry-blue hover:text-ministry-blue transition text-gray-600">Watch Trailer</a>
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
              <div key={song.id} onClick={() => setCurrentSong(song)} className="group flex items-center p-6 bg-white/5 border border-white/10 hover:bg-ministry-gold hover:border-ministry-gold hover:text-ministry-blue cursor-pointer transition duration-300 rounded-sm">
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
          <div className="mt-8"><button onClick={() => setShowLoginModal(true)} className="text-[10px] text-gray-600 hover:text-white transition">Admin Login</button></div>
        </div>
      </footer>

      {/* AUDIO PLAYER */}
      {currentSong && (
        <div className="fixed bottom-0 left-0 w-full z-50 bg-ministry-blue border-t border-ministry-gold">
          <AudioPlayer autoPlay src={currentSong.AudioFile.url} header={`Now Playing: ${currentSong.Title}`} showSkipControls={false} layout="horizontal-reverse" style={{ background: 'transparent', color: 'white', boxShadow: 'none' }} />
        </div>
      )}

      {/* MODALS */}
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

      {eventModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-sm shadow-2xl relative my-8">
                <button className={`absolute top-4 right-4 text-xl font-bold z-50 transition-colors ${isRegistering ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-red-500'}`} onClick={() => { setEventModalOpen(false); setSuccessData(null); setIsRegistering(false); }}>✕</button>
                
                {successData ? (
                  <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">            
                    <div className="w-full max-w-md relative">
                        <button onClick={() => { setSuccessData(null); setEventModalOpen(false); }} className="absolute -top-12 right-0 text-white/50 hover:text-white font-bold z-10 no-print flex items-center gap-2"><span className="text-xs uppercase tracking-widest">Close</span> ✕</button>
                        <div id="printable-ticket" className="bg-slate-900 w-full rounded-xl overflow-hidden shadow-2xl relative border border-white/10 text-white">
                            <div className="relative h-56 w-full bg-black">
                                {selectedEvent.Poster ? (<div className="w-full h-full relative"><div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10"></div><img src={getImageUrl(selectedEvent.Poster)} alt="Event" className="w-full h-full object-cover opacity-80" /></div>) : (<div className="w-full h-full bg-ministry-gold/20 flex items-center justify-center"><span className="text-4xl opacity-20">🎟️</span></div>)}
                                <div className="absolute bottom-0 left-0 w-full p-6 z-20"><span className="bg-ministry-gold text-ministry-blue text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-md">Official Access Pass</span><h2 className="text-2xl font-serif font-bold text-white mt-2 leading-tight drop-shadow-md">{selectedEvent.Title}</h2></div>
                            </div>
                            <div className="p-6 bg-slate-900 relative">
                                <div className="flex flex-col gap-4 mb-6 border-l-2 border-ministry-gold pl-4">
                                    <div><p className="text-[10px] text-white/50 uppercase tracking-widest">Date & Time</p><p className="text-sm font-bold text-white">{successData.date}</p></div>
                                    <div><p className="text-[10px] text-white/50 uppercase tracking-widest">Venue</p><p className="text-xs text-white/80 leading-relaxed">{successData.venue}</p></div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center gap-5">
                                    <div className="bg-white p-2 rounded-sm shadow-lg shrink-0"><img src={`https://quickchart.io/qr?text=${encodeURIComponent(successData.ticket)}&dark=000000&light=ffffff&size=200`} alt="Gate QR" className="w-24 h-24 border-2 border-white rounded-sm" /></div>
                                    <div className="flex-1 overflow-hidden"><p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Attendee</p><h3 className="text-lg font-bold text-white mb-2 truncate">{successData.name}</h3><p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Ticket ID</p><h3 className="text-xl font-mono text-ministry-gold tracking-widest">{successData.ticket}</h3></div>
                                </div>
                                <p className="text-[10px] text-center text-white/30 mt-6">Please save this image and present the QR code at the entrance.</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 mt-4 rounded-lg flex flex-col gap-3 no-print shadow-lg">
                            <button onClick={() => window.print()} className="w-full bg-ministry-blue text-white py-3 font-bold uppercase text-xs tracking-widest rounded-sm hover:bg-ministry-gold transition flex justify-center gap-2 items-center"><span>📥</span> Download Ticket</button>
                            {successData.whatsAppLink && <a href={successData.whatsAppLink} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 font-bold uppercase text-xs tracking-widest rounded-sm hover:bg-[#128C7E] transition"><span>💬</span> Join WhatsApp Group</a>}
                        </div>
                    </div>
                  </div>
                ) : isRegistering ? (
                    <div className="relative overflow-hidden min-h-[500px] flex flex-col">
                        <div className="absolute inset-0 z-0">
                            {selectedEvent.Poster ? (<><img src={getImageUrl(selectedEvent.Poster)} alt="Background" className="w-full h-full object-cover blur-md scale-110 opacity-50" /><div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 to-black/95"></div></>) : (<div className="w-full h-full bg-gray-900"></div>)}
                        </div>
                        <div className="relative z-10 p-8 text-white">
                            <h2 className="text-2xl font-serif font-bold text-white mb-1">Secure Your Seat</h2>
                            <p className="text-sm text-white/60 mb-6 uppercase tracking-widest">{selectedEvent.Title}</p>
                            <form onSubmit={handleEventRegistrationSubmit} className="space-y-4">
                                <input type="text" name="name" value={registrationData.name} onChange={handleRegistrationInput} required className="w-full p-3 bg-white/5 border border-white/20 rounded-sm text-white placeholder-white/30" placeholder="Enter your full name" />
                                <input type="email" name="email" value={registrationData.email} onChange={handleRegistrationInput} required className="w-full p-3 bg-white/5 border border-white/20 rounded-sm text-white placeholder-white/30" placeholder="name@example.com" />
                                <select name="attendanceType" value={registrationData.attendanceType || 'Physical'} onChange={handleRegistrationInput} className="w-full p-3 bg-white/5 border border-white/20 rounded-sm text-white"><option value="Physical" className="text-black">Physically</option><option value="Virtual" className="text-black">Virtually</option></select>
                                <input type="tel" name="phone" placeholder="e.g. +234 80 123 4567" required className="w-full p-3 bg-white/5 border border-white/20 rounded-sm text-white placeholder-white/30" value={registrationData.phone} onChange={(e) => setRegistrationData({...registrationData, phone: e.target.value})} />
                                <div className="flex gap-4 mt-8"><button type="submit" disabled={isSubmitting} className={`flex-1 py-4 font-bold uppercase tracking-widest transition shadow-lg rounded-sm ${isSubmitting ? 'bg-gray-600 cursor-wait' : 'bg-ministry-gold text-ministry-blue hover:bg-white'}`}>{isSubmitting ? "Processing..." : "Generate Ticket"}</button><button type="button" onClick={() => { if (selectedEvent.isBook) { setEventModalOpen(false); } else { setIsRegistering(false); } }} className="px-6 py-4 border border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition rounded-sm">Cancel</button></div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div>
                        {selectedEvent.Poster && <div className="h-48 w-full overflow-hidden"><img src={getImageUrl(selectedEvent.Poster)} alt="Cover" className="w-full h-full object-cover" /></div>}
                        <div className="p-8">
                            <span className="text-ministry-gold text-xs font-bold uppercase tracking-widest">{selectedEvent.Category}</span>
                            <h2 className="text-3xl font-serif font-bold text-ministry-blue mt-2 mb-4">{selectedEvent.Title}</h2>
                            <div className="bg-gray-50 p-4 rounded-sm border border-gray-100 mb-6">
                                <div className="flex justify-between items-center mb-3"><h4 className="text-xs font-bold uppercase text-gray-500 tracking-widest">Confirmed Attendees ({allRegistrations.filter(r => r.eventTitle === selectedEvent.Title).length})</h4></div>
                                <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                    {allRegistrations.filter(r => r.eventTitle === selectedEvent.Title).sort((a, b) => a.fullName.localeCompare(b.fullName)).map((reg, index) => (
                                        <div key={index} className="flex justify-between items-center text-xs border-b border-gray-100 pb-1 last:border-0"><span className="font-bold text-gray-700 truncate w-1/3">{reg.fullName}</span></div>
                                    ))}
                                    {allRegistrations.filter(r => r.eventTitle === selectedEvent.Title).length === 0 && <p className="text-xs text-gray-400 italic">Be the first to register!</p>}
                                </div>
                            </div>
                            <p className="text-gray-600 leading-relaxed mb-8">{selectedEvent.Description}</p>
                            <button onClick={() => setIsRegistering(true)} className="w-full bg-ministry-gold text-white py-4 font-bold uppercase tracking-widest hover:bg-ministry-blue transition shadow-lg">Register Now</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {preorderModalOpen && selectedBook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ministry-blue/90 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-5xl rounded-sm shadow-2xl overflow-hidden flex flex-col md:flex-row relative max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible">
                <button onClick={() => setPreorderModalOpen(false)} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-red-500 text-2xl font-bold bg-white/80 rounded-full w-8 h-8 flex items-center justify-center shadow-sm">✕</button>
                <div className="md:w-5/12 bg-gray-100 flex items-center justify-center p-8 relative overflow-hidden min-h-[300px]">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative w-48 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform rotate-[-5deg] hover:rotate-0 transition duration-500 z-10">{selectedBook.CoverArt && <img src={getImageUrl(selectedBook.CoverArt)} alt="Cover" className="w-full rounded-sm" />}</div>
                </div>
                <div className="md:w-7/12 p-8 md:p-10 flex flex-col text-left">
                    <div className="inline-block border-b-2 border-ministry-gold pb-1 mb-4 w-max"><span className="text-ministry-gold font-bold tracking-[0.2em] uppercase text-xs">Official Hybrid Launch</span></div>
                    <h2 className="text-3xl font-serif font-bold text-ministry-blue mb-4 leading-tight">{selectedBook.Title}</h2>
                    <p className="text-gray-600 mb-6 leading-relaxed text-sm">Join us for the official launch. Preordering secures your copy and grants you exclusive access to the Launch Event.</p>
                    <div className="bg-gray-50 border border-gray-100 p-6 rounded-sm mb-6 text-sm">
                        <div className="flex justify-between items-center mb-8 gap-8 border-b border-gray-200 pb-4">
                            <div><span className="block text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Date</span><span className="text-ministry-blue font-bold text-lg">{selectedBook.LaunchDate ? new Date(selectedBook.LaunchDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) : 'Date TBA'}</span></div>
                            <div className="text-right"><span className="block text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Time</span><span className="text-ministry-blue font-bold text-lg">{selectedBook.LaunchTime ? formatTimeWithAMPM(selectedBook.LaunchTime) : 'Time TBA'}</span></div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start"><span className="text-xl mr-3">🏛️</span><div><span className="block text-xs font-bold text-ministry-blue uppercase">Physical Experience</span><span className="text-sm text-gray-600 font-medium">{selectedBook.PhysicalVenue || 'Venue to be announced'}</span></div></div>
                            <div className="flex items-start"><span className="text-xl mr-3">💻</span><div><span className="block text-xs font-bold text-ministry-blue uppercase">Virtual Experience</span><span className="text-sm text-gray-600 font-medium">{selectedBook.VirtualPlatform || 'Details sent via email'}</span></div></div>
                        </div>
                    </div>
                    <div className="mt-auto">
                        <div className="flex justify-between items-end mb-3"><span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Preorder Bundle</span><span className="text-ministry-gold font-bold text-2xl">{selectedBook.LocalPrices?.find(p => p.Currency === userCurrency)?.Amount ? formatCurrency(selectedBook.LocalPrices.find(p => p.Currency === userCurrency).Amount, userCurrency) : selectedBook.Price}</span></div>
                        <a href={selectedBook.BuyLink} target="_blank" rel="noreferrer" className="block w-full text-center bg-ministry-gold text-white py-4 font-bold uppercase tracking-widest hover:bg-ministry-blue hover:scale-[1.02] transition-all shadow-lg rounded-sm">Secure Seat & Copy (Paystack)</a>
                    </div>
                </div>
            </div>
        </div>
      )}

      {purchaseModalOpen && selectedBook && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg p-8 rounded-sm shadow-2xl relative text-center max-h-[90vh] overflow-y-auto">
                <button onClick={() => setPurchaseModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 font-bold text-xl">✕</button>
                <h2 className="text-2xl font-serif font-bold text-ministry-blue mb-2">Select Format</h2>
                <div className="space-y-6 text-left">
                    {selectedBook.PurchaseLinks?.some(L => L.Type === 'Physical') && <div><h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Physical</h4><div className="space-y-2">{selectedBook.PurchaseLinks.filter(L => L.Type === 'Physical').map((link, i) => <DynamicLinkButton key={i} link={link} icon="📖" />)}</div></div>}
                    {selectedBook.PurchaseLinks?.some(L => L.Type === 'Ebook') && <div><h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">Digital</h4><div className="space-y-2">{selectedBook.PurchaseLinks.filter(L => L.Type === 'Ebook').map((link, i) => <DynamicLinkButton key={i} link={link} icon="📱" />)}</div></div>}
                </div>
            </div>
        </div>
      )}

      {guestListModalOpen && viewingGuestsFor && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
                <div className="bg-ministry-blue p-6 text-white relative">
                    <button onClick={() => setGuestListModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white font-bold">✕</button>
                    <span className="text-ministry-gold text-[10px] font-bold uppercase tracking-widest block mb-1">Guest List</span>
                    <h3 className="text-xl font-serif font-bold">{viewingGuestsFor}</h3>
                    <p className="text-xs text-white/60 mt-2">{allRegistrations.filter(r => r.eventTitle === viewingGuestsFor).length} Confirmed Attendees</p>
                </div>
                <div className="p-0 overflow-y-auto custom-scrollbar bg-gray-50 flex-1">
                    {allRegistrations.filter(r => r.eventTitle === viewingGuestsFor).length > 0 ? (
                        <div className="divide-y divide-gray-200">
                        {allRegistrations.filter(r => r.eventTitle === viewingGuestsFor).sort((a, b) => a.fullName.localeCompare(b.fullName)).map((reg, index) => (
                                <div key={index} className={`px-4 py-3 flex items-center border-l-4 transition-all duration-300 ${reg.isCheckedIn ? 'bg-green-50 border-green-500 shadow-inner' : 'hover:bg-gray-50 border-transparent border-b border-gray-100'}`}>
                                    <div className="flex-[0.4] flex items-center gap-3 overflow-hidden">
                                        <div className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold border ${reg.isCheckedIn ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white border-gray-200 text-gray-400'}`}>{reg.fullName.charAt(0)}</div>
                                        <div className="min-w-0 flex flex-col"><h4 className={`text-xs font-bold truncate ${reg.isCheckedIn ? 'text-green-900' : 'text-gray-700'}`}>{reg.fullName.split(' ')[0]}</h4><span className="text-[9px] uppercase tracking-wide text-gray-400">{reg.attendanceType || 'Physical'}</span></div>
                                    </div>
                                    <div className="flex-[0.3] flex justify-center">{reg.isCheckedIn ? (<span className="bg-green-600 text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-widest flex items-center gap-1 animate-pulse-once">✓ Inside</span>) : (<span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest border border-gray-100 px-2 py-1 rounded-full bg-gray-50">Pending</span>)}</div>
                                    <div className="flex-[0.3] text-right"><span className={`block text-xs font-mono ${reg.isCheckedIn ? 'text-green-700 font-bold' : 'text-gray-400'}`}>{maskPhone(reg.phoneNumber)}</span></div>
                                </div>
                            ))
                        }
                      </div>
                    ) : (<div className="p-10 text-center text-gray-400 flex flex-col items-center"><span className="text-4xl mb-2 opacity-30">📂</span><p className="text-sm">No registrations yet.</p></div>)}
                </div>
            </div>
        </div>
      )}

      {teamModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-gray-900 w-full max-w-3xl rounded-sm shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] border border-white/10">                
            <div className="absolute inset-0 z-0 pointer-events-none">{selectedEvent.Poster && (<><img src={getImageUrl(selectedEvent.Poster)} className="w-full h-full object-cover blur-xl opacity-30 scale-110" alt="bg" /><div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/90 to-gray-900"></div></>)}</div>
            <div className="p-6 relative z-10 flex-shrink-0 border-b border-white/10 bg-black/20 backdrop-blur-md">
              <button onClick={() => setTeamModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white font-bold text-xl">✕</button>
              <span className="text-ministry-gold text-[10px] font-bold uppercase tracking-widest block mb-1">Event Team & Speakers</span>
              <h3 className="text-2xl font-serif font-bold text-white">{selectedEvent.Title}</h3>
            </div>
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedEvent.Team.map((member) => (
                    <div key={member.id} className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10 flex items-start gap-4 hover:bg-black/60 hover:border-ministry-gold/30 transition-all duration-300 group">
                        <div className="flex-shrink-0">
                            <div className="w-16 h-20 rounded-lg overflow-hidden border border-ministry-gold/50 shadow-sm group-hover:border-ministry-gold transition-colors bg-white/5">
                                {getImageUrl(member.Photo) ? (<img src={getImageUrl(member.Photo)} alt={member.Name} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-white/50 text-xl">👤</div>)}
                            </div>
                        </div>
                        <div className="flex-1 py-1"><h4 className="font-bold text-white text-base leading-tight">{member.Name}</h4><span className="text-[10px] font-bold uppercase tracking-widest text-ministry-gold block mb-1.5">{member.Role || 'Team Member'}</span>{member.Bio && <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">{member.Bio}</p>}</div>
                    </div>
                  ))}
                </div>
              </div>
            <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md text-center flex-shrink-0 relative z-10">
                <button onClick={() => { setTeamModalOpen(false); setEventModalOpen(true); setIsRegistering(true); }} className="bg-ministry-gold text-white px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-ministry-blue transition shadow-lg rounded-sm">{selectedEvent.id.toString().startsWith('book-') ? "RSVP for Book Launch" : "Register to see them live"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN LOGIN MODAL (RESTORED) */}
      {showLoginModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white p-8 max-w-sm w-full rounded-sm shadow-2xl relative">
                  
                  {/* Close Button */}
                  <button 
                      onClick={() => setShowLoginModal(false)} 
                      className="absolute top-2 right-4 text-gray-400 font-bold hover:text-red-500 text-xl"
                  >
                      ✕
                  </button>
                  
                  <h2 className="text-xl font-bold text-ministry-blue mb-4 border-b border-gray-100 pb-2">Admin Access</h2>
                  
                  {/* Form Update: No arguments needed, just the function name */}
                  <form onSubmit={handleAdminLogin}>
                      <div className="mb-4">
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email / Username</label>
                          <input 
                              name="email" 
                              type="text" 
                              required 
                              className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm" 
                              placeholder="admin@example.com"
                          />
                      </div>
                      <div className="mb-6">
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label>
                          <input 
                              name="password" 
                              type="password" 
                              required 
                              className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm" 
                              placeholder="••••••"
                          />
                      </div>
                      
                      {/* Submit Button */}
                      <button 
                          type="submit" 
                          className="w-full bg-ministry-blue text-white py-3 font-bold uppercase text-xs tracking-widest hover:bg-ministry-gold transition shadow-lg"
                      >
                          Login
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;