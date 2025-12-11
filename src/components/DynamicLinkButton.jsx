import React from 'react';

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
export default DynamicLinkButton;