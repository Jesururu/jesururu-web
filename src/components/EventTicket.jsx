import React from 'react';
import { getImageUrl } from '../utils/helpers';

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
export default EventTicket;