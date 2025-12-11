// =========================================
// 1. IMPORTS
// =========================================
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import AudioPlayer from 'react-h5-audio-player';
import { STRAPI_URL, SUPER_ADMINS, CONTENT_EDITORS } from './utils/constants';
import GlobalStyles from './components/GlobalStyles';
import EventTicket from './components/EventTicket';
import BookCard from './components/BookCard';
import DynamicLinkButton from './components/DynamicLinkButton';
import { getImageUrl, formatCurrency, generateTicketCode, maskPhone, formatTimeWithAMPM, getSynopsisText } from './utils/helpers';
import 'react-h5-audio-player/lib/styles.css';
import './App.css';

// =========================================
// 5. MAIN APP COMPONENT
// =========================================
function App() {
    // --- STATE ---
    // --- USER AUTH STATE ---
    const [currentUser, setCurrentUser] = useState(null); // Stores user data (id, username, email)
    const [showAuthModal, setShowAuthModal] = useState(false); // Opens Login/Signup box
    const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

    const [loading, setLoading] = useState(true);
    const [quotes, setQuotes] = useState([]);
    const [books, setBooks] = useState([]);
    const [movies, setMovies] = useState([]);
    const [songs, setSongs] = useState([]);
    const [events, setEvents] = useState([]);
    const [allRegistrations, setAllRegistrations] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    // --- QUIZ STATE ---
    const [quizSelected, setQuizSelected] = useState(null); // 'A', 'B', or 'C'
    const [quizStatus, setQuizStatus] = useState('idle'); // 'idle', 'correct', 'wrong'
    // --- DEVOTIONAL STATE ---
    const [devotionals, setDevotionals] = useState([]);
    const [activeDevoIndex, setActiveDevoIndex] = useState(0);
    // Modals & UI
    const [showModal, setShowModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userCurrency] = useState('USD');
    const [formData, setFormData] = useState({ name: '', churchName: '', email: '', message: '' });
    const [formStatus, setFormStatus] = useState('');

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

    // --- SUBSCRIBE STATE ---
    const [showSubscribeModal, setShowSubscribeModal] = useState(false);
    const [subscribeStatus, setSubscribeStatus] = useState(''); // 'loading', 'success', 'error'

    // =========================================
    // DEVICE AUTHORIZATION LOGIC
    // =========================================
    const [isAuthorizedDevice, setIsAuthorizedDevice] = useState(false);
    const [myDeviceId, setMyDeviceId] = useState('');
    const [showDeviceIDModal, setShowDeviceIDModal] = useState(false);

    // GATEKEEPER & ADMIN STATE
    const [cameraActive, setCameraActive] = useState(false);
    const [checkInCode, setCheckInCode] = useState('');
    const [checkInStatus, setCheckInStatus] = useState(null);
    const [checkInMessage, setCheckInMessage] = useState('');
    const [scannedGuest, setScannedGuest] = useState(null);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [showAdminDashboard, setShowAdminDashboard] = useState(false);
    const [adminUser, setAdminUser] = useState(null);
    const [adminFormData, setAdminFormData] = useState({
        activeTab: 'gatekeeper',
        select: 'Staff',
        targetId: '',
        targetType: 'event',
        ministerName: '',
        ministerRole: '',
        ministerBio: '',
        ministerPhoto: null
    });

    // MEDIA STATE
    const [heroIndex1, setHeroIndex1] = useState(0);
    const [heroIndex2, setHeroIndex2] = useState(1);
    const [heroIndex3, setHeroIndex3] = useState(2);
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [editingQuote, setEditingQuote] = useState(null);
    const [quoteFormText, setQuoteFormText] = useState("");
    const [videoPlaylist, setVideoPlaylist] = useState([]);
    const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    // REFS
    const videoPlaylistRef = useRef(null);
    const videoScrollIntervalRef = useRef(null);
    const bookScrollRef = useRef(null);
    const scrollInterval = useRef(null);

    const heroImages = [
      "/images/slide1.jpg", "/images/slide2.jpg", "/images/slide3.jpg",
      "/images/slide4.jpg", "/images/slide8.jpg", "/images/slide6.jpg", "/images/slide7.jpg",
    ];

    // --- EFFECTS ---
    // Reset quiz when changing devotionals
    useEffect(() => {
        setQuizSelected(null);
        setQuizStatus('idle');
    }, [activeDevoIndex]);
    // --- DEEP LINKING (Open Shared Devotionals) ---
    useEffect(() => {
        if (devotionals.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const linkedId = params.get('devo'); // Look for ?devo=123

            if (linkedId) {
                const foundIndex = devotionals.findIndex(d => d.id.toString() === linkedId);
                if (foundIndex !== -1) {
                    setActiveDevoIndex(foundIndex);
                    // Wait a moment for layout to settle, then scroll
                    setTimeout(() => {
                        document.getElementById('devotionals')?.scrollIntoView({ behavior: 'smooth' });
                    }, 1000);
                }
            }
        }
    }, [devotionals]); // Run this whenever devotionals finish loading
    // --- ROBUST SCROLL LOCK ---
    useEffect(() => {
        if (isVideoPlaying) {
            // Lock position
            document.body.style.position = 'fixed';
            document.body.style.top = `-${window.scrollY}px`;
            document.body.style.width = '100%';
        } else {
            // Unlock and restore position
            const scrollY = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }
    }, [isVideoPlaying]);
    useEffect(() => {
        const timer1 = setInterval(() => setHeroIndex1((prev) => (prev + 1) % heroImages.length), 5000);
        return () => clearInterval(timer1);
    }, []);
    useEffect(() => {
        const timer2 = setInterval(() => setHeroIndex2((prev) => (prev + 1) % heroImages.length), 8000);
        return () => clearInterval(timer2);
    }, []);
    useEffect(() => {
        const timer3 = setInterval(() => setHeroIndex3((prev) => (prev + 1) % heroImages.length), 6000);
        return () => clearInterval(timer3);
    }, []);
    useEffect(() => {
        const quoteTimer = setInterval(() => setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length), 6000);
        return () => clearInterval(quoteTimer);
    }, [quotes.length]);
    useEffect(() => {
        // Access this by visiting: jesururujude.com/?setup=device
        const params = new URLSearchParams(window.location.search);
        if (params.get('setup') === 'device') {
            setShowDeviceIDModal(true);
        }
    }, []);
    useEffect(() => {
        // 1. Get or Create Unique Device ID
        let storedId = localStorage.getItem('device_uuid');
        if (!storedId) {
            // Generate a random UUID-like string
            storedId = 'dev-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
            localStorage.setItem('device_uuid', storedId);
        }
        setMyDeviceId(storedId);

        // 2. Check Strapi if this ID is allowed
        const checkAuthorization = async () => {
            try {
                // Filters looking for this specific DeviceUUID
                const res = await axios.get(`${STRAPI_URL}/api/authorized-devices?filters[DeviceUUID][$eq]=${storedId}`);
                
                // If we find a match in the database, access is granted
                if (res.data.data && res.data.data.length > 0) {
                    setIsAuthorizedDevice(true);
                } else {
                    setIsAuthorizedDevice(false);
                }
            } catch (error) {
                console.error("Auth Check Failed:", error);
                // Fail safe: If API is down, deny access
                setIsAuthorizedDevice(false);
            }
        };

        checkAuthorization();
    }, []);
    // Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [songsRes, booksRes, moviesRes, regRes, eventRes, quotesRes, videosRes, devosRes] = await Promise.all([
                    axios.get(`${STRAPI_URL}/api/songs?populate=*`),
                    axios.get(`${STRAPI_URL}/api/books?populate[0]=CoverArt&populate[1]=TheTeam.Photo&populate[2]=LocalPrices`),
                    axios.get(`${STRAPI_URL}/api/movies?populate=*`),
                    axios.get(`${STRAPI_URL}/api/registrations?pagination[pageSize]=100`),
                    axios.get(`${STRAPI_URL}/api/events?populate[0]=Poster&populate[1]=Team.Photo`).catch(() => ({ data: { data: [] } })),
                    axios.get(`${STRAPI_URL}/api/quotes`).catch(() => ({ data: { data: [] } })),
                    axios.get(`${STRAPI_URL}/api/videos?populate=*`).catch(() => ({ data: { data: [] } })),
                    axios.get(`${STRAPI_URL}/api/devotionals?sort=Date:desc`).catch(() => ({ data: { data: [] } }))
                ]);
                setSongs(songsRes.data.data);
                setBooks(booksRes.data.data);
                setMovies(moviesRes.data.data);
                setEvents(eventRes.data.data);

                // === PROCESS DEVOTIONALS ===
                const rawDevos = devosRes.data.data || [];
                const processedDevos = rawDevos.map(item => {
                    const attrs = item.attributes || item;
                    return {
                        id: item.id,
                        title: attrs.Title || "Untitled",
                        date: attrs.Date || "No Date",
                        category: attrs.Category || "General",
                        verse: attrs.Scripture || "",
                        text: attrs.Body || "",
                        biblePlan: attrs.BiblePlan || "",
                        bibleDay: attrs.BibleDay || null,
                        assignment: attrs.Assignment || "",
                        quiz: {
                            question: attrs.QuizQuestion || "",
                            options: [attrs.QuizOptionA, attrs.QuizOptionB, attrs.QuizOptionC].filter(Boolean), // Only show existing options
                            correct: attrs.CorrectOption || "" // "A", "B", or "C"
                        }
                    };
                });
                setDevotionals(processedDevos);

                // Process Quotes
                const rawQuotes = quotesRes.data.data || [];
                const fetchedQuotes = rawQuotes.map(item => {
                    const attrs = item.attributes || item;
                    return {
                        id: item.id,
                        documentId: item.documentId,
                        Text: attrs.Text || attrs.text || "",
                        Highlight: attrs.Highlight || attrs.highlight || ""
                    };
                });
                if (fetchedQuotes.length > 0) setQuotes(fetchedQuotes);
                else setQuotes([{ Text: "To be filled with the earthly is to be emptied of the eternal.", Highlight: "eternal" }, { Text: "Excellence is not a skill, it is the posture of a heart that honors God.", Highlight: "Excellence" }]);

                const flattened = regRes.data.data.map(item => ({ id: item.id, ...(item.attributes || item) }));
                setAllRegistrations(flattened);

                // REPLACE THE PREVIOUS 'Process Videos' BLOCK WITH THIS:

                // Process Videos
                const rawVideos = videosRes.data.data || [];
                const fetchedVideos = rawVideos.map(item => {
                    const attrs = item.attributes || item;
                    
                    // ROBUST URL GETTER (Handles Strapi v4 & v5)
                    const getUrl = (mediaField) => {
                        if (!mediaField) return null;
                        
                        // Case A: It's inside 'data' (Standard v4)
                        let data = mediaField.data || mediaField;
                        if (Array.isArray(data)) data = data[0];
                        if (!data) return null;

                        // Case B: It has 'attributes' (Standard v4) or direct properties (v5)
                        const url = data.attributes?.url || data.url;
                        
                        if (!url) return null;
                        return url.startsWith('http') ? url : `${STRAPI_URL}${url}`;
                    };

                    // SOURCE DETECTION
                    let finalSource = "";
                    
                    // Get the link (checking all spellings)
                    let ytLink = attrs.YouTubeLink || attrs.youTubeLink || attrs.youtubeLink; 

                    if (ytLink && ytLink.length > 5) {
                        // CLEANUP: Remove the "?si=..." tracking junk if it's a short link
                        if (ytLink.includes('youtu.be')) {
                            // This splits at the '?' and takes ONLY the first part
                            finalSource = ytLink.split('?')[0]; 
                        }
                        finalSource = ytLink; 
                    } else {
                        finalSource = getUrl(attrs.VideoFile); 
                    }

                    return {
                        id: item.id,
                        title: attrs.Title || "Untitled Video",
                        desc: attrs.Description || "",
                        duration: attrs.Duration || "00:00",
                        // Fallback to placeholder only if getUrl returns null
                        thumbnail: getUrl(attrs.Thumbnail) || "/images/placeholder.jpg", 
                        videoSrc: finalSource
                    };
                });

                if (fetchedVideos.length > 0) setVideoPlaylist(fetchedVideos);
                else setVideoPlaylist([{ id: 1, title: "Coming Soon", desc: "Stay tuned.", duration: "00:00", thumbnail: "", videoSrc: "" }]);

            } catch (error) { console.error("Fetch Error:", error); }
            finally { setTimeout(() => setLoading(false), 1000); }
        };
        fetchData();
    }, []);

    // --- DATA HELPERS ---
    const getEventsData = () => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        let allEvents = [];
        const getBookLink = (b) => {
            const links = b.purchaseLinks || b.PurchaseLinks || [];
            const found = links.find(l => l.Type === 'Physical' || l.Platform.toLowerCase().includes('paystack'));
            return found ? found.Link : '#';
        };
        events.forEach(evt => {
            const e = evt.attributes || evt;
            const rawDate = e.Date || e.date;
            const rawTime = e.Time || e.time;
            let formattedDate = 'Date TBA';
            let formattedTime = '';
            if (rawDate) { try { const d = new Date(rawDate); if (!isNaN(d.getTime())) formattedDate = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); } catch (err) { console.log(err); } }
            if (rawTime) formattedTime = formatTimeWithAMPM(rawTime);
            const finalDateTime = (rawDate) ? `${formattedDate}, ${formattedTime ? formattedTime + ' WAT' : 'Time TBA'}` : 'Date & Time TBA';
            allEvents.push({ id: evt.id, documentId: e.documentId, Title: e.Title, Venue: e.Venue || 'Venue TBA', Category: e.Category, RawSortingDate: rawDate, Poster: e.Poster, Description: e.Description, Team: e.Team, WhatsAppLink: e.WhatsAppLink, EventDateTime: finalDateTime });
        });
        books.forEach(book => {
            const b = book.attributes || book;
            const d = b.LaunchDate;
            const t = b.LaunchTime;
            const prices = b.LocalPrices || [];
            const localPriceObj = prices.find(p => p.Currency === 'NGN') || prices[0];
            let formattedPrice = "Free / Donation";
            if (localPriceObj && localPriceObj.Amount) formattedPrice = `${localPriceObj.Currency} ${localPriceObj.Amount}`;
            let formattedDate = 'Date TBA';
            if (d) formattedDate = new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            let formattedTime = '';
            if (t) formattedTime = formatTimeWithAMPM(t);
            const finalDateTime = (d) ? `${formattedDate}, ${formattedTime ? formattedTime + ' WAT' : 'Time TBA'}` : formattedDate;
            if (d) allEvents.push({ id: `book-${book.id}`, Title: b.Title, Category: 'Book Launch', RawSortingDate: d, Venue: b.PhysicalVenue || 'TBA', isBook: true, EventDateTime: finalDateTime, Description: `Join us for the official launch.`, Poster: b.CoverArt, PriceTag: formattedPrice, WhatsAppLink: b.WhatsAppLink, Link: getBookLink(b), Team: b.TheTeam || [] });
        });
        songs.forEach(song => { const s = song.attributes || song; if (s.ReleaseDate) allEvents.push({ id: `song-${song.id}`, Category: 'Single Release', Title: s.Title, EventDateTime: new Date(s.ReleaseDate).toLocaleDateString(), Venue: 'Streaming Globally', RawSortingDate: s.ReleaseDate, Description: `New worship sound "${s.Title}" drops.`, Poster: s.CoverArt, Link: s.SpotifyLink || '#' }); });
        movies.forEach(movie => { const m = movie.attributes || movie; if (m.PremiereDate) allEvents.push({ id: `movie-${movie.id}`, Category: 'Movie Premiere', Title: m.Title, EventDateTime: new Date(m.PremiereDate).toLocaleDateString(), Venue: m.CinemaLocation || 'Cinemas', RawSortingDate: m.PremiereDate, Description: `Premiere of "${m.Title}".`, Poster: m.Poster, Link: m.TrailerLink || '#' }); });
        const upcoming = allEvents.filter(e => e.RawSortingDate && new Date(e.RawSortingDate) >= today).sort((a, b) => new Date(a.RawSortingDate) - new Date(b.RawSortingDate));
        const past = allEvents.filter(e => !e.RawSortingDate || new Date(e.RawSortingDate) < today).sort((a, b) => new Date(b.RawSortingDate) - new Date(a.RawSortingDate));
        return { upcoming, past };
    };
    const { upcoming: upcomingEvents, past: pastEvents } = getEventsData();

    // --- HANDLERS ---
    const stopVideoScrolling = () => { if (videoScrollIntervalRef.current) { clearInterval(videoScrollIntervalRef.current); videoScrollIntervalRef.current = null; } };
    const startVideoScrolling = (direction) => { stopVideoScrolling(); if (videoPlaylistRef.current) { videoScrollIntervalRef.current = setInterval(() => { const { current } = videoPlaylistRef; const speed = 10; current.scrollLeft += direction === 'left' ? -speed : speed; }, 15); } };
    const changeVideo = (index) => { setIsVideoPlaying(false); setCurrentVideoIndex(index); setTimeout(() => setIsVideoPlaying(true), 100); };
    
    const verifyTicket = async (codeToCheck) => {
        if (!codeToCheck) return;
        if (!adminUser || !adminUser.token) { setCheckInStatus('error'); setCheckInMessage('Session Expired. Please Re-login.'); return; }
        setCheckInStatus('loading'); setCheckInMessage('Verifying ticket...'); setScannedGuest(null); setCameraActive(false);
        const cleanCode = codeToCheck.trim();
        try {
            const searchUrl = `${STRAPI_URL}/api/registrations?filters[ticketCode][$eq]=${cleanCode}&publicationState=preview`;
            const res = await axios.get(searchUrl, { headers: { Authorization: `Bearer ${adminUser.token}` } });
            if (res.data.data.length === 0) { setCheckInStatus('error'); setCheckInMessage('❌ TICKET NOT FOUND'); return; }
            const guestRecord = res.data.data[0];
            const guestData = guestRecord.attributes || guestRecord;
            const updateId = guestRecord.documentId || guestRecord.id;
            const legacyId = guestRecord.id;
            if (guestData.isCheckedIn) { setCheckInStatus('warning'); setCheckInMessage(`⚠️ ALREADY SCANNED!`); setScannedGuest(guestData); return; }
            await axios.put(`${STRAPI_URL}/api/registrations/${updateId}`, { data: { isCheckedIn: true } }, { headers: { Authorization: `Bearer ${adminUser.token}` } });
            setAllRegistrations(prev => prev.map(reg => reg.id === legacyId ? { ...reg, isCheckedIn: true } : reg));
            setCheckInStatus('success'); setCheckInMessage('✅ ACCESS GRANTED'); setScannedGuest(guestData); setCheckInCode('');
        } catch (error) { console.error("Gatekeeper Error:", error); setCheckInStatus('error'); setCheckInMessage('System Error: Check Network'); }
    };
    const handleScan = (scannedRawValue) => { if (scannedRawValue) { setCheckInCode(scannedRawValue); verifyTicket(scannedRawValue); } };
    const handleManualSubmit = (e) => { e.preventDefault(); verifyTicket(checkInCode); };

    const fetchQuotes = async () => { try { const res = await axios.get(`${STRAPI_URL}/api/quotes`); const raw = res.data.data || []; const processed = raw.map(item => { const attrs = item.attributes || item; return { id: item.id, documentId: item.documentId, Text: attrs.Text || attrs.text || "", Highlight: attrs.Highlight || attrs.highlight || "", PostedBy: attrs.PostedBy || attrs.postedBy || "" }; }); setQuotes(processed); } catch (error) { console.error("Failed to refresh quotes", error); } };
    const handleAddQuote = async (e) => { e.preventDefault(); if (!adminUser) return alert("You must be logged in."); const textVal = e.target.quoteText.value; const highlightVal = e.target.quoteHighlight.value; const authorName = adminUser.username || "Admin"; const payload = { Text: textVal, Highlight: highlightVal, PostedBy: authorName }; try { await axios.post(`${STRAPI_URL}/api/quotes`, { data: payload }, { headers: { Authorization: `Bearer ${adminUser.token}` } }); alert("Wisdom Added Successfully!"); setQuoteFormText(""); e.target.reset(); await fetchQuotes(); } catch (error) { console.error("Save Error:", error); alert("Failed to save. Check Console."); } };
    const handleUpdateQuote = async (e) => { e.preventDefault(); if (!adminUser) return alert("You must be logged in."); const textVal = e.target.quoteText.value; const highlightVal = e.target.quoteHighlight.value; const authorName = adminUser.username || "Admin"; const targetId = editingQuote.documentId || editingQuote.id; const payload = { Text: textVal, Highlight: highlightVal, PostedBy: authorName }; try { await axios.put(`${STRAPI_URL}/api/quotes/${targetId}`, { data: payload }, { headers: { Authorization: `Bearer ${adminUser.token}` } }); alert("Quote Updated Successfully!"); cancelEditing(); await fetchQuotes(); } catch (error) { console.error("Update Failed:", error); alert("Failed to update."); } };
    const handleDeleteQuote = async (quote) => { if (!window.confirm("Delete this quote?")) return; const targetId = quote.documentId || quote.id; try { await axios.delete(`${STRAPI_URL}/api/quotes/${targetId}`, { headers: { Authorization: `Bearer ${adminUser.token}` } }); alert("Quote Deleted."); if (editingQuote && (editingQuote.id === quote.id)) cancelEditing(); await fetchQuotes(); } catch (error) { console.error("Delete Error:", error); alert("Failed to delete."); } };
    const startEditing = (quote) => { setEditingQuote(quote); const text = quote.Text || quote.text || ""; setQuoteFormText(text); setTimeout(() => { if (document.getElementsByName('quoteText')[0]) { document.getElementsByName('quoteText')[0].value = text; document.getElementsByName('quoteHighlight')[0].value = quote.Highlight || quote.highlight || ""; } }, 50); };
    const cancelEditing = () => { setEditingQuote(null); setQuoteFormText(""); const form = document.querySelector('form[name="quoteForm"]'); if (form) form.reset(); };

    // --- AUTHENTICATION HANDLERS ---
    
    // 1. REGISTER
    const handleRegister = async (e) => {
        e.preventDefault();
        const username = e.target.username.value;
        const email = e.target.email.value;
        const password = e.target.password.value;

        try {
            const response = await axios.post(`${STRAPI_URL}/api/auth/local/register`, {
                username,
                email,
                password,
            });
            
            // Auto-login after register
            const { user, jwt } = response.data;
            loginUser(user, jwt);
            alert(`Welcome to the family, ${user.username}!`);
            setShowAuthModal(false);
        } catch (error) {
            console.error(error);
            alert("Registration failed. Email might be taken.");
        }
    };

    // 2. LOGIN
    const handleLogin = async (e) => {
        e.preventDefault();
        const identifier = e.target.identifier.value; // email or username
        const password = e.target.password.value;

        try {
            const response = await axios.post(`${STRAPI_URL}/api/auth/local`, {
                identifier,
                password,
            });

            const { user, jwt } = response.data;
            loginUser(user, jwt);
            setShowAuthModal(false);
        } catch (error) {
            console.error(error);
            alert("Invalid email or password.");
        }
    };

    // 3. LOGOUT
    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');
        window.location.reload(); // Refresh to clear states
    };

    // Helper to save session
    const loginUser = (user, token) => {
        setCurrentUser(user);
        localStorage.setItem('user_token', token);
        localStorage.setItem('user_data', JSON.stringify(user));
    };

    // Check if user is already logged in when app loads
    useEffect(() => {
        const token = localStorage.getItem('user_token');
        const userData = localStorage.getItem('user_data');
        if (token && userData) {
            setCurrentUser(JSON.parse(userData));
        }
    }, []);
    const handleAdminLogin = async (e) => {
        e.preventDefault();
        if (!adminFormData.username || !adminFormData.password) { alert("Error: Username or Password field is empty."); return; }
        try {
            const res = await axios.post(`${STRAPI_URL}/api/auth/local`, { identifier: adminFormData.username, password: adminFormData.password });
            const user = res.data.user; const token = res.data.jwt;
            const safeAdminList = (typeof SUPER_ADMINS !== 'undefined') ? SUPER_ADMINS : [];
            const isSuperAdmin = safeAdminList.some(adminEmail => adminEmail.toLowerCase() === user.email.toLowerCase());
            const actualPrivilege = isSuperAdmin ? 'super_admin' : 'staff';
            if (adminFormData.selectedRole === 'super_admin' && actualPrivilege !== 'super_admin') { alert(`ACCESS DENIED. You are Staff, not Super Admin.`); return; }
            setAdminUser({ username: user.username, email: user.email, token: token, role: adminFormData.selectedRole });
            setAdminFormData({ ...adminFormData, activeTab: adminFormData.selectedRole === 'super_admin' ? 'team' : 'gatekeeper' });
            setShowAdminLogin(false); setShowAdminDashboard(true);
        } catch (error) { console.error("LOGIN FAILED:", error); alert("Login Failed. Check credentials or network."); }
    };
    const handleAddMinister = async (e) => {
        e.preventDefault(); if (!adminUser) return alert("You must be logged in.");
        let photoId = null;
        if (adminFormData.ministerPhoto) { try { const uploadData = new FormData(); uploadData.append('files', adminFormData.ministerPhoto); const uploadRes = await axios.post(`${STRAPI_URL}/api/upload`, uploadData, { headers: { 'Authorization': `Bearer ${adminUser.token}` } }); photoId = uploadRes.data[0].id; } catch (uploadError) { console.log(uploadError); alert(`Image Upload Failed.`); return; } }
        try {
            const collection = adminFormData.targetType === 'book' ? 'books' : 'events'; const fieldName = adminFormData.targetType === 'book' ? 'TheTeam' : 'Team';
            const getRes = await axios.get(`${STRAPI_URL}/api/${collection}/${adminFormData.targetId}?populate[${fieldName}][populate]=*`);
            const currentData = getRes.data.data.attributes || getRes.data.data; const currentTeam = currentData[fieldName] || [];
            const cleanTeam = currentTeam.map(member => ({ Name: member.Name, Role: member.Role, Bio: member.Bio, Photo: member.Photo ? member.Photo.id : null }));
            const newMember = { Name: adminFormData.ministerName, Role: adminFormData.ministerRole, Bio: adminFormData.ministerBio, Photo: photoId };
            await axios.put(`${STRAPI_URL}/api/${collection}/${adminFormData.targetId}`, { data: { [fieldName]: [...cleanTeam, newMember] } }, { headers: { Authorization: `Bearer ${adminUser.token}` } });
            alert("Minister Added Successfully!"); setAdminFormData({ ...adminFormData, ministerName: '', ministerRole: '', ministerBio: '', ministerPhoto: null }); window.location.reload();
        } catch (error) { alert("Failed to save team member details."); }
    };
    const handleAdminInput = (e) => { const { name, value } = e.target; if (name === 'ministerName' || name === 'ministerRole') { const formatted = value.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); setAdminFormData(prev => ({ ...prev, [name]: formatted })); } else { setAdminFormData(prev => ({ ...prev, [name]: value })); } };

    const handleEventClick = (eventItem) => { setTicketSnapshot({ date: eventItem.EventDateTime, venue: eventItem.Venue }); setSelectedEvent(eventItem); setIsRegistering(eventItem.isBook); setEventModalOpen(true); };
    const handleRegistrationInput = (e) => { const { name, value } = e.target; if (name === 'name') { const formattedValue = value.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); setRegistrationData(prev => ({ ...prev, [name]: formattedValue })); } else if (name === 'email') { setRegistrationData(prev => ({ ...prev, [name]: value.toLowerCase() })); } else { setRegistrationData(prev => ({ ...prev, [name]: value })); } };
    const handleEventRegistrationSubmit = async (e) => {
        e.preventDefault(); if (!selectedEvent) return; setIsSubmitting(true);
        const formattedName = registrationData.name; const ticketCode = generateTicketCode();
        const payload = { fullName: formattedName, emailAddress: registrationData.email.toLowerCase().trim(), phoneNumber: registrationData.phone, attendanceType: registrationData.attendanceType, eventTitle: selectedEvent.Title, ticketCode: ticketCode, };
        if (!selectedEvent.isBook) payload.event = selectedEvent.documentId || selectedEvent.id;
        try { await axios.post(`${STRAPI_URL}/api/registrations`, { data: payload }); setIsSubmitting(false); setSuccessData({ name: formattedName, ticket: ticketCode, whatsAppLink: selectedEvent.WhatsAppLink || (selectedEvent.attributes && selectedEvent.attributes.WhatsAppLink), date: ticketSnapshot.date || "TBA", venue: ticketSnapshot.venue || "TBA" }); setAllRegistrations(prev => [...prev, { ...payload, fullName: formattedName, id: Date.now() }]); setRegistrationData({ name: '', email: '', phone: '', attendanceType: 'Physical' }); } catch (error) { setIsSubmitting(false); alert("Registration failed. Please check connection."); }
    };
    const handleBooking = async (e) => { e.preventDefault(); setFormStatus('sending'); try { await axios.post(`${STRAPI_URL}/api/bookings`, { data: { Name: formData.name, ChurchName: formData.churchName, Email: formData.email, Message: formData.message } }); setFormStatus('success'); setTimeout(() => { setShowModal(false); setFormStatus(''); setFormData({ name: '', churchName: '', email: '', message: '' }); }, 2000); } catch { setFormStatus('error'); } };
    const handlePurchaseClick = (book) => { const normalizedBook = { ...book, PurchaseLinks: book.purchaseLinks || book.PurchaseLinks || [] }; setSelectedBook(normalizedBook); setPurchaseModalOpen(true); };
    const handlePreorderClick = (book) => { setSelectedBook(book); setPreorderModalOpen(true); };
    const scrollToSection = (id) => { setMobileMenuOpen(false); const element = document.getElementById(id); if (element) element.scrollIntoView({ behavior: 'smooth' }); };
    const startScrolling = (direction) => { if (scrollInterval.current) clearInterval(scrollInterval.current); scrollInterval.current = setInterval(() => { if (bookScrollRef.current) { bookScrollRef.current.scrollLeft += (direction === 'left' ? -10 : 10); } }, 10); };
    const stopScrolling = () => { if (scrollInterval.current) { clearInterval(scrollInterval.current); scrollInterval.current = null; } };

    // --- INSIGHT HANDLER ---
    const handleSendInsight = async (msg) => {
        if (!currentUser) {
            alert("Please login to send insights to Jude.");
            setShowAuthModal(true);
            return;
        }

        try {
            await axios.post(`${STRAPI_URL}/api/reflections`, {
                data: {
                    Content: msg,
                    DevotionalTitle: devotionals[activeDevoIndex].title,
                    ReaderName: currentUser.username, // <--- AUTOMATIC NAME
                    Email: currentUser.email // <--- AUTOMATIC EMAIL
                }
            });
            alert("Sent successfully! Jude will see this.");
        } catch (error) { console.log(error); }
    };

    // =========================================
    // HANDLE NEWSLETTER SUBSCRIPTION
    // =========================================
    const handleSubscribe = async (e) => {
        e.preventDefault();
        setSubscribeStatus('loading');
        
        const name = e.target.name.value;
        const email = e.target.email.value;

        try {
            await axios.post(`${STRAPI_URL}/api/subscribers`, { 
                data: { Name: name, Email: email } 
            });
            
            setSubscribeStatus('success');
            
            // Clear and close after 2 seconds
            setTimeout(() => {
                setSubscribeStatus('');
                setShowSubscribeModal(false);
            }, 2000);

        } catch (error) {
            console.error("Subscription Error:", error);
            setSubscribeStatus('error');
        }
    };

    const handleShareDevotional = async (devo) => {
        if (!devo) return;

        // Create a direct link to this specific entry
        const shareUrl = `${window.location.origin}/?devo=${devo.id}`;
        const shareText = `Read "${devo.title}" on Jude Jesururu's Daily Devotional:\n${shareUrl}`;

        // 1. Try Native Share (Mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: devo.title,
                    text: shareText,
                    url: shareUrl
                });
                return;
            } catch (err) {
                // If user cancels, do nothing
                if (err.name === 'AbortError') return;
            }
        }

        // 2. Fallback: Copy to Clipboard (Desktop)
        try {
            await navigator.clipboard.writeText(shareText);
            alert("Link copied to clipboard! 📋\nYou can now paste it anywhere.");
        } catch (err) {
            alert("Could not copy link.");
        }
    };
    const handleWhatsAppShare = (devo) => {
        const shareUrl = `${window.location.origin}/?devo=${devo.id}`;
        const text = encodeURIComponent(`*${devo.title}* \n_${devo.verse}_ \n\nRead full entry here: ${shareUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };
    // =========================================
    // ADMIN: HANDLE DEVOTIONAL UPLOAD
    // =========================================
    const handlePostDevotional = async (e) => {
        e.preventDefault();
        
        // 1. Collect Data
        const form = e.target;
        const payload = {
            Title: form.title.value,
            Category: form.category.value,
            Scripture: form.scripture.value,
            Date: form.date.value,
            Body: form.body.value,
            BiblePlan: form.biblePlan.value,
            BibleDay: form.bibleDay.value,
            Assignment: form.assignment.value,
            QuizQuestion: form.quizQuestion.value,
            QuizOptionA: form.quizA.value,
            QuizOptionB: form.quizB.value,
            QuizOptionC: form.quizC.value,
            CorrectOption: form.correctOption.value
        };

        if (!adminUser || !adminUser.token) return alert("Session expired. Please login again.");

        // 2. Send to Strapi
        try {
            await axios.post(`${STRAPI_URL}/api/devotionals`, { data: payload }, {
                headers: { Authorization: `Bearer ${adminUser.token}` }
            });
            
            alert("Devotional Posted Successfully! ✅");
            form.reset(); // Clear the form
            
            // Optional: Refresh the list immediately so they see it
            const res = await axios.get(`${STRAPI_URL}/api/devotionals?sort=Date:desc`);
            const rawDevos = res.data.data || [];
            const processedDevos = rawDevos.map(item => ({
                id: item.id,
                title: item.attributes.Title,
                date: item.attributes.Date,
                category: item.attributes.Category,
                verse: item.attributes.Scripture,
                text: item.attributes.Body
            }));
            setDevotionals(processedDevos);

        } catch (error) {
            console.error("Upload Failed:", error);
            alert("Failed to post. Check your connection or permissions.");
        }
    };
    // =========================================
    // TICKET DOWNLOAD HANDLER (Fixed Layout)
    // =========================================
    const handleDownloadTicket = async () => {
        const html2canvas = (await import('html2canvas')).default;
        const element = document.getElementById('printable-ticket');
        
        if (!element) return;

        // Visual feedback
        const originalText = document.getElementById('download-btn-text');
        if(originalText) originalText.innerText = "Generating...";
        document.body.style.cursor = 'wait';

        try {
            const canvas = await html2canvas(element, {
                scale: 3, // High resolution
                useCORS: true, 
                backgroundColor: '#0f172a',
                logging: false,
                
                // === THE MAGIC FIX ===
                // This adjusts the layout strictly for the image generation
                // without changing what you see on the screen.
                windowWidth: 1200, // Simulate desktop view
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('printable-ticket');
                    
                    // 1. Force a standard width (prevents text wrapping/cutting)
                    clonedElement.style.width = "600px";
                    clonedElement.style.height = "auto";
                    clonedElement.style.position = "static";
                    clonedElement.style.margin = "0";
                    
                    // 2. Fix the Image Distortion
                    // We target the image container and the image itself
                    const imageContainer = clonedElement.querySelector('.h-56');
                    if (imageContainer) {
                        imageContainer.style.height = "350px"; // Make banner taller for image
                    }
                    
                    const img = clonedElement.querySelector('img');
                    if (img) {
                        img.style.objectFit = "cover"; // Ensures it doesn't stretch
                        img.style.height = "100%";
                        img.style.width = "100%";
                    }

                    // 3. Ensure Ticket Number is visible
                    const ticketNum = clonedElement.querySelector('.font-mono');
                    if(ticketNum) {
                        ticketNum.style.whiteSpace = "nowrap"; // Stop it from breaking lines
                        ticketNum.style.fontSize = "24px"; // Ensure readable size
                    }
                }
            });

            // Trigger Download
            const link = document.createElement('a');
            link.download = `Access_Pass_${successData.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

        } catch (error) {
            console.error("Ticket Generation Error:", error);
            alert("Could not generate image. Please try taking a screenshot manually.");
        } finally {
            if(originalText) originalText.innerText = "📥 Download Ticket (Image)";
            document.body.style.cursor = 'default';
        }
    };

    // PDF Download Function
    const handleDownloadPDF = async () => {
        const html2canvas = (await import('html2canvas')).default; const jsPDF = (await import('jspdf')).default;
        const element = document.getElementById('banner-to-print'); if (!element) return;
        document.body.style.cursor = 'wait';
        const posterImg = element.querySelector('img'); let posterWidth, posterHeight; if (posterImg) { posterWidth = posterImg.offsetWidth; posterHeight = posterImg.offsetHeight; }
        try {
            const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#0B1120', onclone: (clonedDoc) => { const clonedElement = clonedDoc.getElementById('banner-to-print'); const textElements = clonedElement.querySelectorAll('h1, span.text-transparent'); textElements.forEach(el => { el.style.backgroundImage = 'none'; el.style.color = '#F3C657'; el.style.webkitTextFillColor = '#F3C657'; el.classList.remove('text-transparent', 'bg-clip-text'); }); const clonedImg = clonedElement.querySelector('img'); if (clonedImg && posterWidth) { clonedImg.style.width = `${posterWidth}px`; clonedImg.style.height = `${posterHeight}px`; clonedImg.style.objectFit = 'cover'; } const brandingContainer = clonedElement.querySelector('.border-b'); if (brandingContainer) { const crossIcon = brandingContainer.querySelector('svg'); if (crossIcon) { crossIcon.style.marginTop = '6px'; } } } });
            const imgData = canvas.toDataURL('image/jpeg', 1.0); const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }); const pdfWidth = 297; const pdfHeight = (canvas.height * pdfWidth) / canvas.width; pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight); pdf.save(`Banner_Preview.pdf`);
        } catch (err) { console.error("PDF Error:", err); alert("Could not generate PDF."); } finally { document.body.style.cursor = 'default'; }
    };

    // --- RENDER VIEWS ---

    if (loading) {
        return (
            <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-[#0B1120] text-white overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ministry-gold/5 rounded-full blur-[100px] animate-pulse"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="flex items-center gap-3 md:gap-6 mb-6 animate-fade-in-up">
                        <svg className="h-8 w-8 md:h-14 md:w-14 drop-shadow-2xl" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V22M5 9H19" stroke="url(#gold-loader-gradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><defs><linearGradient id="gold-loader-gradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#BF953F" /><stop offset="50%" stopColor="#FCF6BA" /><stop offset="100%" stopColor="#B38728" /></linearGradient></defs></svg>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-wider flex items-baseline"><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] drop-shadow-sm">JesururuJude</span><span className="text-gray-600 font-sans text-xl md:text-3xl font-light ml-1">.com</span></h1>
                    </div>
                    <p className="text-xs md:text-sm text-gray-500 uppercase tracking-[0.4em] mb-12 animate-fade-in-up delay-100">Faith & Excellence</p>
                    <div className="w-32 md:w-48 h-[2px] bg-gray-800 rounded-full overflow-hidden relative"><div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-ministry-gold to-transparent animate-shimmer-slide"></div></div>
                </div>
                <style>{`@keyframes shimmer-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } } .animate-shimmer-slide { animation: shimmer-slide 1.5s infinite linear; } @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fade-in-up 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; } .delay-100 { animation-delay: 0.3s; opacity: 0; animation-fill-mode: forwards; }`}</style>
            </div>
        );
    }

    if (showAdminDashboard && adminUser) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm p-2 md:p-4 animate-fade-in">
                <div className="bg-white w-full max-w-4xl rounded-sm shadow-2xl relative flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden">
                    <div className="bg-ministry-blue text-white p-4 flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0 z-20 shadow-md">
                        <div className="text-center md:text-left w-full md:w-auto flex justify-between items-center">
                            <div><h3 className="font-bold text-lg leading-none">Admin Console</h3><p className="text-[10px] text-white/60 uppercase tracking-widest mt-1">Logged in as {adminUser.username}</p></div>
                            <button onClick={() => setShowAdminDashboard(false)} className="md:hidden text-white/50 hover:text-white text-2xl font-bold">✕</button>
                        </div>
                        {/* === ADMIN TABS (Dynamic Permissions) === */}
                        <div className="flex w-full md:w-auto gap-2">
                            
                            {/* 1. SCANNER (Visible to EVERYONE who logs in) */}
                            <button 
                                onClick={() => setAdminFormData({...adminFormData, activeTab: 'gatekeeper'})} 
                                className={`flex-1 md:flex-none px-3 py-2 rounded text-[10px] md:text-xs font-bold uppercase tracking-widest border border-white/20 transition ${adminFormData.activeTab === 'gatekeeper' ? 'bg-ministry-gold text-ministry-blue border-ministry-gold' : 'hover:bg-white/10'}`}
                            >
                                Scanner
                            </button>

                            {/* 2. QUOTES & TEAM (Strictly for SUPER ADMINS only) */}
                            {SUPER_ADMINS.includes(adminUser.email) && (
                                <>
                                    <button 
                                        onClick={() => setAdminFormData({...adminFormData, activeTab: 'quotes'})} 
                                        className={`flex-1 md:flex-none px-3 py-2 rounded text-[10px] md:text-xs font-bold uppercase tracking-widest border border-white/20 transition ${adminFormData.activeTab === 'quotes' ? 'bg-ministry-gold text-ministry-blue border-ministry-gold' : 'hover:bg-white/10'}`}
                                    >
                                        Quotes
                                    </button>
                                    <button 
                                        onClick={() => setAdminFormData({...adminFormData, activeTab: 'team'})} 
                                        className={`flex-1 md:flex-none px-3 py-2 rounded text-[10px] md:text-xs font-bold uppercase tracking-widest border border-white/20 transition ${adminFormData.activeTab === 'team' ? 'bg-ministry-gold text-ministry-blue border-ministry-gold' : 'hover:bg-white/10'}`}
                                    >
                                        Team
                                    </button>
                                </>
                            )}

                            {/* 3. DEVOTIONALS (Visible to YOU and ASSISTANT) */}
                            {(SUPER_ADMINS.includes(adminUser.email) || CONTENT_EDITORS.includes(adminUser.email)) && (
                                <button 
                                    onClick={() => setAdminFormData({...adminFormData, activeTab: 'devotionals'})} 
                                    className={`flex-1 md:flex-none px-3 py-2 rounded text-[10px] md:text-xs font-bold uppercase tracking-widest border border-white/20 transition ${adminFormData.activeTab === 'devotionals' ? 'bg-ministry-gold text-ministry-blue border-ministry-gold' : 'hover:bg-white/10'}`}
                                >
                                    Devotionals
                                </button>
                            )}
                            
                            {/* LOGOUT */}
                            <button onClick={() => { setAdminUser(null); setShowAdminDashboard(false); }} className="bg-red-600 px-3 py-2 rounded text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-red-700">Logout</button>
                        </div>
                        <button onClick={() => setShowAdminDashboard(false)} className="hidden md:block text-white/50 hover:text-white text-2xl font-bold">✕</button>
                    </div>
                    <div className="p-4 md:p-8 overflow-y-auto custom-scrollbar bg-gray-50 flex-1">
                        {adminFormData.activeTab === 'gatekeeper' && (
                            <div className="flex flex-col items-center max-w-lg mx-auto text-center h-full">
                                <h3 className="text-xl font-bold mb-4 text-gray-700 uppercase tracking-widest">Ticket Gate</h3>
                                <div className={`w-full p-4 md:p-8 rounded-lg mb-6 border-2 shadow-sm transition-all duration-300 ${checkInStatus === 'success' ? 'bg-green-50 border-green-500' : checkInStatus === 'error' ? 'bg-red-50 border-red-500' : checkInStatus === 'warning' ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center justify-center gap-3 md:block">
                                        <div className={`text-4xl md:text-6xl md:mb-2 ${!checkInStatus && 'opacity-20'}`}>{checkInStatus === 'success' ? '✅' : checkInStatus === 'error' ? '⛔' : checkInStatus === 'warning' ? '⚠️' : '📷'}</div>
                                        <h2 className={`text-lg md:text-2xl font-black uppercase tracking-widest ${checkInStatus === 'success' ? 'text-green-600' : checkInStatus === 'error' ? 'text-red-600' : checkInStatus === 'warning' ? 'text-orange-600' : 'text-gray-400'}`}>{checkInMessage || 'Ready'}</h2>
                                    </div>
                                    {scannedGuest && (<div className="mt-3 pt-3 border-t border-gray-200/50 text-left md:text-center"><p className="text-lg font-bold text-gray-800 leading-tight">{scannedGuest.fullName}</p><p className="text-[10px] text-gray-500 uppercase tracking-widest">{scannedGuest.attendanceType} Attendee</p></div>)}
                                </div>
                                {cameraActive && (<div className="w-full mb-6 bg-black rounded-lg overflow-hidden relative h-56 md:h-64 border-4 border-ministry-gold shadow-2xl"><Scanner onScan={(result) => { if (result && result.length > 0) handleScan(result[0].rawValue); }} components={{ audio: false, onOff: false }} styles={{ container: { height: '100%' }, video: { objectFit: 'cover' } }} /><button onClick={() => setCameraActive(false)} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg z-20 whitespace-nowrap">Stop Camera</button></div>)}
                                {!cameraActive && (<form onSubmit={handleManualSubmit} className="relative w-full"><input autoFocus type="text" placeholder="Enter Ticket ID manually..." className="w-full p-4 pl-4 pr-14 text-base border-2 border-ministry-blue rounded-sm focus:outline-none focus:border-ministry-gold shadow-sm bg-white" value={checkInCode} onChange={(e) => setCheckInCode(e.target.value)} /><button type="button" onClick={() => setCameraActive(true)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 p-2 rounded-sm text-xl hover:bg-ministry-gold hover:text-white transition border border-gray-200" title="Open Camera">📷</button></form>)}
                            </div>
                        )}
                        {adminFormData.activeTab === 'team' && (
                            <div className="bg-white p-4 md:p-8 rounded shadow-lg">
                                <h3 className="text-lg md:text-xl font-bold mb-6 text-gray-700 uppercase tracking-widest border-b pb-2">Add Team Member</h3>
                                <form onSubmit={handleAddMinister} className="space-y-4">
                                    <div className="bg-gray-50 p-3 rounded border border-gray-200"><span className="block text-[10px] font-bold uppercase text-gray-400 mb-2">Category</span><div className="flex flex-col sm:flex-row gap-3"><label className="flex items-center gap-2 p-2 bg-white border rounded cursor-pointer hover:border-ministry-gold transition"><input type="radio" name="type" value="event" checked={adminFormData.targetType === 'event'} onChange={() => setAdminFormData({ ...adminFormData, targetType: 'event' })} className="accent-ministry-gold" /><span className="text-sm font-bold">Event</span></label><label className="flex items-center gap-2 p-2 bg-white border rounded cursor-pointer hover:border-ministry-gold transition"><input type="radio" name="type" value="book" checked={adminFormData.targetType === 'book'} onChange={() => setAdminFormData({ ...adminFormData, targetType: 'book' })} className="accent-ministry-gold" /><span className="text-sm font-bold">Book Launch</span></label></div></div>
                                    <div><label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Select Item</label><select className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none bg-white text-sm rounded-sm" onChange={(e) => setAdminFormData({ ...adminFormData, targetId: e.target.value })} required><option value="">-- Choose --</option>{adminFormData.targetType === 'event' ? events.map(e => <option key={e.id} value={e.documentId || e.id}>{e.Title}</option>) : books.map(b => <option key={b.id} value={b.documentId || b.id}>{b.Title}</option>)}</select></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" name="ministerName" placeholder="Full Name" className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm" required value={adminFormData.ministerName} onChange={handleAdminInput} /><input type="text" name="ministerRole" placeholder="Role (e.g. Speaker)" className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm" required value={adminFormData.ministerRole} onChange={handleAdminInput} /></div>
                                    <textarea name="ministerBio" placeholder="Short Bio (Optional)" className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm" rows="3" value={adminFormData.ministerBio} onChange={handleAdminInput}></textarea>
                                    <div><label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Photo</label><input type="file" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-bold file:bg-ministry-blue file:text-white hover:file:bg-ministry-gold transition" onChange={e => setAdminFormData({ ...adminFormData, ministerPhoto: e.target.files[0] })} /></div>
                                    <button className="w-full bg-green-600 text-white py-4 font-bold uppercase tracking-widest hover:bg-green-700 transition shadow-lg mt-2 text-xs md:text-sm rounded-sm">+ Add Team Member</button>
                                </form>
                            </div>
                        )}
                        {adminFormData.activeTab === 'quotes' && (
                            <div className="bg-white p-4 md:p-8 rounded shadow-lg max-w-3xl mx-auto flex flex-col md:flex-row gap-8">
                                <div className="w-full md:w-5/12">
                                    <div className="flex justify-between items-center border-b pb-2 mb-4"><h3 className={`text-lg font-bold uppercase tracking-widest ${editingQuote ? 'text-ministry-gold' : 'text-gray-700'}`}>{editingQuote ? 'Editing Quote' : 'Add Wisdom'}</h3>{editingQuote && (<button type="button" onClick={cancelEditing} className="text-[10px] text-red-500 hover:text-red-700 font-bold uppercase underline">Cancel</button>)}</div>
                                    <form name="quoteForm" onSubmit={editingQuote ? handleUpdateQuote : handleAddQuote} className="space-y-4">
                                        <div><div className="flex justify-between mb-1"><label className="block text-[10px] font-bold uppercase text-gray-400">Quote Text</label><span className={`text-[10px] font-bold ${quoteFormText.split(/\s+/).filter(Boolean).length > 20 ? 'text-red-500' : 'text-ministry-gold'}`}>{quoteFormText.split(/\s+/).filter(Boolean).length} Words</span></div><textarea name="quoteText" placeholder="Enter quote here..." onChange={(e) => setQuoteFormText(e.target.value)} className={`w-full p-3 border focus:border-ministry-gold outline-none text-sm rounded-sm bg-gray-50 ${editingQuote ? 'border-ministry-gold bg-yellow-50' : 'border-gray-300'}`} rows="5" required></textarea></div>
                                        <div><label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Highlight Words</label><input type="text" name="quoteHighlight" placeholder="e.g. Earthly, Eternal" className={`w-full p-3 border focus:border-ministry-gold outline-none text-sm rounded-sm bg-gray-50 ${editingQuote ? 'border-ministry-gold bg-yellow-50' : 'border-gray-300'}`} /><p className="text-[9px] text-gray-400 mt-1">Separate multiple words with commas.</p></div>
                                        <button className={`w-full py-3 font-bold uppercase tracking-widest transition shadow-md text-xs rounded-sm border ${editingQuote ? 'bg-ministry-gold text-[#0B1120] hover:bg-white hover:text-[#0B1120] border-ministry-gold' : 'bg-ministry-blue text-white hover:bg-ministry-gold hover:text-white border-transparent'}`}>{editingQuote ? 'Update Changes' : 'Post Quote'}</button>
                                    </form>
                                </div>
                                <div className="w-full md:w-7/12 border-t md:border-t-0 md:border-l border-gray-200 pt-6 md:pt-0 md:pl-8">
                                    <h3 className="text-lg font-bold mb-4 text-gray-700 uppercase tracking-widest border-b pb-2 flex justify-between items-center"><span>Library</span><span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">{quotes.length} Items</span></h3>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                        {quotes.length === 0 ? (<p className="text-xs text-gray-400 italic text-center py-10 bg-gray-50 rounded">Library is empty.</p>) : (quotes.map((q, i) => { const text = q.Text || q.text || "Untitled"; const highlight = q.Highlight || q.highlight || ""; return (<div key={q.id || i} className={`p-4 rounded border transition relative group ${editingQuote && (editingQuote.id === q.id) ? 'bg-yellow-50 border-ministry-gold shadow-md scale-[1.02]' : 'bg-gray-50 border-gray-200 hover:border-ministry-gold'}`}><p className="text-xs text-gray-700 font-serif leading-relaxed mb-3 pr-8">"{text}"</p>{highlight && (<div className="flex flex-wrap gap-1">{highlight.split(',').map((h, idx) => (<span key={idx} className="text-[9px] uppercase tracking-wider bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded shadow-sm">{h.trim()}</span>))}</div>)}<div className="absolute top-2 right-2 flex gap-1"><button onClick={() => startEditing(q)} className="p-1 text-gray-300 hover:text-ministry-blue transition" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button><button onClick={() => handleDeleteQuote(q)} className="p-1 text-gray-300 hover:text-red-600 transition" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></div>); }))}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* === DEVOTIONALS TAB === */}
                        {adminFormData.activeTab === 'devotionals' && (
                            <div className="bg-white p-4 md:p-8 rounded shadow-lg max-w-2xl mx-auto">
                                <h3 className="text-lg md:text-xl font-bold mb-6 text-gray-700 uppercase tracking-widest border-b pb-2">
                                    Upload Daily Word
                                </h3>
                                
                                <form onSubmit={handlePostDevotional} className="space-y-5">
                                    
                                    {/* Title & Date */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Title</label>
                                            <input name="title" type="text" placeholder="e.g. The Architecture of Faith" required className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Date</label>
                                            <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm uppercase" />
                                        </div>
                                    </div>

                                    {/* Category & Scripture */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Category</label>
                                            <select name="category" className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm bg-white">
                                                <option value="Wisdom">Wisdom</option>
                                                <option value="Warfare">Warfare</option>
                                                <option value="Family">Family</option>
                                                <option value="Ministry">Ministry</option>
                                                <option value="Finance">Finance</option>
                                                <option value="Prophetic">Prophetic</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Scripture Reference</label>
                                            <input name="scripture" type="text" placeholder="e.g. Hebrews 11:1" required className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Bible In One Year</label>
                                            <input name="biblePlan" type="text" placeholder="Gen 1-3, Matt 1" className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm" />
                                        </div>
                                    </div>
                                    {/* The Body */}
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Message Body</label>
                                        <textarea 
                                            name="body" 
                                            rows="8" 
                                            placeholder="Type the devotional content here..." 
                                            required 
                                            className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm leading-relaxed"
                                        ></textarea>
                                        <p className="text-[10px] text-gray-400 mt-1">* Tips: Use double 'Enter' for new paragraphs.</p>
                                    </div>
                                    {/* --- QUIZ SECTION --- */}
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200 mt-4">
                                        <h4 className="text-[10px] font-bold uppercase text-gray-500 mb-3 border-b border-gray-200 pb-1">Engagement (Optional)</h4>
                                        
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Day Number</label>
                                                <input name="bibleDay" type="number" placeholder="e.g. 245" className="w-full p-2 text-sm border border-gray-300 rounded-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Assignment</label>
                                                <input name="assignment" type="text" placeholder="e.g. Call a friend..." className="w-full p-2 text-sm border border-gray-300 rounded-sm" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Quiz Question</label>
                                            <input name="quizQuestion" type="text" placeholder="Question..." className="w-full p-2 text-sm border border-gray-300 rounded-sm mb-2" />
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                                <input name="quizA" type="text" placeholder="Option A" className="p-2 text-sm border border-gray-300 rounded-sm" />
                                                <input name="quizB" type="text" placeholder="Option B" className="p-2 text-sm border border-gray-300 rounded-sm" />
                                                <input name="quizC" type="text" placeholder="Option C" className="p-2 text-sm border border-gray-300 rounded-sm" />
                                            </div>
                                            
                                            <div className="mt-2">
                                                <label className="text-[10px] font-bold uppercase text-gray-400 mr-2">Correct Answer:</label>
                                                <select name="correctOption" className="p-1 border border-gray-300 rounded-sm text-sm">
                                                    <option value="A">Option A</option>
                                                    <option value="B">Option B</option>
                                                    <option value="C">Option C</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div> 
                                    {/* Submit */}
                                    <button className="w-full bg-ministry-blue text-white py-4 font-bold uppercase tracking-widest hover:bg-ministry-gold hover:text-ministry-blue transition shadow-lg text-sm rounded-sm">
                                        Publish Entry
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="w-full overflow-x-hidden font-sans text-gray-800">
            <GlobalStyles />
            {/* NAVBAR */}
            <nav className="fixed w-full z-40 bg-[#0B1120]/95 backdrop-blur-md shadow-lg border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex-shrink-0 cursor-pointer group" onClick={() => scrollToSection('home')}>
                            <div className="relative flex flex-col items-start justify-center">
                                <div className="flex items-center gap-1.5 md:gap-2 px-1.5 py-1 md:px-3 md:py-2 rounded-sm border border-[#BF953F]/50 hover:border-[#BF953F] transition-all duration-500 group-hover:-translate-y-0.5 bg-black/20 relative z-10">
                                    <svg className="h-3 w-3 md:h-5 md:w-5 drop-shadow-sm flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V22M5 9H19" stroke="url(#gold-cross-nav-fixed-mob)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><defs><linearGradient id="gold-cross-nav-fixed-mob" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#BF953F" /><stop offset="50%" stopColor="#FCF6BA" /><stop offset="100%" stopColor="#B38728" /></linearGradient></defs></svg>
                                    <span className="font-serif text-sm md:text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#BF953F] animate-liquid-gold whitespace-nowrap">JesururuJude</span>
                                    <span className="flex items-center justify-center h-3 md:h-5 px-0.5 md:px-1 bg-gradient-to-b from-[#BF953F] to-[#8C6D2E] text-[#0B1120] text-[6px] md:text-[9px] font-bold font-sans tracking-widest rounded-[1px] md:rounded-[2px] shadow-sm ml-0.5 md:ml-1 mt-0.5">.COM</span>
                                </div>
                                <div className="absolute -bottom-4 left-0 w-full text-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0 hidden md:block"><span className="text-[8px] uppercase tracking-[0.3em] font-bold text-ministry-gold/80">Faith & Excellence</span></div>
                            </div>
                        </div>
                        {/* DESKTOP MENU (Grouped Strategy) */}
                        <div className="hidden md:flex items-center gap-8">
                            <div className="flex gap-6 items-center">
                                
                                {/* 1. PRIMARY ITEMS */}
                                {['Home', 'About', 'Events'].map((item) => (
                                    <button 
                                        key={item} 
                                        onClick={() => scrollToSection(item.toLowerCase())} 
                                        className="text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-ministry-gold transition-colors relative group"
                                    >
                                        {item}
                                        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-ministry-gold transition-all duration-300 group-hover:w-full"></span>
                                    </button>
                                ))}

                                {/* 2. THE "RESOURCES" DROPDOWN */}
                                <div className="relative group/dropdown py-4"> {/* Padding ensures hover doesn't break */}
                                    <button className="text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-ministry-gold transition-colors flex items-center gap-1">
                                        Resources
                                        <svg className="w-3 h-3 text-ministry-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </button>

                                    {/* The Dropdown Box */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-48 bg-[#0B1120] border border-white/10 shadow-xl opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all duration-300 transform translate-y-2 group-hover/dropdown:translate-y-0 rounded-sm overflow-hidden z-50">
                                        
                                        {/* Devotionals */}
                                        <button 
                                            onClick={() => scrollToSection('devotionals')} 
                                            className="block w-full text-left px-4 py-3 text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                                        >
                                            Daily Devotionals
                                        </button>

                                        {/* Podcast */}
                                        <button 
                                            onClick={() => scrollToSection('podcast')}
                                            className="block w-full text-left px-4 py-3 text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                                        >
                                            Podcast
                                        </button>

                                        {/* Book Reviews */}
                                        <button 
                                            onClick={() => scrollToSection('books')} // Assuming 'books' section handles reviews
                                            className="block w-full text-left px-4 py-3 text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                                        >
                                            Book Reviews
                                        </button>

                                        {/* Worship */}
                                        <button 
                                            onClick={() => scrollToSection('worship')}
                                            className="block w-full text-left px-4 py-3 text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                        >
                                            Worship
                                        </button>
                                    </div>
                                </div>

                                {/* 3. FILMS (Kept Separate as Major Content) */}
                                <button 
                                    onClick={() => scrollToSection('films')} 
                                    className="text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-ministry-gold transition-colors relative group"
                                >
                                    Films
                                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-ministry-gold transition-all duration-300 group-hover:w-full"></span>
                                </button>

                            </div>

                            <div className="h-4 w-[1px] bg-white/20"></div>
                            {/* ... Keep your Social Icons & Invite Button here ... */}
                            <div className="flex items-center gap-4">
                                {/* (Paste your social icons back here) */}
                                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-ministry-gold transition-colors"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
                                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-red-600 transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg></a>
                            </div>
                            {currentUser ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-300 text-xs font-bold uppercase tracking-widest hidden md:block">
                                        Hi, {currentUser.username}
                                    </span>
                                    <button 
                                        onClick={handleLogout}
                                        className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 hover:border-red-600 transition"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); }}
                                    className="bg-ministry-gold text-[#0B1120] px-5 py-2.5 rounded-sm font-bold uppercase text-[10px] tracking-widest hover:bg-white transition"
                                >
                                    Member Login
                                </button>
                            )}
                        </div>
                        <div className="md:hidden flex items-center"><button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-ministry-gold hover:text-white focus:outline-none"><svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">{mobileMenuOpen ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />)}</svg></button></div>
                    </div>
                </div>
                {/* MOBILE MENU DROPDOWN */}
                {mobileMenuOpen && (
                    <div className="md:hidden bg-[#0B1120] border-t border-white/10 absolute w-full shadow-2xl max-h-[80vh] overflow-y-auto">
                        <div className="px-4 pt-4 pb-6 space-y-4 flex flex-col items-center">
                        
                        {/* Primary Links */}
                        {['Home', 'About', 'Events'].map((item) => (
                            <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="text-sm font-bold text-gray-300 hover:text-ministry-gold uppercase tracking-widest">{item}</button>
                        ))}

                        {/* Grouped Section Divider */}
                        <div className="w-full border-t border-white/10 my-2"></div>
                        <span className="text-[10px] text-ministry-gold uppercase tracking-[0.2em] font-bold">Resources</span>
                        
                        {/* Sub-Items */}
                        <button onClick={() => scrollToSection('devotionals')} className="text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest">Devotionals</button>
                        <button onClick={() => scrollToSection('podcast')} className="text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest">Podcast</button>
                        <button onClick={() => scrollToSection('books')} className="text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest">Book Reviews</button>
                        <button onClick={() => scrollToSection('worship')} className="text-sm font-bold text-gray-400 hover:text-white uppercase tracking-widest">Worship</button>
                        
                        {/* Divider */}
                        <div className="w-full border-t border-white/10 my-2"></div>
                        <button onClick={() => scrollToSection('films')} className="text-sm font-bold text-gray-300 hover:text-ministry-gold uppercase tracking-widest">Films</button>

                        {/* Socials & Invite */}
                        <div className="flex gap-6 py-4">
                            <a href="#" className="text-gray-400 hover:text-ministry-gold"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
                            <a href="#" className="text-gray-400 hover:text-red-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg></a>
                        </div>
                        {/* === MOBILE AUTH SECTION === */}
                            {currentUser ? (
                                // IF LOGGED IN: Show Name + Logout
                                <div className="w-full pt-4 border-t border-white/10 mt-2 flex flex-col gap-3">
                                    <div className="text-center">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Signed in as</span>
                                        <p className="text-sm text-white font-bold font-serif">{currentUser.username}</p>
                                    </div>
                                    
                                    <button 
                                        onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                                        className="w-full py-3 border border-red-900/50 text-red-500 font-bold uppercase text-xs tracking-widest hover:bg-red-600 hover:text-white transition rounded-sm"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                // IF LOGGED OUT: Show Login Button
                                <button 
                                    onClick={() => { setAuthMode('login'); setShowAuthModal(true); setMobileMenuOpen(false); }} 
                                    className="w-full mt-2 bg-ministry-gold text-[#0B1120] py-3 font-bold uppercase text-xs tracking-widest hover:bg-white transition rounded-sm shadow-[0_0_15px_rgba(191,149,63,0.2)]"
                                >
                                    Member Login
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* HERO SECTION */}
            <header id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-12 bg-black">
                <div className="absolute inset-0 z-0 grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-0 pointer-events-none">
                    <div className="relative hidden md:block h-full overflow-hidden border-r border-white/10">{heroImages.map((img, index) => (<div key={index} className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${index === heroIndex1 ? 'opacity-80 scale-110' : 'opacity-0 scale-100'}`}><img src={img} alt="" className="w-full h-full object-cover grayscale contrast-125" /></div>))}<div className="absolute inset-0 bg-black/50"></div></div>
                    <div className="relative h-full overflow-hidden">{heroImages.map((img, index) => (<div key={index} className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${index === heroIndex2 ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}><img src={img} alt="" className="w-full h-full object-cover grayscale contrast-110" /></div>))}<div className="absolute inset-0 bg-black/30"></div></div>
                    <div className="relative hidden md:block h-full overflow-hidden border-l border-white/10">{heroImages.map((img, index) => (<div key={index} className={`absolute inset-0 transition-all duration-[2000ms] ease-in-out ${index === heroIndex3 ? 'opacity-80 scale-110' : 'opacity-0 scale-100'}`}><img src={img} alt="" className="w-full h-full object-cover grayscale contrast-125" /></div>))}<div className="absolute inset-0 bg-black/50"></div></div>
                </div>

                <div className="relative z-30 w-full max-w-4xl mx-auto px-4 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-3 border-b border-ministry-gold/60 pb-3 mb-6 animate-fade-in-up">
                        <span className="text-ministry-gold font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs drop-shadow-md">Official Ministry Portfolio</span>
                        <span className="h-1 w-1 rounded-full bg-ministry-gold shadow-sm"></span>
                        <span className="text-gray-300 font-serif italic text-xs drop-shadow-md">Est. 2020</span>
                    </div>
                    <h1 className="text-5xl md:text-8xl font-serif font-bold text-white leading-[0.9] mb-6 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] animate-fade-in-up delay-100">Jude <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] drop-shadow-sm">Jesururu</span></h1>
                    <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-[10px] md:text-sm font-bold uppercase tracking-widest text-gray-300 mb-8 animate-fade-in-up delay-200 drop-shadow-md"><span>Author</span><span className="text-ministry-gold">•</span><span>Filmmaker</span><span className="text-ministry-gold">•</span><span>Psalmist</span><span className="text-ministry-gold">•</span><span>Speaker</span></div>
                    <p className="text-sm md:text-xl text-white mb-8 max-w-xl leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] font-bold animate-fade-in-up delay-300 tracking-wide">"My mandate is simple: To bridge the gap between <span className="text-[#F3C657] font-black uppercase">Faith</span> and <span className="text-[#F3C657] font-black uppercase">Excellence</span> through creative expression and Kingdom truths."</p>
                    <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300 w-full sm:w-auto mb-12">
                        <button onClick={() => setShowModal(true)} className="bg-ministry-gold text-ministry-blue px-8 py-4 font-bold tracking-widest uppercase hover:bg-white hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(191,149,63,0.4)] rounded-sm text-xs border border-ministry-gold">Invite Jude</button>
                        <button onClick={() => scrollToSection('books')} className="border border-white/40 bg-black/20 text-white px-8 py-4 font-bold tracking-widest uppercase hover:bg-white hover:text-ministry-blue transition-all duration-300 rounded-sm text-xs backdrop-blur-sm">View Resources</button>
                    </div>
                    <div className="w-full max-w-md bg-black/40 backdrop-blur-md border border-white/20 p-4 rounded-sm shadow-2xl relative group hover:border-ministry-gold/50 transition-colors animate-fade-in-up delay-500">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-ministry-gold text-[#0B1120] text-[10px] font-bold px-3 py-1 uppercase tracking-widest shadow-lg">Latest Release</div>
                        {books.length > 0 ? (<div className="flex gap-4 items-center text-left"><div className="w-14 h-20 bg-gray-800 flex-shrink-0 shadow-lg border border-white/10">{books[0].CoverArt ? <img src={getImageUrl(books[0].CoverArt)} className="w-full h-full object-cover" alt="Cover" /> : <div className="w-full h-full bg-gray-700"></div>}</div><div className="flex-1"><h4 className="text-white font-serif font-bold text-base leading-tight mb-1 line-clamp-1 drop-shadow-md">{books[0].Title}</h4><p className="text-gray-300 text-[10px] line-clamp-2 mb-2">{getSynopsisText(books[0].Synopsis)}</p><button onClick={() => scrollToSection('books')} className="text-ministry-gold text-[9px] font-bold uppercase tracking-widest border-b border-ministry-gold/50 pb-0.5 hover:text-white hover:border-white transition-colors">Get Copy →</button></div></div>) : (<div className="text-white text-xs py-2 text-center opacity-50">Loading resources...</div>)}
                    </div>
                </div>
                <div className="absolute bottom-4 left-0 w-full text-center z-30 px-4 animate-fade-in-up delay-700 hidden md:block"><p className="text-xs text-white/60 font-serif italic drop-shadow-md">"But by the grace of God I am what I am." — <span className="text-ministry-gold/80 not-italic font-bold">1 Corinthians 15:10</span></p></div>
            </header>

            {/* QUOTE SECTION */}
            <section className="py-24 bg-[#0B1120] flex items-center justify-center relative overflow-hidden border-b border-white/5">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-ministry-gold/5 blur-[100px] rounded-full"></div>
                <div className="relative z-10 max-w-5xl mx-auto px-6 text-center w-full">
                    <div className="mb-8 flex justify-center opacity-50"><svg className="h-6 w-6 text-ministry-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg></div>
                    <div className="min-h-[160px] md:min-h-[200px] flex items-center justify-center transition-all duration-1000">
                        {quotes.map((quote, index) => {
                            const quoteText = quote.Text || quote.text || "No text available"; const quoteHighlight = quote.Highlight || quote.highlight || "";
                            return (
                                <div key={index} className={`absolute w-full max-w-4xl transition-all duration-1000 ease-in-out transform px-4 ${index === currentQuoteIndex ? 'opacity-100 translate-y-0 scale-100 blur-0' : 'opacity-0 translate-y-4 scale-95 blur-sm pointer-events-none'}`}>
                                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold leading-tight text-gray-400">"{quoteText.split(' ').map((word, i) => { const cleanWord = word.replace(/[.,!?;:"]/g, ''); const highlights = quoteHighlight.split(',').map(h => h.trim().toLowerCase()); const isHighlight = highlights.includes(cleanWord.toLowerCase()); return (<span key={i} className={isHighlight ? "text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] italic" : ""}>{word}{' '}</span>); })}"</h2>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-12 flex flex-col items-center gap-6"><div className="h-8 w-[1px] bg-gradient-to-b from-ministry-gold to-transparent opacity-30"></div><div className="flex gap-3">{quotes.map((_, idx) => (<button key={idx} onClick={() => setCurrentQuoteIndex(idx)} className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentQuoteIndex ? 'w-8 bg-ministry-gold' : 'w-1.5 bg-gray-700 hover:bg-gray-500'}`} />))}</div><span className="text-[10px] uppercase tracking-[0.4em] text-ministry-gold/40 font-sans font-bold mt-2">Jude Jesururu</span></div>
                </div>
            </section>

            {/* VIDEO SECTION */}
            <section className="py-24 bg-[#050505] border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-ministry-gold/5 to-transparent pointer-events-none"></div>
                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b border-white/10 pb-4">
                        <div><span className="text-ministry-gold font-bold tracking-[0.3em] uppercase text-[10px] block mb-2">Latest Messages</span><h2 className="text-2xl md:text-3xl font-serif font-bold text-white">Kingdom <span className="text-ministry-gold">Insights</span></h2></div>
                        <div className="text-xs text-gray-500 font-mono mt-4 md:mt-0">Playing: {currentVideoIndex + 1} / {videoPlaylist.length}</div>
                    </div>
                    {videoPlaylist.length > 0 && (
                        <>
                            <div className="relative w-full h-[300px] md:h-[500px] bg-black border border-white/10 rounded-sm shadow-2xl overflow-hidden mb-8 group">
                                {!isVideoPlaying && (
                                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
                                        <img src={videoPlaylist[currentVideoIndex]?.thumbnail} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-50 transition-all duration-700 group-hover:scale-105" />
                                        <button onClick={() => setIsVideoPlaying(true)} className="relative z-30 w-20 h-20 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-ministry-gold hover:text-black hover:scale-110 transition-all duration-300 group-hover:border-ministry-gold"><svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></button>
                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/60 to-transparent p-6 text-left"><h3 className="text-xl md:text-3xl font-bold text-white mb-2 font-serif">{videoPlaylist[currentVideoIndex]?.title}</h3><p className="text-gray-300 text-sm max-w-lg line-clamp-1">{videoPlaylist[currentVideoIndex]?.desc}</p></div>
                                    </div>
                                )}
                            </div>
                            <div className="relative group/slider">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">Up Next</h3>
                                <div onMouseEnter={() => startVideoScrolling('left')} onMouseLeave={stopVideoScrolling} className="absolute left-0 top-[60%] -translate-y-1/2 z-30 w-16 h-full bg-gradient-to-r from-black via-black/90 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 cursor-pointer"><svg className="w-8 h-8 text-white drop-shadow-lg scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></div>
                                <div ref={videoPlaylistRef} className="flex gap-4 overflow-x-auto pb-4 relative z-10" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                    <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                                    {videoPlaylist.map((video, index) => {
                                        const isActive = currentVideoIndex === index;
                                        return (
                                            <button key={video.id} onClick={() => changeVideo(index)} className={`group relative flex-shrink-0 w-[240px] md:w-[280px] snap-start text-left transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                                                <div className={`relative aspect-video rounded-sm overflow-hidden mb-3 border transition-all duration-300 ${isActive ? 'border-ministry-gold ring-1 ring-ministry-gold/50' : 'border-white/10 group-hover:border-white/30'}`}><img src={video.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={video.title} /><div className="absolute bottom-1.5 right-1.5 bg-black/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] tracking-wide shadow-md">{video.duration}</div>{isActive && <div className="absolute bottom-0 left-0 h-[2px] bg-red-600 w-full"></div>}</div>
                                                <h4 className={`text-sm font-bold leading-tight mb-1 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{video.title}</h4>
                                                <p className="text-[10px] text-gray-500 line-clamp-2 font-serif italic">{video.desc}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div onMouseEnter={() => startVideoScrolling('right')} onMouseLeave={stopVideoScrolling} className="absolute right-0 top-[60%] -translate-y-1/2 z-30 w-16 h-full bg-gradient-to-l from-black via-black/90 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300 cursor-pointer"><svg className="w-8 h-8 text-white drop-shadow-lg scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg></div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* EVENTS SECTION */}
            {(upcomingEvents.length > 0 || pastEvents.length > 0) && (
                <section id="events" className="py-20 bg-gray-50 border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {upcomingEvents.length > 0 && (
                            <div className="mb-16">
                                <div className="flex items-end justify-between mb-8"><div><span className="text-ministry-gold font-bold uppercase tracking-widest text-xs">Mark Your Calendar</span><h2 className="text-4xl font-serif font-bold text-ministry-blue">Upcoming Events</h2></div></div>
                                <div className="space-y-6">
                                    {upcomingEvents.map((event) => {
                                        const thisEventCount = allRegistrations.filter(r => r.eventTitle === event.Title).length;
                                        return (<EventTicket key={event.id} event={event} isPast={false} attendeeCount={thisEventCount} onOpenEvent={handleEventClick} onOpenGuestList={(title) => { setViewingGuestsFor(title); setGuestListModalOpen(true); }} onOpenTeam={(evt) => { setSelectedEvent(evt); setTeamModalOpen(true); }} />);
                                    })}
                                </div>
                            </div>
                        )}
                        {pastEvents.length > 0 && (<div><div className="mb-8 border-b border-gray-200 pb-2"><h2 className="text-xl font-serif font-bold text-gray-400">Past Ministry Events</h2></div><div className="space-y-6 opacity-75 hover:opacity-100 transition-opacity">{pastEvents.map((event) => <EventTicket key={event.id} event={event} isPast={true} />)}</div></div>)}
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
                    <div className="text-center mb-12"><h2 className="text-4xl font-serif font-bold text-ministry-blue mb-4">Books & Resources</h2><div className="w-20 h-1 bg-ministry-gold mx-auto"></div></div>
                    <button onMouseEnter={() => startScrolling('left')} onMouseLeave={stopScrolling} onClick={() => { if (bookScrollRef.current) bookScrollRef.current.scrollLeft -= 300; }} className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-50 w-12 h-12 items-center justify-center bg-white shadow-2xl rounded-full text-ministry-blue border-2 border-ministry-gold cursor-pointer hover:scale-110 active:scale-95 transition-all">←</button>
                    <button onMouseEnter={() => startScrolling('right')} onMouseLeave={stopScrolling} onClick={() => { if (bookScrollRef.current) bookScrollRef.current.scrollLeft += 300; }} className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-50 w-12 h-12 items-center justify-center bg-white shadow-2xl rounded-full text-ministry-blue border-2 border-ministry-gold cursor-pointer hover:scale-110 active:scale-95 transition-all">→</button>
                    <div ref={bookScrollRef} className="flex flex-col md:flex-row gap-8 overflow-x-auto pb-10 px-4 scrollbar-hide" style={{ scrollBehavior: 'auto' }}>
                        {books.map((book) => (<div key={book.id} className="w-full md:w-[350px] flex-shrink-0"><BookCard key={book.id} book={book} userCurrency={userCurrency} onPreorder={() => handlePreorderClick(book)} onPurchase={() => handlePurchaseClick(book)} /></div>))}
                    </div>
                </div>
            </section>

            {/* ========================================= */}
            {/* DAILY DEVOTIONALS (Sidebar Interface)     */}
            {/* ========================================= */}
            <section id="devotionals" className="py-24 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="text-center mb-16">
                    <span className="text-ministry-gold font-bold uppercase tracking-widest text-xs block mb-2">Spiritual Growth</span>
                    <h2 className="text-4xl font-serif font-bold text-ministry-blue mb-4">Daily Devotionals</h2>
                    <div className="w-20 h-1 bg-ministry-gold mx-auto"></div>
                </div>

                {/* THE INTERFACE */}
                <div className="flex flex-col lg:flex-row bg-gray-50 rounded-sm border border-gray-200 overflow-hidden shadow-xl min-h-[600px]">
                    
                    {/* 1. SIDEBAR (List) */}
                    <div className="lg:w-4/12 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Recent Entries</h3>
                        </div>
                        
                        <div className="overflow-y-auto h-[300px] lg:h-auto custom-scrollbar">
                            {devotionals.length > 0 ? (
                                devotionals.map((item, index) => (
                                    <button 
                                        key={item.id}
                                        onClick={() => setActiveDevoIndex(index)}
                                        className={`w-full text-left p-6 border-b border-gray-100 transition-all duration-300 group relative ${activeDevoIndex === index ? 'bg-ministry-blue' : 'hover:bg-gray-50'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${activeDevoIndex === index ? 'text-ministry-gold' : 'text-gray-400 group-hover:text-ministry-blue'}`}>
                                                {/* Format Date nicely (e.g., Oct 24) */}
                                                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {item.category}
                                            </span>
                                            {activeDevoIndex === index && <span className="text-ministry-gold text-xs">●</span>}
                                        </div>
                                        <h4 className={`text-base font-serif font-bold leading-tight ${activeDevoIndex === index ? 'text-white' : 'text-gray-800'}`}>{item.title}</h4>
                                    </button>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400 italic text-xs">No devotionals uploaded yet.</div>
                            )}
                        </div>
                        
                        {/* Sidebar Footer */}
                        <div className="mt-auto p-6 bg-gray-50 border-t border-gray-200">
                            <button onClick={() => setShowSubscribeModal(true)} className="w-full py-3 border border-ministry-blue text-ministry-blue text-xs font-bold uppercase tracking-widest hover:bg-ministry-blue hover:text-white transition rounded-sm">Subscribe to Daily List</button>
                        </div>
                    </div>

                    {/* 2. READING PANE (Content) */}
                    <div className="lg:w-8/12 bg-white relative">
                        {devotionals.length > 0 && devotionals[activeDevoIndex] ? (
                            <div className="h-full flex flex-col p-8 md:p-16 overflow-y-auto custom-scrollbar animate-fade-in">
                                <span className="text-ministry-gold text-xs font-bold uppercase tracking-widest mb-4 block">
                                    {new Date(devotionals[activeDevoIndex].date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                                <h3 className="text-3xl md:text-4xl font-serif font-bold text-ministry-blue mb-6">{devotionals[activeDevoIndex].title}</h3>
                                
                                <div className="w-12 h-1 bg-gray-100 mb-8"></div>
                                
                                {/* Scripture Box */}
                                {devotionals[activeDevoIndex].verse && (
                                    <div className="bg-gray-50 border-l-4 border-ministry-gold p-6 mb-8 italic text-gray-600 font-serif">
                                        "{devotionals[activeDevoIndex].verse}"
                                    </div>
                                )}
                                {/* The Main Content */}
                                <div className="prose prose-lg text-gray-600 leading-relaxed whitespace-pre-line mb-12 font-serif">
                                    {devotionals[activeDevoIndex].text}
                                </div>
                                {/* ================================================= */}
                                {/* === DISCIPLESHIP ENGAGEMENT ZONE              === */}
                                {/* ================================================= */}
                                <div className="mt-12 space-y-8">

                                    {/* 1. BIBLE READING PLAN (Updated with Day Count) */}
                                    {devotionals[activeDevoIndex].biblePlan && (
                                        <div className="bg-[#0B1120] rounded-sm overflow-hidden shadow-lg border border-gray-800">
                                            <div className="bg-ministry-gold p-2 text-center">
                                                <span className="text-ministry-blue font-bold uppercase text-[10px] tracking-widest">
                                                    Bible In One Year • Day {devotionals[activeDevoIndex].bibleDay || '---'}
                                                </span>
                                            </div>
                                            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center gap-3 text-white">
                                                    <span className="text-2xl">📖</span>
                                                    <span className="font-serif text-lg md:text-xl tracking-wide">
                                                        {devotionals[activeDevoIndex].biblePlan}
                                                    </span>
                                                </div>
                                                <a 
                                                    href={`https://www.biblegateway.com/passage/?search=${devotionals[activeDevoIndex].biblePlan}&version=NKJV`} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="px-6 py-2 border border-white/20 hover:bg-white hover:text-[#0B1120] text-white text-xs font-bold uppercase tracking-widest transition rounded-sm"
                                                >
                                                    Read Now
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                
                                        {/* 2. ASSIGNMENT / CHALLENGE CARD */}
                                        {devotionals[activeDevoIndex].assignment && (
                                            <div className="bg-orange-50 border border-orange-100 p-6 rounded-sm relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 text-orange-500 text-6xl font-serif font-bold">!</div>
                                                <span className="text-orange-600 text-[10px] font-bold uppercase tracking-widest block mb-2">Today's Assignment</span>
                                                <h4 className="text-gray-800 font-bold font-serif text-lg mb-2">Faith in Action</h4>
                                                <p className="text-gray-600 text-sm leading-relaxed relative z-10">
                                                    {devotionals[activeDevoIndex].assignment}
                                                </p>
                                                <button 
                                                    onClick={() => window.open(`https://wa.me/?text=My assignment for today: ${devotionals[activeDevoIndex].assignment}`, '_blank')}
                                                    className="mt-4 text-[10px] font-bold uppercase text-orange-600 border-b border-orange-200 hover:text-orange-800 transition"
                                                >
                                                    Share Progress
                                                </button>
                                            </div>
                                        )}

                                        {/* 3. INTERACTIVE QUIZ CARD */}
                                        {devotionals[activeDevoIndex].quiz.question && (
                                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-sm">
                                                <span className="text-ministry-blue text-[10px] font-bold uppercase tracking-widest block mb-2">Quick Check</span>
                                                <h4 className="text-gray-800 font-bold text-sm mb-4">
                                                    {devotionals[activeDevoIndex].quiz.question}
                                                </h4>

                                                <div className="space-y-2">
                                                    {['A', 'B', 'C'].map((opt, idx) => {
                                                        const optionText = devotionals[activeDevoIndex].quiz.options[idx];
                                                        if (!optionText) return null;

                                                        let btnClass = "w-full text-left p-3 text-xs border rounded-sm transition flex justify-between items-center ";
                                                                
                                                        // Logic for styling based on answer status
                                                        if (quizStatus === 'idle') {
                                                            btnClass += quizSelected === opt ? "bg-ministry-blue text-white border-ministry-blue" : "bg-white border-gray-200 hover:border-ministry-blue text-gray-600";
                                                        } else if (quizStatus === 'correct' && opt === devotionals[activeDevoIndex].quiz.correct) {
                                                            btnClass += "bg-green-600 text-white border-green-600";
                                                        } else if (quizStatus === 'wrong' && quizSelected === opt) {
                                                            btnClass += "bg-red-500 text-white border-red-500";
                                                        } else {
                                                            btnClass += "bg-gray-100 text-gray-400 border-gray-100"; // Dim others
                                                        }

                                                        return (
                                                            <button 
                                                                key={opt}
                                                                disabled={quizStatus !== 'idle'}
                                                                onClick={() => {
                                                                    setQuizSelected(opt);
                                                                    if(opt === devotionals[activeDevoIndex].quiz.correct) {
                                                                        setQuizStatus('correct');
                                                                    } else {
                                                                        setQuizStatus('wrong');
                                                                        setTimeout(() => setQuizStatus('idle'), 1500); // Reset after 1.5s if wrong
                                                                    }
                                                                }}
                                                                className={btnClass}
                                                            >
                                                                <span>{optionText}</span>
                                                                {quizStatus === 'correct' && opt === devotionals[activeDevoIndex].quiz.correct && <span>✅</span>}
                                                                {quizStatus === 'wrong' && quizSelected === opt && <span>❌</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {quizStatus === 'correct' && (
                                                    <p className="text-green-600 text-[10px] font-bold uppercase mt-3 animate-pulse">That's Correct! Well done.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                            
                                    {/* 4. SHARE INSIGHT (Working Form) */}
                                    <div className="pt-6 border-t border-gray-100">
                                        <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest">
                                            Have a question or insight? Send it to Jude.
                                        </p>
                                        <form 
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                handleSendInsight(e.target.elements.insight.value);
                                                e.target.reset(); // Clear box after sending
                                            }} 
                                            className="flex gap-2"
                                        >
                                            <input 
                                                name="insight"
                                                type="text" 
                                                required
                                                placeholder="What did you learn today?" 
                                                className="flex-1 bg-gray-50 border border-gray-200 p-3 text-sm rounded-sm focus:border-ministry-gold outline-none" 
                                            />
                                            <button 
                                                type="submit"
                                                className="bg-ministry-blue text-white px-6 text-xs font-bold uppercase tracking-widest rounded-sm hover:bg-ministry-gold hover:text-ministry-blue transition"
                                            >
                                                Send
                                            </button>
                                        </form>
                                    </div>

                                </div>
                                {/* Action Area (Share & Copy) */}
                                <div className="mt-auto pt-8 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex gap-4">
                                        
                                        {/* Copy Link Button */}
                                        <button 
                                            onClick={() => handleShareDevotional(devotionals[activeDevoIndex])}
                                            className="text-gray-400 hover:text-ministry-blue transition group relative" 
                                            title="Copy Link"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">Copy Link</span>
                                        </button>
                                        
                                        {/* WhatsApp Button (New) */}
                                        <button 
                                            onClick={() => handleWhatsAppShare(devotionals[activeDevoIndex])}
                                            className="text-gray-400 hover:text-[#25D366] transition group relative" 
                                            title="Share to WhatsApp"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#25D366] text-white text-[9px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">Share on WhatsApp</span>
                                        </button>
                                    </div>

                                    <button 
                                        onClick={() => handleShareDevotional(devotionals[activeDevoIndex])}
                                        className="text-xs text-gray-300 font-bold uppercase tracking-widest hover:text-ministry-gold transition"
                                    >
                                        Share Entry
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-300 flex-col">
                                <span className="text-4xl mb-4">📖</span>
                                <p className="text-sm font-bold uppercase tracking-widest">Select an entry to read</p>
                            </div>
                        )}
                    </div>
                </div>
                </div>
            </section>

            {/* ========================================= */}
            {/* PODCAST SECTION                           */}
            {/* ========================================= */}
            <section id="podcast" className="py-24 bg-[#0B1120] relative overflow-hidden">
                {/* Background Accent */}
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-ministry-blue/50 to-transparent pointer-events-none"></div>
                
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-12 md:gap-20">
                    
                    {/* Left: Visual / Cover Art */}
                    <div className="w-full md:w-1/2 relative group">
                    <div className="absolute inset-0 bg-ministry-gold/20 blur-2xl rounded-full transform group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative aspect-square bg-gray-800 rounded-sm border border-white/10 shadow-2xl overflow-hidden flex items-center justify-center">
                        {/* Replace this div with your Podcast Cover Image later */}
                        <div className="text-center">
                            <span className="text-6xl mb-4 block">🎙️</span>
                            <h3 className="text-white font-serif font-bold text-2xl">The Jude Jesururu<br/><span className="text-ministry-gold">Podcast</span></h3>
                        </div>
                    </div>
                    
                    {/* Floating Badge */}
                    <div className="absolute -bottom-6 -right-6 bg-ministry-gold text-ministry-blue p-6 rounded-full shadow-lg hidden md:block animate-bounce-slow">
                        <span className="block text-2xl font-black">New</span>
                        <span className="block text-[10px] font-bold uppercase tracking-widest">Episode</span>
                    </div>
                    </div>

                    {/* Right: Content & List */}
                    <div className="w-full md:w-1/2 text-left">
                    <span className="text-ministry-gold font-bold uppercase tracking-[0.2em] text-xs block mb-4">Now Streaming</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">Conversations on <br/>Faith & Culture</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8">
                        Deep dives into theology, creativity, and navigating modern life with a Kingdom mindset. Join Jude and special guests every Friday.
                    </p>

                    {/* Episode List (Static for now) */}
                    <div className="space-y-4 mb-10">
                        {[1, 2, 3].map((ep) => (
                        <div key={ep} className="flex items-center gap-4 p-4 rounded-sm border border-white/5 hover:bg-white/5 hover:border-ministry-gold/30 transition cursor-pointer group">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-ministry-gold group-hover:bg-ministry-gold group-hover:text-ministry-blue transition">▶</div>
                            <div>
                            <h4 className="text-white font-bold text-sm">Episode {ep}: defining Excellence in Ministry</h4>
                            <span className="text-xs text-gray-500">24 mins • Audio</span>
                            </div>
                        </div>
                        ))}
                    </div>

                    {/* Links */}
                    <div className="flex gap-4">
                        <button className="px-6 py-3 border border-white/20 text-white font-bold uppercase text-xs tracking-widest hover:bg-white hover:text-ministry-blue transition rounded-sm">Apple Podcasts</button>
                        <button className="px-6 py-3 bg-[#1DB954] text-white font-bold uppercase text-xs tracking-widest hover:bg-[#1ed760] transition rounded-sm border-none">Spotify</button>
                    </div>
                    </div>

                </div>
                </div>
            </section>
            
            {/* FILMS SECTION */}
            <section id="films" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16"><h2 className="text-4xl font-serif font-bold text-ministry-blue mb-4">Films & Scripts</h2><div className="w-20 h-1 bg-ministry-gold mx-auto"></div></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {movies.map((movie) => (<div key={movie.id} className="bg-white shadow-lg rounded-sm overflow-hidden flex flex-col md:flex-row border border-gray-100"><div className="md:w-1/2 h-64 md:h-auto overflow-hidden">{movie.Poster && <img src={getImageUrl(movie.Poster)} alt={movie.Title} className="w-full h-full object-cover" />}</div><div className="p-8 md:w-1/2 flex flex-col justify-center"><span className="text-xs font-bold text-ministry-gold uppercase tracking-widest mb-2">{movie.Category}</span><h3 className="text-2xl font-serif font-bold text-ministry-blue mb-6">{movie.Title}</h3><a href={movie.VideoLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-200 text-sm font-bold uppercase tracking-wider hover:border-ministry-blue hover:text-ministry-blue transition text-gray-600">Watch Trailer</a></div></div>))}
                    </div>
                </div>
            </section>

            {/* WORSHIP SECTION */}
            <section id="worship" className="py-24 bg-ministry-blue text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16"><h2 className="text-4xl font-serif font-bold text-white mb-4">Worship Moments</h2><div className="w-20 h-1 bg-ministry-gold mx-auto"></div></div>
                    <div className="space-y-4">
                        {songs.map((song) => (
                            <div key={song.id} onClick={() => setCurrentSong(song)} className="group flex items-center p-6 bg-white/5 border border-white/10 hover:bg-ministry-gold hover:border-ministry-gold hover:text-ministry-blue cursor-pointer transition duration-300 rounded-sm">
                                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-ministry-gold text-ministry-blue group-hover:bg-ministry-blue group-hover:text-white transition">▶</div>
                                <div className="ml-6 flex-1"><h4 className="text-lg font-bold">{song.Title}</h4><p className="text-sm opacity-70 group-hover:opacity-100">Jude Jesururu</p></div>
                                <div className="text-xs font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">Listen</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* BANNER GENERATOR SECTION */}
            {(() => {
                const realEvent = upcomingEvents[0];
                const demoEvent = { Title: "Eternal Perspective to Earthly Realities", Category: "Live Ministry", EventDateTime: "Oct 12, 2:00 PM WAT", Venue: "Eko Hotel Convention Centre, VI", Poster: null };
                const targetEvent = realEvent || demoEvent;
                return (
                    <section id="banner-mockup" className="py-10 md:py-20 bg-gray-100 overflow-hidden relative">
                        <div className="max-w-7xl mx-auto px-4 text-center mb-6">
                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-2"><h2 className="text-lg md:text-2xl font-bold text-gray-400 uppercase tracking-widest">Red Carpet Banner Preview</h2><button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-ministry-blue text-white px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest hover:bg-ministry-gold hover:text-ministry-blue transition shadow-lg border border-white/10"><span>⬇️</span> Download Design</button></div>
                            <p className="text-xs text-gray-500">{realEvent ? `Generating for: ${realEvent.Title}` : "Preview Mode (Demo Data)"}</p>
                        </div>
                        <div id="banner-to-print" className="mx-auto w-full max-w-[1200px] md:aspect-[2/1] relative rounded-sm overflow-hidden shadow-2xl flex flex-col md:flex-row bg-[#0B1120]">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div><div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/80 via-black/40 to-transparent z-0"></div>
                            <div className="relative z-10 w-full md:w-5/12 h-auto md:h-full flex items-center justify-center p-8 md:p-12 order-1"><div className="relative w-[200px] md:w-auto h-auto md:h-[85%] aspect-[3/4] rounded-sm shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] border-2 border-ministry-gold/40 bg-gray-900 flex items-center justify-center overflow-hidden">{targetEvent.Poster ? (<img src={getImageUrl(targetEvent.Poster)} alt="Poster" className="w-full h-full object-cover" crossOrigin="anonymous" />) : (<div className="text-center p-4"><span className="text-4xl block mb-2 opacity-50">🖼️</span><span className="text-[10px] uppercase tracking-widest text-white/50">Poster Area</span></div>)}<div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest shadow-lg">{targetEvent.Category || 'Live'}</div></div></div>
                            <div className="relative z-10 w-full md:w-7/12 h-auto md:h-full flex flex-col justify-center px-6 pb-12 md:p-0 md:pr-16 text-left order-2">
                                <div className="mb-6 md:mb-8 border-b border-ministry-gold/20 pb-4"><div className="inline-flex items-center gap-2"><svg className="h-5 w-5 md:h-6 md:w-6 drop-shadow-sm flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2V22M5 9H19" stroke="url(#gold-banner-mobile)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><defs><linearGradient id="gold-banner-mobile" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#BF953F" /><stop offset="50%" stopColor="#FCF6BA" /><stop offset="100%" stopColor="#B38728" /></linearGradient></defs></svg><span className="font-serif text-base md:text-xl font-bold text-gray-300 tracking-wide">JesururuJude.com</span></div></div>
                                <div className="mb-8"><h3 className="text-ministry-gold font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs mb-2">The Official Gathering</h3><h1 className="text-3xl md:text-5xl lg:text-7xl font-serif font-black leading-[1.1] md:leading-[0.95] text-transparent bg-clip-text bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] drop-shadow-sm">{targetEvent.Title}</h1></div>
                                <div className="grid grid-cols-1 gap-6 text-gray-300"><div className="flex items-center gap-4"><div className="w-10 h-10 md:w-12 md:h-12 rounded-sm bg-white/5 border border-white/10 flex flex-col items-center justify-center text-ministry-gold shrink-0"><span className="text-lg md:text-xl">📅</span></div><div><p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Date & Time</p><p className="text-base md:text-xl font-bold text-white tracking-wide">{targetEvent.EventDateTime}</p></div></div><div className="flex items-center gap-4"><div className="w-10 h-10 md:w-12 md:h-12 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center text-ministry-gold text-lg md:text-xl shrink-0">📍</div><div><p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Venue</p><p className="text-sm md:text-lg font-bold text-white leading-tight max-w-xs md:max-w-md">{targetEvent.Venue}</p></div></div></div>
                                <div className="mt-8 pt-4 border-t border-white/10"><p className="text-[10px] md:text-xs text-ministry-gold/60 uppercase tracking-[0.3em] font-medium">Bridging Faith & Excellence</p></div>
                            </div>
                        </div>
                    </section>
                );
            })()}

            {/* FOOTER */}
            <footer className="bg-ministry-blue text-white py-12 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h3 className="font-serif text-2xl font-bold text-ministry-gold mb-4">JUDE JESURURU</h3>
                    <p className="text-gray-400 text-sm mb-6">© {new Date().getFullYear()} All Rights Reserved.</p>
                    <div className="mt-8">
                        {isAuthorizedDevice ? (
                            <button 
                                onClick={() => setShowAdminLogin(true)} 
                                className="text-[10px] font-bold uppercase tracking-widest text-ministry-gold border border-ministry-gold/50 px-4 py-2 rounded-sm hover:bg-ministry-gold hover:text-[#0B1120] transition-all duration-300 opacity-80 hover:opacity-100"
                            >
                                Admin Portal Access
                            </button>
                        ) : null}
                    </div>
                </div>
            </footer>

            {/* AUDIO PLAYER */}
            {currentSong && (<div className="fixed bottom-0 left-0 w-full z-50 bg-ministry-blue border-t border-ministry-gold"><AudioPlayer autoPlay src={currentSong.AudioFile.url} header={`Now Playing: ${currentSong.Title}`} showSkipControls={false} layout="horizontal-reverse" style={{ background: 'transparent', color: 'white', boxShadow: 'none' }} /></div>)}

            {/* MODALS */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg p-8 rounded-sm shadow-2xl relative">
                        <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-xl font-bold" onClick={() => setShowModal(false)}>✕</button>
                        <h2 className="text-2xl font-serif font-bold text-ministry-blue mb-6 border-b border-gray-100 pb-2">Invite Jude</h2>
                        {formStatus === 'success' ? (<div className="text-center py-8 text-green-600 font-bold text-lg">Request Sent! God bless you.</div>) : (
                            <form onSubmit={handleBooking} className="space-y-4">
                                <input type="text" placeholder="Your Name" required className="w-full p-3 border border-gray-300 focus:border-ministry-gold focus:outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                <input type="text" placeholder="Church / Ministry Name" required className="w-full p-3 border border-gray-300 focus:border-ministry-gold focus:outline-none" value={formData.churchName} onChange={e => setFormData({ ...formData, churchName: e.target.value })} />
                                <input type="email" placeholder="Email Address" required className="w-full p-3 border border-gray-300 focus:border-ministry-gold focus:outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                <textarea placeholder="Tell us about the event..." rows="4" required className="w-full p-3 border border-gray-300 focus:border-ministry-gold focus:outline-none" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}></textarea>
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
                                        <div className="relative h-52 w-full bg-black">{selectedEvent.Poster ? (<div className="w-full h-full relative"><div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10"></div><img src={getImageUrl(selectedEvent.Poster)} alt="Event" className="w-full h-full object-cover opacity-80" /></div>) : (<div className="w-full h-full bg-ministry-gold/20 flex items-center justify-center"><span className="text-4xl opacity-20">🎟️</span></div>)}<div className="absolute bottom-0 left-0 w-full p-6 z-20"><span className="bg-ministry-gold text-ministry-blue text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest shadow-md">Official Access Pass</span><h2 className="text-2xl font-serif font-bold text-white mt-2 leading-tight drop-shadow-md">{selectedEvent.Title}</h2></div></div>
                                        <div className="p-6 bg-slate-900 relative">
                                            <div className="flex flex-col gap-4 mb-6 border-l-2 border-ministry-gold pl-4"><div><p className="text-[10px] text-white/50 uppercase tracking-widest">Date & Time</p><p className="text-sm font-bold text-white">{successData.date}</p></div><div><p className="text-[10px] text-white/50 uppercase tracking-widest">Venue</p><p className="text-xs text-white/80 leading-relaxed">{successData.venue}</p></div></div>
                                            <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center gap-5"><div className="bg-white p-2 rounded-sm shadow-lg shrink-0"><img src={`https://quickchart.io/qr?text=${encodeURIComponent(successData.ticket)}&dark=000000&light=ffffff&size=200`} alt="Gate QR" className="w-24 h-24 border-2 border-white rounded-sm" /></div><div className="flex-1 overflow-hidden"><p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Attendee</p><h3 className="text-lg font-bold text-white mb-2 truncate">{successData.name}</h3><p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">Ticket ID</p><h3 className="text-xl font-mono text-ministry-gold tracking-widest">{successData.ticket}</h3></div></div>
                                            <p className="text-[10px] text-center text-white/30 mt-6">Please save this image and present the QR code at the entrance.</p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 mt-4 rounded-lg flex flex-col gap-3 no-print shadow-lg">
                                        <button onClick={handleDownloadTicket} className="w-full bg-ministry-blue text-white py-3 font-bold uppercase text-xs tracking-widest rounded-sm hover:bg-ministry-gold hover:text-ministry-blue transition flex justify-center gap-2 items-center shadow-lg"><span id="download-btn-text">📥 Download Ticket (Image)</span></button>
                                        {successData.whatsAppLink && <a href={successData.whatsAppLink} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 font-bold uppercase text-xs tracking-widest rounded-sm hover:bg-[#128C7E] transition"><span>💬</span> Join WhatsApp Group</a>}
                                    </div>
                                </div>
                            </div>
                        ) : isRegistering ? (
                            <div className="relative overflow-hidden min-h-[500px] flex flex-col">
                                <div className="absolute inset-0 z-0">{selectedEvent.Poster ? (<><img src={getImageUrl(selectedEvent.Poster)} alt="Background" className="w-full h-full object-cover blur-md scale-110 opacity-50" /><div className="absolute inset-0 bg-gradient-to-b from-gray-900/90 to-black/95"></div></>) : (<div className="w-full h-full bg-gray-900"></div>)}</div>
                                <div className="relative z-10 p-8 text-white">
                                    <h2 className="text-2xl font-serif font-bold text-white mb-1">Secure Your Seat</h2>
                                    <p className="text-sm text-white/60 mb-6 uppercase tracking-widest">{selectedEvent.Title}</p>
                                    <form onSubmit={handleEventRegistrationSubmit} className="space-y-4">
                                        <input type="text" name="name" value={registrationData.name} onChange={handleRegistrationInput} required className="w-full p-3 bg-white/5 border border-white/20 rounded-sm text-white placeholder-white/30 capitalize" placeholder="Enter your full name" />
                                        <input type="email" name="email" value={registrationData.email} onChange={handleRegistrationInput} required className="w-full p-3 bg-white/5 border border-white/20 rounded-sm text-white placeholder-white/30" placeholder="name@example.com" />
                                        <select name="attendanceType" value={registrationData.attendanceType || 'Physical'} onChange={handleRegistrationInput} className="w-full p-3 bg-white/5 border border-white/20 rounded-sm text-white"><option value="Physical" className="text-black">Physically</option><option value="Virtual" className="text-black">Virtually</option></select>
                                        <input type="tel" name="phone" placeholder="e.g. +234 80 123 4567" required className="w-full p-3 bg-white/5 border border-white/20 rounded-sm text-white placeholder-white/30" value={registrationData.phone} onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })} />
                                        <div className="flex gap-4 mt-8"><button type="submit" disabled={isSubmitting} className={`flex-1 py-4 font-bold uppercase tracking-widest transition shadow-lg rounded-sm ${isSubmitting ? 'bg-gray-600 cursor-wait' : 'bg-ministry-gold text-ministry-blue hover:bg-white'}`}>{isSubmitting ? "Processing..." : "Generate Ticket"}</button><button type="button" onClick={() => { if (selectedEvent.isBook) { setEventModalOpen(false); } else { setIsRegistering(false); } }} className="px-6 py-4 border border-white/20 text-white font-bold uppercase tracking-widest hover:bg-white/10 transition rounded-sm">Cancel</button></div>
                                        {/* PHOTO UPLOAD FIELD */}
                                        <div className="mb-4">
                                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">
                                                Upload a Selfie/Headshot <span className="text-red-500">*</span>
                                            </label>
                                            <div className="flex items-center gap-4">
                                                {/* Preview Circle */}
                                                <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                                    <img 
                                                        id="photo-preview" 
                                                        src="https://via.placeholder.com/150?text=Face" 
                                                        className="w-full h-full object-cover" 
                                                        alt="Preview" 
                                                    />
                                                </div>
                                                {/* The Input */}
                                                <input 
                                                    type="file" 
                                                    name="photo" 
                                                    accept="image/*" 
                                                    required
                                                    onChange={(e) => {
                                                        // Logic to show preview immediately
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            document.getElementById('photo-preview').src = URL.createObjectURL(file);
                                                        }
                                                    }}
                                                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-[10px] file:font-bold file:bg-ministry-blue file:text-white hover:file:bg-ministry-gold transition"
                                                />
                                            </div>
                                            <p className="text-[9px] text-gray-400 mt-1">Required for entry verification.</p>
                                        </div>
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
                                        <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">{allRegistrations.filter(r => r.eventTitle === selectedEvent.Title).sort((a, b) => a.fullName.localeCompare(b.fullName)).map((reg, index) => (<div key={index} className="flex justify-between items-center text-xs border-b border-gray-100 pb-1 last:border-0"><span className="font-bold text-gray-700 truncate w-1/3">{reg.fullName}</span></div>))}{allRegistrations.filter(r => r.eventTitle === selectedEvent.Title).length === 0 && <p className="text-xs text-gray-400 italic">Be the first to register!</p>}</div>
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
                        <div className="md:w-5/12 bg-gray-100 flex items-center justify-center p-8 relative overflow-hidden min-h-[300px]"><div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div><div className="relative w-48 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transform rotate-[-5deg] hover:rotate-0 transition duration-500 z-10">{selectedBook.CoverArt && <img src={getImageUrl(selectedBook.CoverArt)} alt="Cover" className="w-full rounded-sm" />}</div></div>
                        <div className="md:w-7/12 p-8 md:p-10 flex flex-col text-left">
                            <div className="inline-block border-b-2 border-ministry-gold pb-1 mb-4 w-max"><span className="text-ministry-gold font-bold tracking-[0.2em] uppercase text-xs">Official Hybrid Launch</span></div>
                            <h2 className="text-3xl font-serif font-bold text-ministry-blue mb-4 leading-tight">{selectedBook.Title}</h2>
                            <p className="text-gray-600 mb-6 leading-relaxed text-sm">Join us for the official launch. Preordering secures your copy and grants you exclusive access to the Launch Event.</p>
                            <div className="bg-gray-50 border border-gray-100 p-6 rounded-sm mb-6 text-sm">
                                <div className="flex justify-between items-center mb-8 gap-8 border-b border-gray-200 pb-4"><div><span className="block text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Date</span><span className="text-ministry-blue font-bold text-lg">{selectedBook.LaunchDate ? new Date(selectedBook.LaunchDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) : 'Date TBA'}</span></div><div className="text-right"><span className="block text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Time</span><span className="text-ministry-blue font-bold text-lg">{selectedBook.LaunchTime ? formatTimeWithAMPM(selectedBook.LaunchTime) : 'Time TBA'}</span></div></div>
                                <div className="space-y-4"><div className="flex items-start"><span className="text-xl mr-3">🏛️</span><div><span className="block text-xs font-bold text-ministry-blue uppercase">Physical Experience</span><span className="text-sm text-gray-600 font-medium">{selectedBook.PhysicalVenue || 'Venue to be announced'}</span></div></div><div className="flex items-start"><span className="text-xl mr-3">💻</span><div><span className="block text-xs font-bold text-ministry-blue uppercase">Virtual Experience</span><span className="text-sm text-gray-600 font-medium">{selectedBook.VirtualPlatform || 'Details sent via email'}</span></div></div></div>
                            </div>
                            <div className="mt-auto"><div className="flex justify-between items-end mb-3"><span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Preorder Bundle</span><span className="text-ministry-gold font-bold text-2xl">{selectedBook.LocalPrices?.find(p => p.Currency === userCurrency)?.Amount ? formatCurrency(selectedBook.LocalPrices.find(p => p.Currency === userCurrency).Amount, userCurrency) : selectedBook.Price}</span></div><a href={selectedBook.BuyLink} target="_blank" rel="noreferrer" className="block w-full text-center bg-ministry-gold text-white py-4 font-bold uppercase tracking-widest hover:bg-ministry-blue hover:scale-[1.02] transition-all shadow-lg rounded-sm">Secure Seat & Copy (Paystack)</a></div>
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
                        <div className="bg-ministry-blue p-6 text-white relative"><button onClick={() => setGuestListModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white font-bold">✕</button><span className="text-ministry-gold text-[10px] font-bold uppercase tracking-widest block mb-1">Guest List</span><h3 className="text-xl font-serif font-bold">{viewingGuestsFor}</h3><p className="text-xs text-white/60 mt-2">{allRegistrations.filter(r => r.eventTitle === viewingGuestsFor).length} Confirmed Attendees</p></div>
                        <div className="p-0 overflow-y-auto custom-scrollbar bg-gray-50 flex-1">
                            {allRegistrations.filter(r => r.eventTitle === viewingGuestsFor).length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {allRegistrations.filter(r => r.eventTitle === viewingGuestsFor).sort((a, b) => a.fullName.localeCompare(b.fullName)).map((reg, index) => (
                                        <div key={index} className={`px-4 py-3 flex items-center border-l-4 transition-all duration-300 ${reg.isCheckedIn ? 'bg-green-50 border-green-500 shadow-inner' : 'hover:bg-gray-50 border-transparent border-b border-gray-100'}`}>
                                            <div className="flex-[0.4] flex items-center gap-3 overflow-hidden"><div className={`w-9 h-9 flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-bold border ${reg.isCheckedIn ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white border-gray-200 text-gray-400'}`}>{reg.fullName.charAt(0)}</div><div className="min-w-0 flex flex-col"><h4 className={`text-xs font-bold truncate ${reg.isCheckedIn ? 'text-green-900' : 'text-gray-700'}`}>{reg.fullName.split(' ')[0]}</h4><span className="text-[9px] uppercase tracking-wide text-gray-400">{reg.attendanceType || 'Physical'}</span></div></div>
                                            <div className="flex-[0.3] flex justify-center">{reg.isCheckedIn ? (<span className="bg-green-600 text-white text-[9px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-widest flex items-center gap-1 animate-pulse-once">✓ Inside</span>) : (<span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest border border-gray-100 px-2 py-1 rounded-full bg-gray-50">Pending</span>)}</div>
                                            <div className="flex-[0.3] text-right"><span className={`block text-xs font-mono ${reg.isCheckedIn ? 'text-green-700 font-bold' : 'text-gray-400'}`}>{maskPhone(reg.phoneNumber)}</span></div>
                                        </div>
                                    ))}
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
                        <div className="p-6 relative z-10 flex-shrink-0 border-b border-white/10 bg-black/20 backdrop-blur-md"><button onClick={() => setTeamModalOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white font-bold text-xl">✕</button><span className="text-ministry-gold text-[10px] font-bold uppercase tracking-widest block mb-1">Event Team & Speakers</span><h3 className="text-2xl font-serif font-bold text-white">{selectedEvent.Title}</h3></div>
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 relative z-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {selectedEvent.Team.map((member) => (
                                    <div key={member.id} className="bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10 flex items-start gap-4 hover:bg-black/60 hover:border-ministry-gold/30 transition-all duration-300 group">
                                        <div className="flex-shrink-0"><div className="w-16 h-20 rounded-lg overflow-hidden border border-ministry-gold/50 shadow-sm group-hover:border-ministry-gold transition-colors bg-white/5">{getImageUrl(member.Photo) ? (<img src={getImageUrl(member.Photo)} alt={member.Name} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-white/50 text-xl">👤</div>)}</div></div>
                                        <div className="flex-1 py-1"><h4 className="font-bold text-white text-base leading-tight">{member.Name}</h4><span className="text-[10px] font-bold uppercase tracking-widest text-ministry-gold block mb-1.5">{member.Role || 'Team Member'}</span>{member.Bio && <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">{member.Bio}</p>}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md text-center flex-shrink-0 relative z-10"><button onClick={() => { setTeamModalOpen(false); setEventModalOpen(true); setIsRegistering(true); }} className="bg-ministry-gold text-white px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-ministry-blue transition shadow-lg rounded-sm">{selectedEvent.id.toString().startsWith('book-') ? "RSVP for Book Launch" : "Register to see them live"}</button></div>
                    </div>
                </div>
            )}

            {showAdminLogin && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white p-8 max-w-sm w-full rounded-sm shadow-2xl relative">
                        <button onClick={() => setShowAdminLogin(false)} className="absolute top-2 right-4 text-gray-400 font-bold hover:text-red-500 text-xl">✕</button>
                        <h2 className="text-xl font-bold text-ministry-blue mb-4 border-b border-gray-100 pb-2">Admin Access</h2>
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div><label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Select Access Level</label><div className="relative"><select value={adminFormData.selectedRole} onChange={(e) => setAdminFormData({ ...adminFormData, selectedRole: e.target.value })} className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm appearance-none bg-white cursor-pointer"><option value="staff">Staff / Gatekeeper</option><option value="super_admin">Super Admin</option></select><div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div></div></div>
                            <div><label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Username or Email</label><input type="text" placeholder="Enter ID" className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm" value={adminFormData.username} onChange={(e) => setAdminFormData({ ...adminFormData, username: e.target.value })} required /></div>
                            <div><label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Password</label><input type="password" placeholder="••••••••" className="w-full p-3 border border-gray-300 focus:border-ministry-gold outline-none text-sm rounded-sm" value={adminFormData.password} onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })} required /></div>
                            <button className="w-full bg-ministry-blue text-white py-3 font-bold uppercase tracking-widest hover:bg-ministry-gold transition shadow-lg text-xs rounded-sm">Authenticate</button>
                        </form>
                    </div>
                </div>
            )}

            {/* SUBSCRIBE MODAL */}
            {showSubscribeModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-md p-8 rounded-sm shadow-2xl relative text-center">
                        <button 
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-xl font-bold" 
                            onClick={() => { setShowSubscribeModal(false); setSubscribeStatus(''); }}
                        >
                            ✕
                        </button>
                        
                        <span className="text-4xl mb-4 block">📩</span>
                        <h2 className="text-2xl font-serif font-bold text-ministry-blue mb-2">Join the Daily List</h2>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            Start your morning with Kingdom perspective. Delivered daily at 6AM directly to your inbox.
                        </p>

                        {subscribeStatus === 'success' ? (
                            <div className="bg-green-50 text-green-700 p-4 rounded-sm border border-green-200">
                                <p className="font-bold">Welcome to the family! ✅</p>
                                <p className="text-xs mt-1">Check your inbox shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubscribe} className="space-y-4 text-left">
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Your Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        required 
                                        placeholder="John Doe"
                                        className="w-full p-3 border border-gray-300 focus:border-ministry-gold focus:outline-none text-sm rounded-sm" 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400 mb-1 block">Email Address</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        required 
                                        placeholder="john@example.com"
                                        className="w-full p-3 border border-gray-300 focus:border-ministry-gold focus:outline-none text-sm rounded-sm" 
                                    />
                                </div>
                                
                                {subscribeStatus === 'error' && (
                                    <p className="text-red-500 text-xs text-center font-bold">Something went wrong. Please try again.</p>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={subscribeStatus === 'loading'}
                                    className="w-full bg-ministry-blue text-white py-3 font-bold uppercase tracking-widest hover:bg-ministry-gold hover:text-ministry-blue transition shadow-lg mt-2 disabled:bg-gray-400"
                                >
                                    {subscribeStatus === 'loading' ? 'Processing...' : 'Subscribe Free'}
                                </button>
                            </form>
                        )}
                        
                        <p className="text-[10px] text-gray-400 mt-6">
                            We respect your privacy. No spam, ever.
                        </p>
                    </div>
                </div>
            )}

            {/* AUTH MODAL (Login / Signup) */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-sm p-8 rounded-sm shadow-2xl relative">
                        <button 
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-600 font-bold"
                        >✕</button>

                        <h2 className="text-2xl font-serif font-bold text-ministry-blue mb-6 text-center">
                            {authMode === 'login' ? 'Member Login' : 'Join the Family'}
                        </h2>

                        <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                            
                            {authMode === 'register' && (
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-gray-400">Full Name</label>
                                    <input name="username" type="text" required className="w-full p-3 border border-gray-300 rounded-sm text-sm" />
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-400">{authMode === 'login' ? 'Email or Username' : 'Email Address'}</label>
                                <input name="identifier" type={authMode === 'login' ? 'text' : 'email'} name={authMode === 'login' ? 'identifier' : 'email'} required className="w-full p-3 border border-gray-300 rounded-sm text-sm" />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase text-gray-400">Password</label>
                                <input name="password" type="password" required className="w-full p-3 border border-gray-300 rounded-sm text-sm" />
                            </div>

                            <button className="w-full bg-ministry-blue text-white py-3 font-bold uppercase tracking-widest hover:bg-ministry-gold hover:text-ministry-blue transition shadow-lg mt-2">
                                {authMode === 'login' ? 'Sign In' : 'Create Account'}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-xs text-gray-400">
                            {authMode === 'login' ? "Don't have an account?" : "Already have an account?"}
                            <button 
                                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                                className="ml-2 text-ministry-blue font-bold uppercase underline hover:text-ministry-gold"
                            >
                                {authMode === 'login' ? 'Sign Up' : 'Login'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DEVICE SETUP MODAL (Enhanced with Copy Button) */}
            {showDeviceIDModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/95 p-6 animate-fade-in">
                    <div className="bg-white w-full max-w-sm p-6 rounded-sm text-center shadow-2xl relative">
                        <h3 className="text-xl font-bold mb-2 font-serif text-ministry-blue">Device Setup</h3>
                        <p className="text-xs text-gray-500 mb-6 uppercase tracking-widest">Share this ID to request access</p>
                        
                        {/* ID Container with Copy Button */}
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex-1 bg-gray-100 p-3 rounded-sm border border-gray-300 font-mono text-sm font-bold text-gray-700 break-all select-all">
                                {myDeviceId}
                            </div>
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(myDeviceId);
                                    alert("ID Copied to Clipboard!"); 
                                }}
                                className="bg-ministry-gold text-white p-3 rounded-sm font-bold shadow-md hover:bg-ministry-blue transition-colors"
                                title="Copy to Clipboard"
                            >
                                📋
                            </button>
                        </div>

                        <div className="text-xs font-bold uppercase tracking-widest mb-6 border-t border-gray-100 pt-4">
                            Status: {isAuthorizedDevice ? <span className="text-green-600 ml-2">AUTHORIZED ✅</span> : <span className="text-red-500 ml-2">UNAUTHORIZED ❌</span>}
                        </div>

                        <button onClick={() => setShowDeviceIDModal(false)} className="w-full bg-black text-white py-3 rounded-sm text-xs uppercase font-bold tracking-widest hover:bg-gray-800">Close</button>
                    </div>
                </div>
            )}

            {isVideoPlaying && (
                <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center p-4 md:p-20 overscroll-none touch-none" onClick={(e) => e.stopPropagation()} >
                                        
                    {/* Close Button */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsVideoPlaying(false); }}
                        className="absolute top-6 right-6 text-white bg-red-600 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:scale-110 transition z-[10000] font-bold text-xl"
                    >
                        ✕
                    </button>

                    <div className="w-full h-full border-4 border-ministry-gold relative bg-black">
                        {(() => {
                            // 1. Get the current video URL
                            // (REVERTED BACK to dynamic variable so it plays your playlist, not the Bunny)
                            const source = videoPlaylist[currentVideoIndex]?.videoSrc || "";
                                                
                            // 2. Check if it is YouTube
                            const isYouTube = source.includes('youtube.com') || source.includes('youtu.be');

                            if (isYouTube) {
                                // Extract Video ID for Embed
                                let videoId = "";
                                if (source.includes('v=')) videoId = source.split('v=')[1]?.split('&')[0];
                                else if (source.includes('youtu.be/')) videoId = source.split('youtu.be/')[1]?.split('?')[0];

                                return (
                                    <iframe
                                        className="w-full h-full"
                                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                );
                            } else {
                                // 3. Fallback to Native Player for Uploads (The "Bunny" Player)
                                return (
                                    <video 
                                        src={source}
                                        className="w-full h-full object-contain"
                                        controls 
                                        autoPlay
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                );
                            }
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;