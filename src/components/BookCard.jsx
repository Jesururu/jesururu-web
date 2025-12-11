import React, { useState } from 'react';
import { getSynopsisText, getImageUrl, formatCurrency } from '../utils/helpers';


// =========================================
// 4. SUB-COMPONENTS
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
export default BookCard;