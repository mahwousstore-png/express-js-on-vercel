// FIX: Import `useRef` from React to resolve the 'Cannot find name' error.
import React, { useState, useMemo, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { db } from './firebase';
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    setDoc,
    Timestamp,
    serverTimestamp,
    writeBatch
} from "firebase/firestore";


// --- HELPERS ---
const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('ar-SA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch (e) {
        console.error("Invalid date for formatDate:", dateString, e);
        return 'تاريخ غير صالح';
    }
};

const formatDateTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('ar-SA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    } catch (e) {
        console.error("Invalid date for formatDateTime:", dateString, e);
        return 'تاريخ غير صالح';
    }
};


// --- ICONS & LOGOS ---
const MahwousLogo: React.FC<{className?: string}> = ({className}) => (
    <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Mahwous Perfume Logo">
        <defs>
            <linearGradient id="gold_gradient" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#FDE08D" />
                <stop offset="50%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#FDE08D" />
            </linearGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>
        
        {/* M Ring shape */}
        <path d="M80 55 C 60 80, 70 105, 85 105 L 90 105 C 80 100, 80 80, 90 65 L 100 45 L 110 65 C 120 80, 120 100, 110 105 L 115 105 C 130 105, 140 80, 120 55 L 100 20 Z" fill="url(#gold_gradient)" />

        {/* Diamond */}
        <g transform="translate(0, -5)">
            <path d="M100 15 L120 30 L80 30 Z" fill="#FBBF24"/>
            <path d="M100 15 L100 30 L80 30 Z" fill="#FDE08D" opacity="0.8"/>
            <path d="M100 15 L100 30 L120 30 Z" fill="#D97706" opacity="0.8"/>
             {/* Sparkles */}
            <path d="M100 10 L102 13 L100 16 L98 13 Z" fill="white" filter="url(#glow)" />
            <path d="M82 28 L84 29 L82 30 L80 29 Z" fill="white" opacity="0.7" filter="url(#glow)" />
            <path d="M118 28 L120 29 L118 30 L116 29 Z" fill="white" opacity="0.7" filter="url(#glow)" />
        </g>
        
        {/* Text */}
        <text x="100" y="125" fontFamily="Times New Roman, serif" fontSize="24" fill="white" textAnchor="middle" style={{fontVariant: 'small-caps', letterSpacing: '1px'}}>Mahwous</text>
        <text x="100" y="148" fontFamily="sans-serif" fontSize="14" fill="white" textAnchor="middle">Perfume</text>

        {/* Lines */}
        <rect x="20" y="118" width="50" height="3" fill="url(#gold_gradient)" rx="1.5" />
        <rect x="130" y="118" width="50" height="3" fill="url(#gold_gradient)" rx="1.5" />
    </svg>
);
// --- PAYMENT GATEWAY ICONS ---
const MadaIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="8" fill="#E6E6E6"/><path d="M17.15 15.5H12.5L24 33L35.5 15.5H30.85L24 25.4L17.15 15.5Z" fill="#212A7B"/><path d="M30.85 15.5H35.5L24 33L12.5 15.5H17.15L24 25.4L30.85 15.5Z" fill="#00A99D"/></svg>;
const ApplePayIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="8" fill="black"/><path d="M25.3229 19.333C25.4029 18.42 25.9229 17.58 26.7329 17.02C27.5729 16.42 28.5829 16.1467 29.5129 16.2133C29.4329 17.16 28.9429 18.02 28.1629 18.58C27.3529 19.1667 26.3429 19.4533 25.4629 19.44C25.3829 19.4133 25.3429 19.38 25.3229 19.333ZM24.4529 14.5067C26.5529 14.48 28.4929 15.48 29.7429 17.1333C29.6229 17.2 28.3229 17.76 27.2329 18.9C25.9629 20.2533 25.4229 22.08 25.8229 23.9467C26.7429 23.82 27.7629 23.3333 28.6929 22.5867C29.7129 21.7867 30.3829 20.6267 30.5629 19.3733C31.7829 19.92 32.8129 20.8933 33.4229 22.1467C31.5429 23.4133 30.0829 25.7067 29.8929 28.3733C28.8429 29.3467 27.5629 29.9333 26.2129 30.0133C25.0229 30.1333 23.8329 29.7733 22.8429 29.0933C21.8229 28.3867 21.0529 27.3867 20.6829 26.2267C18.6629 28.0267 17.8029 30.6933 18.2929 33.3733H20.4429C20.8229 31.84 21.6529 30.4533 22.8229 29.4133C23.9029 28.4267 25.2829 27.8533 26.6929 27.8133C27.0429 27.8 27.3529 27.7333 27.6429 27.6267C27.5729 25.0267 29.0229 22.8667 31.4329 21.6133C29.8429 19.9867 27.4229 19.24 25.2129 20.12C23.5129 20.7733 22.1629 21.96 21.4329 23.5067C20.4029 22.7733 19.4629 21.8267 18.7229 20.72C20.4029 17.88 22.6829 14.5467 24.4529 14.5067Z" fill="white"/></svg>;
const BankIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>;
const CashIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125-1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const VisaMastercardIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="8" fill="#1A1A1A"/><path d="M12 20h24v8H12z" fill="#FF5F00"/><path d="M19.5 28a7.5 7.5 0 000-8" stroke="#EB001B" strokeWidth="3"/><path d="M28.5 20a7.5 7.5 0 000 8" stroke="#F79E1B" strokeWidth="3"/></svg>;
const TamaraIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="8" fill="#21D489"/><text x="24" y="32" fontFamily="sans-serif" fontSize="14" fill="white" textAnchor="middle" fontWeight="bold">tamara</text></svg>;
const TabbyIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="8" fill="#333333"/><text x="24" y="32" fontFamily="sans-serif" fontSize="16" fill="white" textAnchor="middle" fontWeight="bold">tabby</text></svg>;
const StcPayIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="8" fill="#6A206A"/><text x="24" y="32" fontFamily="sans-serif" fontSize="14" fill="white" textAnchor="middle" fontWeight="bold">stc pay</text></svg>;
const MadfoaatIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="8" fill="#00AEEF"/><text x="24" y="32" fontFamily="sans-serif" fontSize="14" fill="white" textAnchor="middle" fontWeight="bold">مدفوع</text></svg>;
// --- SHIPPING COMPANY ICONS ---
const SmsaIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" rx="8" fill="#F07D00"/><text x="50" y="32" fontFamily="sans-serif" fontSize="24" fill="white" textAnchor="middle" fontWeight="bold">SMSA</text></svg>;
const IMileAramexIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" rx="8" fill="#E20000"/><text x="50" y="32" fontFamily="sans-serif" fontSize="14" fill="white" textAnchor="middle" fontWeight="bold">iMile/Aramex</text></svg>;
const RedBoxIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="50" rx="8" fill="#E53935"/><text x="50" y="32" fontFamily="sans-serif" fontSize="16" fill="white" textAnchor="middle" fontWeight="bold">RedBox</text></svg>;
const TruckIcon: React.FC<{className?: string}> = ({className}) => <svg className={className || "w-8 h-8"} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-1.025H10.125a2.056 2.056 0 00-1.58 1.025 17.903 17.903 0 00-3.213 9.193c-.04.62.469 1.124 1.09 1.124h1.125" /></svg>;
// --- NAVIGATION ICONS ---
const HomeIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a.75.75 0 011.06 0l8.955 8.955a.75.75 0 01-1.06 1.06l-1.344-1.343V18a2.25 2.25 0 01-2.25 2.25h-2.25a.75.75 0 01-.75-.75v-2.25a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v2.25a.75.75 0 01-.75-.75H9A2.25 2.25 0 016.75 18v-6.283l-1.344 1.343a.75.75 0 01-1.06-1.06z" /></svg>;
const ChartBarIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125-1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125-1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const UsersIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-4.663M12 3.375c-3.418 0-6.167 2.749-6.167 6.167s2.749 6.167 6.167 6.167 6.167-2.749 6.167-6.167S15.418 3.375 12 3.375z" /></svg>;
const ArchiveBoxIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const CreditCardIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 21z" /></svg>;
const BuildingLibraryIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>;
const Cog6ToothIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.11a12.004 12.004 0 015.093 5.093c.103.55.568 1.02 1.11 1.11a12.004 12.004 0 01-5.093 5.093c-.55.103-1.02.568-1.11 1.11a12.004 12.004 0 01-5.093-5.093c-.103-.55-.568-1.02-1.11-1.11A12.004 12.004 0 0110.343 3.94zM14.25 12a2.25 2.25 0 10-4.5 0 2.25 2.25 0 004.5 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-4.142-3.358-7.5-7.5-7.5s-7.5 3.358-7.5 7.5 3.358 7.5 7.5 7.5 7.5-3.358 7.5-7.5z" /></svg>;
const PlusIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const XMarkIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TrashIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const CheckCircleIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TagIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>;
const DocumentTextIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
const DocumentChartBarIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 11.25l-2.625 2.625-2.25-2.25-2.625 2.625" /></svg>;
const LogoutIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;
const SparklesIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.25 21.75l-.648-1.178a3.375 3.375 0 00-2.455-2.456l-1.178-.648 1.178-.648a3.375 3.375 0 002.455-2.456l.648-1.178.648 1.178a3.375 3.375 0 002.456 2.456l1.178.648-1.178.648a3.375 3.375 0 00-2.456 2.456z" /></svg>;
const DocumentArrowUpIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.158 10.308l-3-3m0 0l3-3m-3 3h7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3-3m3 3h6.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12.75l3-3m0 0l3 3m-3-3v10.5a2.25 2.25 0 002.25 2.25h9.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12V6a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 6v12A2.25 2.25 0 004.5 20.25h9.75M15 12a2.25 2.25 0 002.25 2.25h.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v.008h.008V17.25H9zm3 0v.008h.008v-.008H12zm3 0v.008h.008v-.008H15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3h-6m2.25-4.5a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3h-6m2.25-4.5a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m6 3H9m3-6v6" /><path d="M12 10.5v6m3-3h-6m2.25-4.5a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V8.25M10.5 1.5L15 6h4.5V1.5h-9zM10.5 1.5v4.5h4.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m0 6h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5H9" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25V8.25a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 8.25v10.5A2.25 2.25 0 006.75 21h8.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.158 10.308l-3-3m0 0l3-3m-3 3h7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13.5H9" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12h3.75a3.375 3.375 0 003.375-3.375V9.375a3.375 3.375 0 00-3.375-3.375h-1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2.25A2.25 2.25 0 0014.25 19.5h2.25a2.25 2.25 0 002.25-2.25v-2.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 15v2.25A2.25 2.25 0 016.75 19.5H4.5A2.25 2.25 0 012.25 17.25v-2.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 9V6.75A2.25 2.25 0 0012.75 4.5h-2.25A2.25 2.25 0 008.25 6.75V9" /><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13.5H9" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3h-6" /><path d="M12 10.5v6m3-3h-6" /><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V8.25M10.5 1.5L15 6h4.5V1.5h-9zM10.5 1.5v4.5h4.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 13.5l3 3m0 0l3-3m-3 3v-6m0 6h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5A2.25 2.25 0 006.75 19.5H9" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25V8.25a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 8.25v10.5A2.25 2.25 0 006.75 21h8.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13.5H9" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12h3.75a3.375 3.375 0 003.375-3.375V9.375a3.375 3.375 0 00-3.375-3.375h-1.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2.25A2.25 2.25 0 0014.25 19.5h2.25a2.25 2.25 0 002.25-2.25v-2.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 15v2.25A2.25 2.25 0 016.75 19.5H4.5A2.25 2.25 0 012.25 17.25v-2.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 9V6.75A2.25 2.25 0 0012.75 4.5h-2.25A2.25 2.25 0 008.25 6.75V9" /><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15" /></svg>;
const PencilIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L16.862 4.487" /></svg>;
const QuestionMarkCircleIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>;


// --- DATA TYPES ---
type OrderStatus = 'مكتمل' | 'ملغي' | 'مرتجع';
type UserRole = 'admin' | 'employee';
interface User { id: string; username: string; role: UserRole; email: string; }
interface Supplier { id: string; name: string; contact: string; city: string; email?: string; address?: string; }
interface MasterProduct { id: string; name: string; cost: number; supplierId: string; }
interface OrderProduct { productId: string; cost: number; name: string; supplierId: string; }
interface Order { id: string; date: string; orderNumber: string; customerName: string; orderTotal: number; deliveryFee: number; gatewayFee: number; products: OrderProduct[]; createdAt: string; shippingCompany: string; paymentMethod: string; status: OrderStatus; cancellationFee: number; }
interface Expense { id: string; date: string; description: string; amount: number; category: string; createdAt: string; purchaserId?: string; }
interface Purchaser { id: string; name: string; balance: number; }
interface Payment { id: string; date: string; supplierId: string; amount: number; sourceType: 'custody' | 'treasury'; purchaserId?: string; createdAt: string; }
interface Settlement { id: string; gatewayId: string; amount: number; date: string; attachment?: string; notes?: string; createdAt: string; user: string; }
interface Log { id: string; timestamp: string; user: string; action: string; }
type ToastMessage = { id: string; message: string; };
type ParsedInvoiceData = { orderNumber: string; customerName: string; orderTotal: number; deliveryFee: number; products: { name: string, quantity: number }[], shippingCompany: string; paymentMethod: string; };
type PrefilledOrderData = { orderNumber?: string; customerName?: string; orderTotal?: number; deliveryFee?: number; shippingCompany?: string; paymentMethod?: string; products?: (Omit<OrderProduct, 'cost'> & { cost: number | '' })[]; }


// --- CONSTANTS ---
const VAT_RATE = 0.15;
const paymentGateways = [
    { id: 'مدى', name: 'مدى', icon: <MadaIcon />, feeRule: (total: number) => ((total * 0.01) + 1) * (1 + VAT_RATE), description: '1% + 1 ر.س (+15% ضريبة)', color: 'border-yellow-400/50', emoji: '💳' },
    { id: 'Apple Pay', name: 'Apple Pay', icon: <ApplePayIcon />, feeRule: (total: number) => ((total * 0.022) + 1) * (1 + VAT_RATE), description: '2.2% + 1 ر.س (+15% ضريبة)', color: 'border-gray-400/50', emoji: '' },
    { id: 'فيزا/ماستركارد', name: 'فيزا/ماستركارد', icon: <VisaMastercardIcon />, feeRule: (total: number) => ((total * 0.022) + 1) * (1 + VAT_RATE), description: '2.2% + 1 ر.س (+15% ضريبة)', color: 'border-orange-400/50', emoji: '💳' },
    { id: 'STC Pay', name: 'STC Pay', icon: <StcPayIcon />, feeRule: (total: number) => (total * 0.015) * (1 + VAT_RATE), description: '1.5% (+15% ضريبة)', color: 'border-purple-400/50', emoji: '📱' },
    { id: 'تمارا', name: 'تمارا', icon: <TamaraIcon />, feeRule: (total: number) => ((total * 0.0599) + 1.5) * (1 + VAT_RATE), description: '5.99% + 1.5 ر.س (+15% ضريبة)', color: 'border-green-400/50', emoji: '🛍️' },
    { id: 'تابي', name: 'تابي', icon: <TabbyIcon />, feeRule: (total: number) => ((total * 0.045) + 1) * (1 + VAT_RATE), description: '4.5% + 1 ر.س (+15% ضريبة)', color: 'border-gray-400/50', emoji: '🛍️' },
    { id: 'مدفوع', name: 'مدفوع', icon: <MadfoaatIcon />, feeRule: (total: number) => ((total * 0.02) + 1) * (1 + VAT_RATE), description: '2% + 1 ر.س (+15% ضريبة)', color: 'border-sky-400/50', emoji: '✅' },
    { id: 'تحويل بنكي', name: 'تحويل بنكي', icon: <BankIcon />, feeRule: () => 0, description: 'لا توجد رسوم', color: 'border-blue-400/50', emoji: '🏦' },
    { id: 'الدفع عند الاستلام', name: 'عند الاستلام', icon: <CashIcon />, feeRule: () => 0, description: 'لا توجد رسوم', color: 'border-lime-400/50', emoji: '💵' },
];

const shippingOptions = [
    { id: 'RedBox', name: 'رد بوكس', icon: <RedBoxIcon />, cost: 14.95, emoji: '📦' },
    { id: 'SMSA', name: 'سمسا', icon: <SmsaIcon />, cost: 29.5, emoji: '🚚' },
    { id: 'iMile/Aramex', name: 'اي مكان/أرامكس', icon: <IMileAramexIcon />, cost: 27.6, emoji: '✈️' },
    { id: 'أخرى', name: 'أخرى', icon: <TruckIcon />, cost: null, emoji: '🚛' },
];

// --- TOAST NOTIFICATIONS ---
const ToastContext = createContext<{ addToast: (message: string) => void }>({ addToast: () => {} });
const useToast = () => useContext(ToastContext);

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    
    const addToast = useCallback((message: string) => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message }]);
        setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed top-5 right-5 z-[100] space-y-3">
                {toasts.map(toast => (
                    <div key={toast.id} className="flex items-center gap-3 bg-gray-800 border border-amber-500/50 shadow-lg shadow-amber-500/10 text-white p-4 rounded-lg animate-fade-in-out">
                        <MahwousLogo className="w-8 h-8 flex-shrink-0" />
                        <span>{toast.message}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};


// --- REUSABLE COMPONENTS ---
const Tooltip: React.FC<{text: string, children: React.ReactNode}> = ({ text, children }) => (
    <div className="relative flex items-center group">
        {children}
        <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 w-max max-w-xs bg-gray-900 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg border border-amber-500/20 z-10 pointer-events-none">
            {text}
        </div>
    </div>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  label: string;
  id: string;
  inputClassName?: string;
  className?: string;
  tooltip?: string;
}

const Input: React.FC<InputProps> = ({ label, id, type, children, inputClassName, className, tooltip, ...props }) => {
  const baseClasses = "w-full p-3 rounded-lg border focus:ring-amber-500 focus:border-amber-500 transition-colors text-lg";
  const defaultClasses = "bg-gray-700 border-gray-600 text-white placeholder-gray-400";
  const finalClasses = `${baseClasses} ${inputClassName || defaultClasses}`;
  
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 mb-1.5">
          <label htmlFor={id} className="block text-md font-medium text-gray-300">{label}</label>
          {tooltip && (
            <Tooltip text={tooltip}>
                <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500" />
            </Tooltip>
          )}
      </div>
      {type === 'select' ? (
        <select id={id} {...props} className={finalClasses}>
          {children}
        </select>
      ) : type === 'textarea' ? (
        <textarea id={id} {...props} className={finalClasses} />
      ) : (
        <input id={id} type={type} {...props} className={finalClasses} />
      )}
    </div>
  );
};


// --- APP WRAPPER ---
const AppWrapper: React.FC = () => (
    <ToastProvider>
        <App/>
    </ToastProvider>
);

type ActiveView = 'dashboard' | 'orders' | 'suppliers' | 'purchasing' | 'expenses' | 'logs' | 'gateways' | 'reports' | 'settings';

// --- MAIN APP ---
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null); // Start with no user
  
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const { addToast } = useToast();
  
  // Replace usePersistentState with useState, data will come from Firestore
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<MasterProduct[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchasers, setPurchasers] = useState<Purchaser[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  // Settings are not collections
  const [bankAccountNumber, setBankAccountNumber] = useState<string>('');
  const [expenseCategories, setExpenseCategories] = useState<string[]>(['إعلانية', 'عمالة', 'تسمسة', 'أخرى']);
  
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Firestore real-time listeners
  useEffect(() => {
    setIsDataLoading(true);
    const collections: { [key: string]: { setter: Function, sorter?: any } } = {
        orders: { setter: setOrders, sorter: orderBy('date', 'desc') },
        suppliers: { setter: setSuppliers },
        products: { setter: setProducts },
        expenses: { setter: setExpenses, sorter: orderBy('date', 'desc') },
        purchasers: { setter: setPurchasers },
        payments: { setter: setPayments },
        settlements: { setter: setSettlements },
        logs: { setter: setLogs, sorter: orderBy('timestamp', 'desc') },
        users: { setter: setUsers },
    };

    const unsubs = Object.entries(collections).map(([name, { setter, sorter }]) => {
        const collRef = collection(db, name);
        const q = sorter ? query(collRef, sorter) : query(collRef);
        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
            setter(items);
        });
    });

    // Listener for settings
    const settingsDocRef = doc(db, "settings", "app");
    const unsubSettings = onSnapshot(settingsDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            setBankAccountNumber(data.bankAccountNumber || '');
            setExpenseCategories(data.expenseCategories || ['إعلانية', 'عمالة', 'تسمسة', 'أخرى']);
        }
    });
    
    unsubs.push(unsubSettings);
    setIsDataLoading(false); // This is optimistic, real loading state is more complex

    // Set a default user for now since auth is not implemented
    setUser({ id: 'admin-user', username: 'admin', role: 'admin', email: 'admin@mahwous.com' });


    return () => {
        unsubs.forEach(unsub => unsub());
    };
  }, []);

  const [isCustodyExpenseModalOpen, setIsCustodyExpenseModalOpen] = useState(false);
  const [supplierDetailsModal, setSupplierDetailsModal] = useState<{ isOpen: boolean; supplier: Supplier | null }>({ isOpen: false, supplier: null });
  const [preselectedReportSupplierId, setPreselectedReportSupplierId] = useState<string | null>(null);
  
  const addLog = useCallback(async (action: string, logUser: User | null = user) => {
    if (!logUser) return;
    const newLog = {
        timestamp: new Date().toISOString(),
        user: logUser.username,
        action,
    };
    await addDoc(collection(db, 'logs'), newLog);
  }, [user]);

  const handleLogout = () => {
    addLog('تسجيل الخروج');
    setUser(null); 
    addToast('تم تسجيل الخروج.');
  };

  const handleGenerateStatementRequest = (supplierId: string) => {
    setPreselectedReportSupplierId(supplierId);
    setActiveView('reports');
  };

  const clearPreselection = () => {
      setPreselectedReportSupplierId(null);
  };
  
  const calculations = useMemo(() => {
    const completedOrders = orders.filter(o => o.status === 'مكتمل');
    const cancelledOrders = orders.filter(o => o.status !== 'مكتمل');

    const totalRevenue = completedOrders.reduce((acc, order) => acc + order.orderTotal, 0) + cancelledOrders.reduce((acc, order) => acc + order.cancellationFee, 0);
    const totalCostOfGoods = completedOrders.reduce((acc, order) => acc + order.products.reduce((pAcc, p) => pAcc + p.cost, 0), 0);
    const totalGatewayFees = orders.reduce((acc, order) => acc + order.gatewayFee, 0);
    const totalDeliveryFees = orders.reduce((acc, order) => acc + order.deliveryFee, 0);
    const totalExpenses = expenses.filter(exp => exp.category !== 'تحويل عهدة').reduce((acc, exp) => acc + exp.amount, 0);
    
    const grossProfit = totalRevenue - totalCostOfGoods - totalGatewayFees - totalDeliveryFees;
    const netProfit = grossProfit - totalExpenses;
    
    const totalPaymentsToSuppliers = payments.reduce((acc, p) => acc + p.amount, 0);
    const accountsPayable = totalCostOfGoods - totalPaymentsToSuppliers;

    const supplierBalances = suppliers.map(supplier => {
        const totalOwed = completedOrders.flatMap(o => o.products)
                              .filter(p => p.supplierId === supplier.id)
                              .reduce((acc, p) => acc + p.cost, 0);
        const totalPaid = payments.filter(p => p.supplierId === supplier.id)
                                  .reduce((acc, p) => acc + p.amount, 0);
        return { ...supplier, balance: totalOwed - totalPaid };
    });

    return { totalRevenue, totalCostOfGoods, totalExpenses, netProfit, supplierBalances, accountsPayable, completedOrders };
  }, [orders, suppliers, expenses, payments]);

    const addOrder = async (order: Omit<Order, 'id' | 'createdAt'>) => {
        const orderData = { ...order, createdAt: new Date().toISOString() };
        try {
            await addDoc(collection(db, 'orders'), orderData);
            addLog(`إضافة طلب جديد #${order.orderNumber}`);
            addToast('تمت إضافة الطلب بنجاح!');
        } catch (error) {
            console.error("Error adding order:", error);
            addToast('خطأ: لم يتم إضافة الطلب.');
        }
    };

    const updateOrder = async (updatedOrder: Order) => {
        const oldOrder = orders.find(o => o.id === updatedOrder.id);
        const { id, ...dataToUpdate } = updatedOrder;
        try {
            await updateDoc(doc(db, 'orders', id), dataToUpdate);
            let logMessage = `تحديث بيانات الطلب #${updatedOrder.orderNumber}`;
            if (oldOrder && oldOrder.status !== updatedOrder.status) {
                logMessage = `تغيير حالة الطلب #${updatedOrder.orderNumber} إلى ${updatedOrder.status}`;
                if (updatedOrder.status !== 'مكتمل' && updatedOrder.cancellationFee === 0) {
                    logMessage += " (تسوية ودية)";
                }
            }
            addLog(logMessage);
            addToast(`تم تحديث الطلب #${updatedOrder.orderNumber}`);
        } catch (error) {
            console.error("Error updating order:", error);
            addToast('خطأ: لم يتم تحديث الطلب.');
        }
    };
  
    const addSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<Supplier | null> => {
        const trimmedName = supplierData.name.trim();
        if (!trimmedName || !supplierData.contact.trim() || !supplierData.city.trim()) {
            addToast('الرجاء تعبئة جميع حقول المورد الإلزامية.');
            return null;
        }
        if (!/^05\d{8}$/.test(supplierData.contact.trim())) {
            addToast('الرجاء إدخال رقم جوال سعودي صحيح (10 أرقام يبدأ بـ 05).');
            return null;
        }
        if (supplierData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplierData.email)) {
            addToast('الرجاء إدخال بريد إلكتروني صحيح.');
            return null;
        }
        if (suppliers.some(s => s.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
            addToast('اسم المورد موجود مسبقاً.');
            return null;
        }
        try {
            const docRef = await addDoc(collection(db, 'suppliers'), supplierData);
            addLog(`إضافة مورد جديد: ${supplierData.name}`);
            addToast('تمت إضافة المورد بنجاح!');
            return { ...supplierData, id: docRef.id };
        } catch (error) {
            console.error("Error adding supplier:", error);
            addToast('خطأ: لم يتم إضافة المورد.');
            return null;
        }
    };

    const addExpense = async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
        const expenseData = { ...expense, createdAt: new Date().toISOString() };
        try {
            await addDoc(collection(db, 'expenses'), expenseData);
            addLog(`تسجيل مصروف: ${expense.description} بقيمة ${expense.amount} ر.س`);
            addToast('تم تسجيل المصروف بنجاح!');
        } catch (error) {
            console.error("Error adding expense:", error);
            addToast('خطأ: لم يتم تسجيل المصروف.');
        }
    };

    const addCustodyExpense = async (expenseData: { description: string; amount: number; category: string; date: string; purchaserId: string; }) => {
        const purchaserRef = doc(db, 'purchasers', expenseData.purchaserId);
        const purchaser = purchasers.find(p => p.id === expenseData.purchaserId);
        if (!purchaser) {
            addToast('لم يتم العثور على مسؤول المشتريات.');
            return;
        }

        const batch = writeBatch(db);
        // Add expense
        const expenseColl = collection(db, 'expenses');
        batch.set(doc(expenseColl), { ...expenseData, createdAt: new Date().toISOString() });
        // Update purchaser balance
        batch.update(purchaserRef, { balance: purchaser.balance - expenseData.amount });
        
        try {
            await batch.commit();
            addLog(`تسجيل مصروف من العهدة: ${expenseData.description} بقيمة ${expenseData.amount} ر.س`);
            addToast('تم تسجيل المصروف من العهدة وخصمه من الرصيد.');
        } catch(e) {
            console.error("Error in custody expense transaction:", e);
            addToast('خطأ: لم يتم تسجيل المصروف من العهدة.');
        }
    };

    const addPayment = async (payment: Omit<Payment, 'id' | 'createdAt'>) => {
        const paymentData = { ...payment, createdAt: new Date().toISOString() };
        const supplierName = suppliers.find(s => s.id === payment.supplierId)?.name || 'غير معروف';

        const batch = writeBatch(db);
        // Add payment record
        batch.set(doc(collection(db, 'payments')), paymentData);
        // Update purchaser balance if applicable
        if (payment.sourceType === 'custody' && payment.purchaserId) {
            const purchaser = purchasers.find(p => p.id === payment.purchaserId);
            if (purchaser) {
                 batch.update(doc(db, 'purchasers', payment.purchaserId), { balance: purchaser.balance - payment.amount });
            }
        }
        try {
            await batch.commit();
            addLog(`سداد دفعة للمورد ${supplierName} بقيمة ${payment.amount} ر.س`);
            addToast('تم تسجيل الدفعة بنجاح!');
        } catch(e) {
             console.error("Error adding payment:", e);
            addToast('خطأ: لم يتم تسجيل الدفعة.');
        }
    };
  
    const addSettlement = async (settlement: Omit<Settlement, 'id' | 'createdAt'>) => {
        const settlementData = { ...settlement, createdAt: new Date().toISOString() };
        try {
            await addDoc(collection(db, 'settlements'), settlementData);
            addLog(`تسجيل تسوية لـ ${settlement.gatewayId} بقيمة ${settlement.amount} ر.س`);
            addToast('تم تسجيل التسوية بنجاح!');
        } catch (e) {
            console.error("Error adding settlement:", e);
            addToast('خطأ: لم يتم تسجيل التسوية.');
        }
    };

    const addFundsToPurchaser = async (purchaserId: string, amount: number, notes: string) => {
        const purchaser = purchasers.find(p => p.id === purchaserId);
        if (!purchaser) {
            addToast('لم يتم العثور على مسؤول المشتريات.');
            return;
        }
        
        const description = `تحويل عهدة إلى ${purchaser.name}${notes ? ` - ${notes}` : ''}`;
        const expenseData = {
            description,
            amount,
            category: 'تحويل عهدة',
            date: new Date().toISOString().split('T')[0],
            purchaserId,
            createdAt: new Date().toISOString()
        };

        const batch = writeBatch(db);
        // Add 'transfer' expense for auditing
        batch.set(doc(collection(db, 'expenses')), expenseData);
        // Update purchaser balance
        batch.update(doc(db, 'purchasers', purchaserId), { balance: purchaser.balance + amount });

        try {
            await batch.commit();
            addLog(`تحويل عهدة إلى ${purchaser.name} بقيمة ${amount} ر.س`);
            addToast('تم تحويل الأموال للعهدة بنجاح!');
        } catch(e) {
            console.error("Error transferring funds:", e);
            addToast('خطأ: لم يتم تحويل الأموال.');
        }
    };
    
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-SA', { style: 'currency', currency: 'SAR' }).format(amount);
    
    // Auth not implemented, so just show a loader or the app if user is set.
    if (!user) {
        // Here you would typically have a login screen.
        // For now, let's just show a simple message.
        return <div className="min-h-screen bg-gray-900 text-gray-200 flex items-center justify-center">
            <div className="text-center">
                <MahwousLogo className="w-40 h-40 mx-auto mb-4"/>
                <h1 className="text-2xl">الرجاء تسجيل الدخول للمتابعة.</h1>
            </div>
        </div>
    }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex" dir="rtl">
      <aside className="w-72 bg-gray-800 p-4 border-l border-gray-700 flex flex-col">
        <div className="flex flex-col items-center mb-10">
          <h1 className="text-2xl font-bold text-center text-amber-400 mb-2">محاسبة مهووس</h1>
          <MahwousLogo className="w-28 h-28"/>
        </div>
        <nav className="flex flex-col space-y-2 flex-grow">
          <NavItem icon={<HomeIcon />} label="الرئيسية" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem icon={<ArchiveBoxIcon />} label="الطلبات" active={activeView === 'orders'} onClick={() => setActiveView('orders')} />
          <NavItem icon={<UsersIcon />} label="الموردين" active={activeView === 'suppliers'} onClick={() => setActiveView('suppliers')} />
          {user.role === 'admin' && (
            <>
              <NavItem icon={<CreditCardIcon />} label="مسؤول المشتريات" active={activeView === 'purchasing'} onClick={() => setActiveView('purchasing')} />
              <NavItem icon={<ChartBarIcon />} label="المصروفات" active={activeView === 'expenses'} onClick={() => setActiveView('expenses')} />
            </>
          )}
          <div className="pt-4 mt-4 border-t border-gray-700 space-y-2">
            <h3 className="px-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">أدوات وتحليل</h3>
             {user.role === 'admin' && (
                <>
                  <NavItem icon={<BuildingLibraryIcon />} label="بوابات الدفع" active={activeView === 'gateways'} onClick={() => setActiveView('gateways')} />
                  <NavItem icon={<DocumentChartBarIcon />} label="التقارير" active={activeView === 'reports'} onClick={() => setActiveView('reports')} />
                  <NavItem icon={<DocumentTextIcon />} label="سجل النشاطات" active={activeView === 'logs'} onClick={() => setActiveView('logs')} />
                  <NavItem icon={<Cog6ToothIcon />} label="الإعدادات" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
                </>
            )}
          </div>
        </nav>
        <div className="mt-4">
             <button onClick={handleLogout} className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg text-right transition-all duration-300 text-gray-300 hover:bg-red-500/20 hover:text-red-300`}>
                <LogoutIcon/>
                <span>تسجيل الخروج</span>
            </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        {activeView === 'dashboard' && <DashboardView orders={orders} expenses={expenses} user={user} formatCurrency={formatCurrency} />}
        {activeView === 'orders' && <OrdersView orders={orders} suppliers={suppliers} products={products} addOrder={addOrder} updateOrder={updateOrder} addSupplier={addSupplier} formatCurrency={formatCurrency} />}
        {activeView === 'suppliers' && <SuppliersView supplierBalances={calculations.supplierBalances} addSupplier={addSupplier} purchasers={purchasers} addPayment={addPayment} formatCurrency={formatCurrency} openDetailsModal={(supplier) => setSupplierDetailsModal({ isOpen: true, supplier })} handleGenerateStatement={handleGenerateStatementRequest} />}
        {activeView === 'expenses' && user.role === 'admin' && <ExpensesView expenses={expenses} addExpense={addExpense} expenseCategories={expenseCategories} setExpenseCategories={setExpenseCategories} formatCurrency={formatCurrency} />}
        {activeView === 'purchasing' && user.role === 'admin' && <PurchasingView purchasers={purchasers} expenses={expenses} payments={payments} addFunds={addFundsToPurchaser} accountsPayable={calculations.accountsPayable} openCustodyExpenseModal={() => setIsCustodyExpenseModalOpen(true)} formatCurrency={formatCurrency} />}
        {activeView === 'logs' && user.role === 'admin' && <LogsView logs={logs} />}
        {activeView === 'gateways' && user.role === 'admin' && <GatewaysView orders={orders} settlements={settlements} addSettlement={addSettlement} formatCurrency={formatCurrency} user={user} />}
        {activeView === 'reports' && user.role === 'admin' && <ReportGeneratorView suppliers={suppliers} orders={orders} payments={payments} formatCurrency={formatCurrency} addLog={addLog} preselectedSupplierId={preselectedReportSupplierId} clearPreselection={clearPreselection} />}
        {activeView === 'settings' && user.role === 'admin' && <SettingsView addLog={addLog} addToast={addToast} users={users} bankAccountNumber={bankAccountNumber} />}
      </main>
       {isCustodyExpenseModalOpen && (
        <AddCustodyExpenseModal
          purchasers={purchasers}
          expenseCategories={expenseCategories}
          addCustodyExpense={addCustodyExpense}
          closeModal={() => setIsCustodyExpenseModalOpen(false)}
        />
      )}
      {supplierDetailsModal.isOpen && supplierDetailsModal.supplier && (
        <SupplierDetailsModal
            supplier={supplierDetailsModal.supplier}
            orders={orders}
            payments={payments}
            formatCurrency={formatCurrency}
            closeModal={() => setSupplierDetailsModal({ isOpen: false, supplier: null })}
        />
      )}
    </div>
  );
};

// --- NAVIGATION ITEM ---
interface NavItemProps { icon: React.ReactNode; label: string; active: boolean; onClick: () => void; }
const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex items-center space-x-3 space-x-reverse px-4 py-4 rounded-xl text-right transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-amber-500/10 text-lg ${active ? 'bg-amber-500 text-gray-900 font-bold shadow-md shadow-amber-500/20' : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}`}>
    {icon}
    <span>{label}</span>
  </button>
);


// --- VIEWS ---
interface ViewProps { formatCurrency: (amount: number) => string; }

const KpiCard: React.FC<{title: string, value: number, color: string, textGlowVar: string, formatCurrency: (v: number) => string}> = ({ title, value, color, textGlowVar, formatCurrency }) => (
    <div className={`bg-gray-800 p-6 rounded-lg border border-gray-700 transition-all duration-300 hover:shadow-amber-400/30 hover:shadow-xl hover:-translate-y-1 ${textGlowVar}`}>
        <h3 className="text-gray-400 text-xl">{title}</h3>
        <p className={`text-6xl font-bold mt-2 ${color}`} style={{ textShadow: `0 0 20px var(--glow-color)` }}>{formatCurrency(value)}</p>
    </div>
);

const DetailRow: React.FC<{label: string, value: number, valueColor: string, isTotal?: boolean, formatCurrency: (v: number) => string}> = ({ label, value, valueColor, isTotal, formatCurrency }) => (
    <div className={`flex justify-between items-center ${isTotal ? 'text-xl font-bold' : 'text-lg'}`}>
        <span className="text-gray-300">{label}:</span>
        <span className={`${valueColor} font-mono`}>{formatCurrency(value)}</span>
    </div>
);

const DashboardView: React.FC<{orders: Order[], expenses: Expense[], user: User} & ViewProps> = ({orders, expenses, user, formatCurrency}) => {
    
    const stats = useMemo(() => {
        const completedOrders = orders.filter(o => o.status === 'مكتمل');
        
        const totalSales = completedOrders.reduce((acc, order) => acc + order.orderTotal, 0);
        const aov = completedOrders.length > 0 ? totalSales / completedOrders.length : 0;

        // Use all orders for costs, as fees can apply even to cancelled/returned orders
        const totalGatewayFees = orders.reduce((acc, o) => acc + o.gatewayFee, 0);
        const totalShippingFees = orders.reduce((acc, o) => acc + o.deliveryFee, 0);

        // COGS only for completed orders
        const totalCogs = completedOrders.reduce((acc, order) => acc + order.products.reduce((pAcc, p) => pAcc + p.cost, 0), 0);
        
        const totalExpenses = expenses.filter(exp => exp.category !== 'تحويل عهدة').reduce((acc, exp) => acc + exp.amount, 0);

        // Net Profit Calculation
        const revenueFromCompleted = totalSales;
        const revenueFromOthers = orders.filter(o => o.status !== 'مكتمل').reduce((acc, o) => acc + o.cancellationFee, 0);
        const totalRevenue = revenueFromCompleted + revenueFromOthers;

        const netProfit = totalRevenue - totalCogs - totalGatewayFees - totalShippingFees - totalExpenses;
        
        // Data for charts
        const dailyProfitData = (() => {
            const profitData: {[key: string]: {profit: number, revenue: number}} = {};
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateString = d.toISOString().split('T')[0];
                profitData[dateString] = {profit: 0, revenue: 0};
            }

            orders.forEach(order => {
                const orderDate = order.date.split('T')[0];
                if (profitData[orderDate]) {
                    const totalCost = order.products.reduce((acc, p) => acc + p.cost, 0);
                    let profit = 0;
                    let revenue = 0;
                    if (order.status === 'مكتمل') {
                        revenue = order.orderTotal;
                        profit = revenue - totalCost - order.gatewayFee - order.deliveryFee;
                    } else {
                        revenue = order.cancellationFee;
                        profit = revenue - order.gatewayFee - order.deliveryFee;
                    }
                    profitData[orderDate].profit += profit;
                    profitData[orderDate].revenue += revenue;
                }
            });

            expenses.filter(exp => exp.category !== 'تحويل عهدة').forEach(expense => {
                const expenseDate = expense.date.split('T')[0];
                if (profitData[expenseDate]) {
                    profitData[expenseDate].profit -= expense.amount;
                }
            });
            
            return Object.entries(profitData).map(([date, data]) => ({
                label: new Date(date).toLocaleDateString('ar-SA', { weekday: 'short'}),
                value: user.role === 'admin' ? data.profit : data.revenue
            }));
        })();
        
        const salesByGatewayData = (() => {
            const gatewayData: {[key: string]: number} = {};
            completedOrders.forEach(order => {
                gatewayData[order.paymentMethod] = (gatewayData[order.paymentMethod] || 0) + order.orderTotal;
            });
            const total = Object.values(gatewayData).reduce((sum, val) => sum + val, 0);
            return Object.entries(gatewayData).map(([name, value]) => ({
                name,
                value,
                percentage: total > 0 ? (value / total) * 100 : 0
            }));
        })();

        return { totalSales, netProfit, aov, totalCogs, totalGatewayFees, totalShippingFees, totalExpenses, dailyProfitData, salesByGatewayData };
    }, [orders, expenses, user.role]);
    
    const shippingCostReport = useMemo(() => {
        const costsByCompany: {[key: string]: number} = {};
        
        orders.forEach(order => {
            const companyId = order.shippingCompany;
            const companyName = shippingOptions.find(so => so.id === companyId)?.name || companyId;
            costsByCompany[companyName] = (costsByCompany[companyName] || 0) + order.deliveryFee;
        });

        const reportData = Object.entries(costsByCompany).map(([name, total]) => ({ name, total }));
        const totalCost = reportData.reduce((sum, item) => sum + item.total, 0);

        return { reportData, totalCost };
    }, [orders]);

    const chartTitle = user.role === 'admin' ? 'صافي الربح اليومي (آخر 7 أيام)' : 'إجمالي الإيرادات اليومية (آخر 7 أيام)';

    return (
        <div>
            <h2 className="text-4xl font-bold text-white mb-8">الرئيسية</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                 <KpiCard title="إجمالي المبيعات" value={stats.totalSales} color="text-amber-400" textGlowVar="[--glow-color:rgba(251,191,36,0.5)]" formatCurrency={formatCurrency} />
                <KpiCard title="صافي الربح" value={stats.netProfit} color={stats.netProfit >= 0 ? "text-green-400" : "text-red-400"} textGlowVar={stats.netProfit >= 0 ? "[--glow-color:rgba(74,222,128,0.5)]" : "[--glow-color:rgba(248,113,113,0.5)]"} formatCurrency={formatCurrency} />
                <KpiCard title="متوسط قيمة الطلب (AOV)" value={stats.aov} color="text-blue-400" textGlowVar="[--glow-color:rgba(96,165,250,0.5)]" formatCurrency={formatCurrency} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 bg-gray-800 p-8 rounded-lg border border-gray-700">
                    <h3 className="text-2xl font-bold text-amber-400 mb-6">ملخص مالي مفصل</h3>
                    <div className="space-y-4">
                        <DetailRow label="إجمالي المبيعات (الطلبات المكتملة)" value={stats.totalSales} valueColor="text-green-400" formatCurrency={formatCurrency} />
                        <DetailRow label="رسوم بوابة الدفع (شامل الضريبة)" value={-stats.totalGatewayFees} valueColor="text-red-400" formatCurrency={formatCurrency} />
                        <DetailRow label="تكلفة الشحن (شامل المرتجع)" value={-stats.totalShippingFees} valueColor="text-red-400" formatCurrency={formatCurrency} />
                        <DetailRow label="تكلفة المنتجات (شامل المرتجع)" value={-stats.totalCogs} valueColor="text-red-400" formatCurrency={formatCurrency} />
                        <DetailRow label="مصروفات أخرى" value={-stats.totalExpenses} valueColor="text-red-400" formatCurrency={formatCurrency} />
                        <div className="border-t border-gray-600 my-3 !mt-5 !mb-3"></div>
                        <DetailRow label="صافي الربح النهائي" value={stats.netProfit} valueColor={stats.netProfit >= 0 ? "text-green-400" : "text-red-400"} isTotal={true} formatCurrency={formatCurrency} />
                    </div>
                </div>
                 <div className="lg:col-span-3 bg-gray-800 p-8 rounded-lg border border-gray-700">
                     <h3 className="text-2xl font-bold text-amber-400 mb-6">{chartTitle}</h3>
                     <BarChart data={stats.dailyProfitData} formatCurrency={formatCurrency} />
                </div>
            </div>

            <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-2xl font-bold text-amber-400 mb-4">تقرير التكاليف الإجمالية لشركات الشحن</h3>
                {shippingCostReport.reportData.length > 0 ? (
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-gray-600">
                                <th className="p-3 text-gray-300">الشركة</th>
                                <th className="p-3 text-amber-300">إجمالي التكاليف المُجمَّعة (SAR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shippingCostReport.reportData.map(item => (
                                <tr key={item.name} className="border-b border-gray-700 transition-colors duration-300 hover:bg-gray-700/50">
                                    <td className="p-3 text-white">{item.name}</td>
                                    <td className="p-3 font-mono text-red-400">{formatCurrency(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-amber-400/50">
                                <td className="p-3 font-bold text-amber-400">الإجمالي الكلي لتكاليف الشحن</td>
                                <td className="p-3 font-bold font-mono text-red-400">{formatCurrency(shippingCostReport.totalCost)}</td>
                            </tr>
                        </tfoot>
                    </table>
                ) : (
                    <p className="text-center text-gray-400 p-8">لا توجد بيانات شحن لعرضها.</p>
                )}
            </div>
        </div>
    );
};

const OrdersView: React.FC<{ orders: Order[]; suppliers: Supplier[]; products: MasterProduct[]; addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void; updateOrder: (order: Order) => void; addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier | null>; } & ViewProps> = ({ orders, suppliers, products, addOrder, updateOrder, addSupplier, formatCurrency }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [modalData, setModalData] = useState<PrefilledOrderData | Order | null>(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
        status: 'all' as OrderStatus | 'all',
        paymentMethod: 'all',
        shippingCompany: 'all',
        startDate: '',
        endDate: '',
    });
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFilters(prev => ({...prev, [id]: value}));
    };
    
    const onParseSuccess = (data: ParsedInvoiceData) => {
        setIsInvoiceModalOpen(false);

        const mappedProducts = data.products.flatMap(p => {
            const masterProduct = products.find(mp => mp.name.toLowerCase().trim() === p.name.toLowerCase().trim());
            const quantity = p.quantity || 1;
            if (masterProduct) {
                return Array(quantity).fill({
                    productId: masterProduct.id,
                    name: masterProduct.name,
                    cost: masterProduct.cost,
                    supplierId: masterProduct.supplierId,
                });
            }
            // For products not in our master list, create a placeholder to be filled in the modal.
            return Array(quantity).fill({
                productId: `new_${p.name}_${Math.random()}`, // A temporary unique ID
                name: p.name,
                cost: '' as number | '', // This will signal the modal to show an input
                supplierId: '', // This will signal the modal to show a select
            });
        });
        
        setModalData({
            orderNumber: data.orderNumber,
            customerName: data.customerName,
            orderTotal: data.orderTotal,
            deliveryFee: data.deliveryFee,
            shippingCompany: data.shippingCompany,
            paymentMethod: data.paymentMethod,
            products: mappedProducts
        });
        setIsModalOpen(true);
    };
    
    const openAddModal = () => {
        setModalData(null);
        setIsModalOpen(true);
    };

    const openEditModal = (order: Order) => {
        setModalData(order);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setModalData(null);
        setIsModalOpen(false);
    };

    const filteredOrders = useMemo(() => {
        return orders
            .filter(order => filters.status === 'all' || order.status === filters.status)
            .filter(order => filters.paymentMethod === 'all' || order.paymentMethod === filters.paymentMethod)
            .filter(order => filters.shippingCompany === 'all' || order.shippingCompany === filters.shippingCompany)
            .filter(order => 
                order.orderNumber.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                order.customerName.toLowerCase().includes(filters.searchTerm.toLowerCase())
            )
            .filter(order => {
                if (!filters.startDate) return true;
                return new Date(order.date) >= new Date(filters.startDate);
            })
            .filter(order => {
                if (!filters.endDate) return true;
                return new Date(order.date) <= new Date(filters.endDate + 'T23:59:59');
            });
    }, [orders, filters]);

    const getStatusChipColor = (status: OrderStatus) => {
        switch (status) {
            case 'مكتمل': return 'bg-green-500/20 text-green-300';
            case 'ملغي': return 'bg-red-500/20 text-red-300';
            case 'مرتجع': return 'bg-yellow-500/20 text-yellow-300';
            default: return 'bg-gray-500/20 text-gray-300';
        }
    };

    return(
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">إدارة الطلبات</h2>
                <div className="flex gap-2">
                    <button onClick={() => setIsInvoiceModalOpen(true)} className="flex items-center gap-2 bg-blue-600 text-white font-bold px-5 py-3 rounded-lg hover:bg-blue-500 transition-colors shadow-md hover:shadow-blue-500/30">
                        <SparklesIcon className="w-5 h-5" />
                        إضافة من فاتورة (AI)
                    </button>
                    <button onClick={openAddModal} className="flex items-center gap-2 bg-amber-500 text-gray-900 font-bold px-5 py-3 rounded-lg hover:bg-amber-400 transition-colors shadow-md hover:shadow-amber-500/30">
                        <PlusIcon className="w-5 h-5" />
                        إضافة طلب
                    </button>
                </div>
            </div>
            <div className="mb-4 bg-gray-800 p-4 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input className="lg:col-span-4" label="بحث..." id="searchTerm" type="text" placeholder="رقم الطلب أو اسم العميل" value={filters.searchTerm} onChange={handleFilterChange} />
                <Input label="تصفية حسب الحالة" id="status" type="select" value={filters.status} onChange={handleFilterChange}>
                    <option value="all">الكل</option>
                    <option value="مكتمل">مكتمل</option>
                    <option value="ملغي">ملغي</option>
                    <option value="مرتجع">مرتجع</option>
                </Input>
                <Input label="بوابة الدفع" id="paymentMethod" type="select" value={filters.paymentMethod} onChange={handleFilterChange}>
                    <option value="all">الكل</option>
                    {paymentGateways.map(gw => <option key={gw.id} value={gw.id}>{gw.name}</option>)}
                </Input>
                <Input label="شركة الشحن" id="shippingCompany" type="select" value={filters.shippingCompany} onChange={handleFilterChange}>
                    <option value="all">الكل</option>
                    {shippingOptions.map(so => <option key={so.id} value={so.id}>{so.name}</option>)}
                </Input>
                <div className="grid grid-cols-2 gap-2">
                    <Input label="من تاريخ" id="startDate" type="date" value={filters.startDate} onChange={handleFilterChange} />
                    <Input label="إلى تاريخ" id="endDate" type="date" value={filters.endDate} onChange={handleFilterChange} />
                </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                {filteredOrders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="p-3 text-amber-300">رقم الطلب</th>
                                    <th className="p-3 text-gray-300">العميل</th>
                                    <th className="p-3 text-gray-300">إجمالي البيع</th>
                                    <th className="p-3 text-gray-300">رسوم الدفع</th>
                                    <th className="p-3 text-gray-300">تكلفة الشحن</th>
                                    <th className="p-3 text-gray-300">تكلفة المنتجات (COGS)</th>
                                    <th className="p-3 text-gray-300">صافي الربح</th>
                                    <th className="p-3 text-gray-300">الحالة</th>
                                    <th className="p-3 text-gray-300">تاريخ الطلب</th>
                                    <th className="p-3 text-gray-300">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOrders.map(order => {
                                    const totalCost = order.products.reduce((acc, p) => acc + p.cost, 0);
                                    let profit;
                                    let revenue;
                                    
                                    if(order.status === 'مكتمل') {
                                        revenue = order.orderTotal;
                                        profit = revenue - totalCost - order.gatewayFee - order.deliveryFee;
                                    } else {
                                        revenue = order.cancellationFee;
                                        profit = revenue - order.gatewayFee - order.deliveryFee;
                                    }

                                    return (
                                        <tr key={order.id} className="border-b border-gray-700 transition-all duration-300 hover:bg-gray-700/50">
                                            <td className="p-3 font-mono text-amber-300">{order.orderNumber}</td>
                                            <td className="p-3 text-white">{order.customerName}</td>
                                            <td className="p-3 text-white font-mono">{formatCurrency(revenue)}</td>
                                            <td className="p-3 text-red-400 font-mono">-{formatCurrency(order.gatewayFee)}</td>
                                            <td className="p-3 text-red-400 font-mono">-{formatCurrency(order.deliveryFee)}</td>
                                            <td className="p-3 text-red-400 font-mono">{order.status === 'مكتمل' ? `-${formatCurrency(totalCost)}` : '-'}</td>
                                            <td className={`p-3 font-bold font-mono ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(profit)}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusChipColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="p-3 text-sm text-gray-300 font-mono">{formatDate(order.date)}</td>
                                            <td className="p-3">
                                                <button onClick={() => openEditModal(order)} className="text-gray-400 hover:text-amber-400 p-1">
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-400 p-8">لا توجد طلبات تطابق بحثك.</p>
                )}
            </div>
            {isInvoiceModalOpen && <AddFromInvoiceModal closeModal={() => setIsInvoiceModalOpen(false)} onParseSuccess={onParseSuccess} />}
            {isModalOpen && <AddOrderModal modalData={modalData} orders={orders} suppliers={suppliers} masterProducts={products} addOrder={addOrder} updateOrder={updateOrder} addSupplier={addSupplier} closeModal={closeModal} />}
        </div>
    );
};

const SuppliersView: React.FC<{ 
    supplierBalances: ({ id: string; name: string; contact: string; city: string; email?: string; address?: string; balance: number; })[]; 
    addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier | null>; 
    purchasers: Purchaser[]; 
    addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void; 
    openDetailsModal: (supplier: Supplier) => void;
    handleGenerateStatement: (supplierId: string) => void;
} & ViewProps> = ({ supplierBalances, addSupplier, purchasers, addPayment, openDetailsModal, handleGenerateStatement, formatCurrency }) => {
    const [newSupplierData, setNewSupplierData] = useState({ name: '', contact: '', city: '', email: '', address: '' });
    const [paymentModalState, setPaymentModalState] = useState<{isOpen: boolean; supplier: Supplier | null}>({isOpen: false, supplier: null});
    const [searchTerm, setSearchTerm] = useState('');
    const [cityFilter, setCityFilter] = useState('all');

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewSupplierData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleAddSupplier = async (e: React.FormEvent) => {
        e.preventDefault();
        const newSupplier = await addSupplier(newSupplierData);
        if (newSupplier) {
            setNewSupplierData({ name: '', contact: '', city: '', email: '', address: '' });
        }
    };
    
    const openPaymentModal = (supplier: Supplier) => {
        setPaymentModalState({isOpen: true, supplier});
    };

    const cities = useMemo(() => {
        const allCities = supplierBalances.map(s => s.city.trim()).filter(Boolean);
        return ['all', ...Array.from(new Set(allCities))];
    }, [supplierBalances]);

    const filteredSuppliers = useMemo(() => {
        return supplierBalances
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter(s => cityFilter === 'all' || s.city === cityFilter);
    }, [supplierBalances, searchTerm, cityFilter]);

    return(
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">الموردين</h2>
            <form onSubmit={handleAddSupplier} className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                    <Input
                        className="lg:col-span-2"
                        label="اسم المورد الجديد"
                        id="name"
                        type="text"
                        value={newSupplierData.name}
                        onChange={handleFormChange}
                        placeholder="اسم المورد"
                        required
                    />
                    <Input
                        label="رقم الجوال"
                        id="contact"
                        type="tel"
                        value={newSupplierData.contact}
                        onChange={handleFormChange}
                        placeholder="05xxxxxxxx"
                        required
                    />
                    <Input
                        label="المدينة"
                        id="city"
                        type="text"
                        value={newSupplierData.city}
                        onChange={handleFormChange}
                        placeholder="الرياض"
                        required
                    />
                    <Input
                        label="البريد الإلكتروني (اختياري)"
                        id="email"
                        type="email"
                        value={newSupplierData.email}
                        onChange={handleFormChange}
                        placeholder="example@domain.com"
                    />
                     <Input
                        label="العنوان (اختياري)"
                        id="address"
                        type="text"
                        value={newSupplierData.address}
                        onChange={handleFormChange}
                        placeholder="الحي، الشارع..."
                    />
                    <button type="submit" className="lg:col-span-6 bg-amber-500 text-gray-900 font-bold px-5 py-3 rounded-lg hover:bg-amber-400 transition-colors h-14 shadow-md hover:shadow-amber-500/30">إضافة مورد</button>
                </div>
            </form>
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="بحث عن مورد..." id="supplierSearch" type="text" placeholder="اسم المورد" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                <Input label="تصفية حسب المدينة" id="cityFilter" type="select" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
                    {cities.map(city => (
                        <option key={city} value={city}>{city === 'all' ? 'كل المدن' : city}</option>
                    ))}
                </Input>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSuppliers.map(s => (
                    <div key={s.id} className="bg-gray-800 p-5 rounded-lg border border-gray-700 flex flex-col justify-between transition-all duration-300 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-400/30 hover:-translate-y-1">
                        <div>
                            <h3 className="text-xl font-bold text-amber-400">{s.name}</h3>
                            <div className="text-md text-gray-400 mt-2 space-y-1">
                                <p>المدينة: {s.city}</p>
                                <p>للتواصل: {s.contact}</p>
                                {s.email && <p>البريد: {s.email}</p>}
                                {s.address && <p>العنوان: {s.address}</p>}
                            </div>
                            <p className="text-gray-400 mt-4 text-lg">إجمالي المستحقات</p>
                            <p className={`text-3xl font-semibold mt-1 ${s.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(s.balance)}</p>
                        </div>
                        <div className="mt-4 flex flex-col gap-2">
                            <button onClick={() => openPaymentModal(s)} className="w-full bg-amber-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-amber-500 transition-colors text-lg">
                                سداد دفعة
                            </button>
                            <div className="flex gap-2">
                                <button onClick={() => openDetailsModal(s)} className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-gray-200 font-semibold py-2 px-3 rounded-lg hover:bg-gray-500 transition-colors text-sm">
                                    <DocumentTextIcon className="w-4 h-4"/>
                                    تفاصيل
                                </button>
                                <button onClick={() => handleGenerateStatement(s.id)} className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-gray-200 font-semibold py-2 px-3 rounded-lg hover:bg-gray-500 transition-colors text-sm">
                                    <DocumentChartBarIcon className="w-4 h-4"/>
                                    تقرير
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {paymentModalState.isOpen && paymentModalState.supplier && (
                <AddPaymentModal
                    supplier={paymentModalState.supplier}
                    purchasers={purchasers}
                    addPayment={addPayment}
                    closeModal={() => setPaymentModalState({isOpen: false, supplier: null})}
                />
            )}
        </div>
    );
};

const PurchasingView: React.FC<{
    purchasers: Purchaser[];
    expenses: Expense[];
    payments: Payment[];
    addFunds: (purchaserId: string, amount: number, notes: string) => void;
    accountsPayable: number;
    openCustodyExpenseModal: () => void;
} & ViewProps> = ({ purchasers, expenses, payments, addFunds, accountsPayable, openCustodyExpenseModal, formatCurrency }) => {
    const [selectedPurchaser, setSelectedPurchaser] = useState(purchasers[0]?.id || '');
    const [amount, setAmount] = useState<number|''>('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if(!selectedPurchaser && purchasers.length > 0) {
            setSelectedPurchaser(purchasers[0].id);
        }
    }, [purchasers, selectedPurchaser]);

    const handleAddFunds = (e: React.FormEvent) => {
        e.preventDefault();
        if(selectedPurchaser && amount && amount > 0 && notes.trim()) {
            addFunds(selectedPurchaser, amount, notes.trim());
            setAmount('');
            setNotes('');
        }
    }
    
    const purchaserDetails = useMemo(() => {
        return purchasers.map(p => {
            const totalReceived = expenses.filter(e => e.category === 'تحويل عهدة' && e.purchaserId === p.id).reduce((sum, e) => sum + e.amount, 0);
            
            const paymentsFromCustody = payments
                .filter(pay => pay.sourceType === 'custody' && pay.purchaserId === p.id)
                .reduce((sum, pay) => sum + pay.amount, 0);
                
            const expensesFromCustody = expenses
                .filter(exp => exp.purchaserId === p.id && exp.category !== 'تحويل عهدة')
                .reduce((sum, exp) => sum + exp.amount, 0);

            const totalCustodyExpenses = paymentsFromCustody + expensesFromCustody;

            return {
                ...p,
                totalReceived,
                totalCustodyExpenses,
            };
        });
    }, [purchasers, expenses, payments]);

    return (
         <div>
            <h2 className="text-3xl font-bold text-white mb-6">مسؤول المشتريات</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h3 className="text-2xl font-bold text-amber-400 mb-4">أرصدة مدراء المشتريات (العهد)</h3>
                         <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-gray-600">
                                    <th className="p-3 text-gray-300">المدير</th>
                                    <th className="p-3 text-gray-300">إجمالي العهدة المستلمة</th>
                                    <th className="p-3 text-gray-300">إجمالي المصروفات من العهدة</th>
                                    <th className="p-3 text-amber-300">الرصيد المتبقي (العهدة)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchaserDetails.map(p => (
                                    <tr key={p.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                        <td className="p-3 font-bold text-white">{p.name}</td>
                                        <td className="p-3 font-mono text-blue-400">{formatCurrency(p.totalReceived)}</td>
                                        <td className="p-3 font-mono text-green-400">{formatCurrency(p.totalCustodyExpenses)}</td>
                                        <td className="p-3 font-mono text-amber-400 font-bold">{formatCurrency(p.balance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-8 bg-gray-800 p-5 rounded-lg border border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-1">
                        <h3 className="text-xl font-bold text-amber-400">إجمالي الذمم الدائنة</h3>
                        <p className="text-gray-400 mt-2">المبلغ الإجمالي المستحق لجميع الموردين</p>
                        <p className="text-3xl font-semibold text-red-500 mt-1">{formatCurrency(accountsPayable)}</p>
                    </div>
                </div>
                <div className="space-y-4">
                     <form onSubmit={handleAddFunds} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">إضافة مبلغ في حساب مسؤول المشتريات</h3>
                        <div className="grid grid-cols-1 gap-4 items-end">
                             <Input
                                label="اختر مسؤول المشتريات"
                                id="purchaserSelect"
                                type="select"
                                value={selectedPurchaser}
                                onChange={(e) => setSelectedPurchaser(e.target.value)}
                                disabled={!purchasers.length}
                            >
                                {purchasers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                             </Input>
                             <Input
                                label="المبلغ (ر.س)"
                                id="custodyAmount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                                placeholder="5000"
                                required
                            />
                            <Input
                                label="ملاحظات"
                                id="notes"
                                type="textarea"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="مثال: دفعة مستعجلة للمورد أحمد"
                                required
                                tooltip="هذا المبلغ لا يعتبر مصروفًا، بل تحويل داخلي لرصيد مسؤول المشتريات."
                            />
                            <button type="submit" className="bg-amber-500 text-gray-900 font-bold px-5 py-3 rounded-lg hover:bg-amber-400 transition-colors h-14 shadow-md hover:shadow-amber-500/30">تحويل للعهدة</button>
                        </div>
                    </form>
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-2">إجراءات العهدة</h3>
                        <p className="text-gray-400 mb-4 text-sm">تسجيل المصروفات التشغيلية التي تمت من خلال رصيد العهدة.</p>
                        <button onClick={openCustodyExpenseModal} className="w-full bg-blue-600 text-white font-bold px-5 py-3 rounded-lg hover:bg-blue-500 transition-colors h-14 shadow-md hover:shadow-blue-500/30">تسجيل صرف من العهدة</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ExpensesView: React.FC<{ expenses: Expense[]; addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void; expenseCategories: string[]; setExpenseCategories: React.Dispatch<React.SetStateAction<string[]>>; } & ViewProps> = ({ expenses, addExpense, expenseCategories, setExpenseCategories, formatCurrency }) => {
    const initialFormState = {
        description: '',
        amount: '' as number | '',
        category: expenseCategories[0] || 'أخرى',
        date: new Date().toISOString().split('T')[0]
    };
    const [formData, setFormData] = useState(initialFormState);
    const [newCategory, setNewCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Update form if categories change (e.g. from firestore)
        if (!expenseCategories.includes(formData.category)) {
            setFormData(prev => ({ ...prev, category: expenseCategories[0] || 'أخرى' }));
        }
    }, [expenseCategories, formData.category]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        const fieldName = id.startsWith('expense') ? id.substring(7).toLowerCase() : id;

        setFormData(prev => ({
            ...prev,
            [fieldName]: fieldName === 'amount' ? (value === '' ? '' : parseFloat(value)) : value
        }));
        
        if (fieldName === 'category' && value !== 'add_new') {
            setNewCategory('');
        }
    };
    
    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const { description, amount, date } = formData;
        let finalCategory = formData.category;

        if (finalCategory === 'add_new') {
            const trimmedNewCategory = newCategory.trim();
            if (!trimmedNewCategory) {
                alert('الرجاء إدخال اسم الفئة الجديدة.');
                return;
            }
            finalCategory = trimmedNewCategory;
            if (!expenseCategories.includes(finalCategory)) {
                const newCategories = [...expenseCategories, finalCategory].sort();
                await setDoc(doc(db, "settings", "app"), { expenseCategories: newCategories }, { merge: true });
            }
        }

        if(description && amount !== '' && amount > 0 && date) {
            await addExpense({ description, amount, category: finalCategory, date });
            // Reset form
            setFormData({
                ...initialFormState,
                category: expenseCategories[0] || 'أخرى'
            });
            setNewCategory('');
        }
    };

    const filteredExpenses = useMemo(() => {
        return expenses
            .filter(e => e.category !== 'تحويل عهدة')
            .filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [expenses, searchTerm]);

    return(
         <div>
            <h2 className="text-3xl font-bold text-white mb-6">المصروفات</h2>
            <form onSubmit={handleAddExpense} className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <Input
                        className="md:col-span-2"
                        label="وصف المصروف"
                        id="expenseDescription"
                        type="text"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="مثال: إعلان سناب شات"
                        required
                    />
                    <Input
                        label="المبلغ (ر.س)"
                        id="expenseAmount"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="150"
                        required
                    />
                     <Input
                        label="تاريخ المصروف"
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                    />
                    <div className="flex flex-col justify-end h-full">
                         <label htmlFor="category" className="block text-md font-medium text-gray-300 mb-1.5">الفئة</label>
                         <select id="category" value={formData.category} onChange={handleChange} className="w-full p-3 rounded-lg border focus:ring-amber-500 focus:border-amber-500 transition-colors text-lg bg-gray-700 border-gray-600 text-white">
                            {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="add_new" className="text-amber-400 font-bold">➕ إضافة فئة جديدة...</option>
                        </select>
                         {formData.category === 'add_new' && (
                            <input
                                type="text"
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                placeholder="اسم الفئة الجديدة"
                                required
                                className="mt-2 w-full p-3 rounded-lg border bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-amber-500 focus:border-amber-500 transition-colors text-lg"
                            />
                        )}
                    </div>
                    <button type="submit" className="bg-amber-500 text-gray-900 font-bold px-5 py-3 rounded-lg hover:bg-amber-400 transition-colors h-14 shadow-md hover:shadow-amber-500/30 self-end">إضافة مصروف</button>
                </div>
            </form>
            <div className="mb-4">
                <Input label="بحث عن مصروف..." id="expenseSearch" type="text" placeholder="وصف المصروف" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                {filteredExpenses.length > 0 ? (
                    <table className="w-full text-right">
                        <thead><tr className="border-b border-gray-600"><th className="p-3 text-gray-300">الوصف</th><th className="p-3 text-gray-300">الفئة</th><th className="p-3 text-gray-300">المبلغ</th><th className="p-3 text-gray-300">التاريخ</th></tr></thead>
                        <tbody>
                            {filteredExpenses.map(exp => (
                                <tr key={exp.id} className="border-b border-gray-700 transition-colors duration-300 hover:bg-pink-500/10 hover:outline hover:outline-1 hover:outline-pink-500/50">
                                    <td className="p-3 text-white">{exp.description}</td>
                                    <td className="p-3"><span className="bg-gray-600 text-gray-200 px-2 py-1 text-xs rounded-full">{exp.category}</span></td>
                                    <td className="p-3 text-red-500 font-mono">{formatCurrency(exp.amount)}</td>
                                    <td className="p-3 text-sm text-gray-300">{formatDate(exp.date)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-center text-gray-400 p-8">لا توجد مصروفات تطابق بحثك.</p>}
            </div>
        </div>
    );
};

const LogsView: React.FC<{logs: Log[]}> = ({ logs }) => {
    return (
         <div>
            <h2 className="text-3xl font-bold text-white mb-6">سجل النشاطات</h2>
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                {logs.length > 0 ? (
                    <div className="overflow-x-auto max-h-[75vh]">
                        <table className="w-full text-right">
                            <thead><tr className="border-b border-gray-600 sticky top-0 bg-gray-800"><th className="p-3 text-amber-300">التوقيت</th><th className="p-3 text-gray-300">المستخدم</th><th className="p-3 text-gray-300">الإجراء</th></tr></thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id} className="border-b border-gray-700 transition-colors duration-300 hover:bg-pink-500/10 hover:outline hover:outline-1 hover:outline-pink-500/50">
                                        <td className="p-3 text-sm text-gray-300 font-mono">{formatDateTime(log.timestamp)}</td>
                                        <td className="p-3 text-amber-300">{log.user}</td>
                                        <td className="p-3 text-white">{log.action}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className="text-center text-gray-400 p-8">لا توجد نشاطات مسجلة.</p>}
            </div>
        </div>
    );
};

const GatewaysView: React.FC<{
    orders: Order[];
    settlements: Settlement[];
    addSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => void;
    user: User;
} & ViewProps> = ({ orders, settlements, addSettlement, user, formatCurrency }) => {
    const [settlementModalState, setSettlementModalState] = useState<{ isOpen: boolean; gatewayName: string | null }>({ isOpen: false, gatewayName: null });
    const [detailsModalState, setDetailsModalState] = useState<{ isOpen: boolean; gatewayName: string | null }>({ isOpen: false, gatewayName: null });

    const displayGateways = useMemo(() => {
        const groupedGateway = {
            name: 'Apple Pay / فيزا / ماستركارد',
            ids: ['Apple Pay', 'فيزا/ماستركارد'],
            icon: <div className="flex -space-x-4"><ApplePayIcon className="w-10 h-10 border-2 border-gray-700 rounded-full" /><VisaMastercardIcon className="w-10 h-10 border-2 border-gray-700 rounded-full" /></div>,
            color: 'border-gray-400/50'
        };

        const otherGateways = paymentGateways
            .filter(gw => !['Apple Pay', 'فيزا/ماستركارد'].includes(gw.id))
            .map(gw => ({
                name: gw.name,
                ids: [gw.id],
                icon: gw.icon,
                color: gw.color
            }));

        return [groupedGateway, ...otherGateways];
    }, []);

    const gatewayStats = useMemo(() => {
        return displayGateways.map(dg => {
            const relevantOrders = orders.filter(o => o.status === 'مكتمل' && dg.ids.includes(o.paymentMethod));
            const relevantSettlements = settlements.filter(s => s.gatewayId === dg.name);

            const revenue = relevantOrders.reduce((acc, o) => acc + o.orderTotal, 0);
            const fees = relevantOrders.reduce((acc, o) => acc + o.gatewayFee, 0);
            const settled = relevantSettlements.reduce((acc, s) => acc + s.amount, 0);
            const outstanding = (revenue - fees) - settled;

            return {
                ...dg,
                revenue,
                fees,
                count: relevantOrders.length,
                settled,
                outstanding
            };
        });
    }, [orders, settlements, displayGateways]);

    const openSettlementModal = (gatewayName: string) => {
        setSettlementModalState({ isOpen: true, gatewayName });
    };
    
    const openDetailsModal = (gatewayName: string) => {
        setDetailsModalState({ isOpen: true, gatewayName });
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">أداء وتسوية بوابات الدفع</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gatewayStats.map(gw => (
                    <div key={gw.name} className={`bg-gray-800/50 backdrop-blur-sm border-2 ${gw.color} rounded-2xl p-5 flex flex-col space-y-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}>
                        <div className="flex items-center gap-4">
                            {gw.icon}
                            <h3 className="text-xl font-bold text-white">{gw.name}</h3>
                        </div>
                        <div className="space-y-2 text-md">
                            <div className="flex justify-between items-center"><span className="text-gray-400">إجمالي الإيرادات:</span><span className="font-semibold text-green-400 font-mono">{formatCurrency(gw.revenue)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-gray-400">إجمالي الرسوم:</span><span className="font-semibold text-red-400 font-mono">-{formatCurrency(gw.fees)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-gray-400">عدد العمليات:</span><span className="font-semibold text-gray-200 font-mono">{gw.count}</span></div>
                            <div className="border-t border-gray-600/50 my-2"></div>
                             <div className="flex justify-between items-center"><span className="text-gray-400">المبلغ المسدد:</span><span className="font-semibold text-blue-400 font-mono">{formatCurrency(gw.settled)}</span></div>
                            <div className={`flex justify-between items-center font-bold text-lg`}>
                                <div className="flex items-center gap-1.5">
                                    <span className={`${gw.outstanding > 0 ? 'text-amber-400' : 'text-green-400'}`}>الرصيد المستحق:</span>
                                    <Tooltip text="الرصيد المستحق = (الإيرادات - الرسوم) - المبلغ المسدد.">
                                        <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500" />
                                    </Tooltip>
                                </div>
                                <span className={`font-mono ${gw.outstanding > 0 ? 'text-amber-400' : 'text-green-400'}`}>{formatCurrency(gw.outstanding)}</span>
                            </div>
                        </div>
                         <div className="flex gap-2 mt-auto">
                            <button onClick={() => openDetailsModal(gw.name)} className="flex-1 flex items-center justify-center gap-2 bg-gray-700/50 text-gray-300 font-bold py-3 px-4 rounded-lg hover:bg-gray-600/50 border border-gray-600 transition-colors text-md">
                                <DocumentTextIcon className="w-5 h-5"/>
                                عرض التفاصيل
                            </button>
                            <button onClick={() => openSettlementModal(gw.name)} className="flex-1 bg-gray-600/50 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-500/50 border border-gray-500 transition-colors text-md">
                                تسجيل دفعة تسوية
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {settlementModalState.isOpen && settlementModalState.gatewayName && (
                <AddSettlementModal
                    gatewayName={settlementModalState.gatewayName}
                    addSettlement={addSettlement}
                    closeModal={() => setSettlementModalState({ isOpen: false, gatewayName: null })}
                    user={user}
                />
            )}
            {detailsModalState.isOpen && detailsModalState.gatewayName && (
                <GatewayDetailsModal
                    gatewayName={detailsModalState.gatewayName}
                    orders={orders}
                    settlements={settlements}
                    formatCurrency={formatCurrency}
                    closeModal={() => setDetailsModalState({ isOpen: false, gatewayName: null })}
                />
            )}
        </div>
    );
};

const SettingsView: React.FC<{
    addLog: (action: string) => void;
    addToast: (message: string) => void;
    users: User[];
    bankAccountNumber: string;
}> = ({ addLog, addToast, users, bankAccountNumber }) => {
    
    const [newUserData, setNewUserData] = useState({username: '', role: 'employee' as UserRole, email: '', password: ''});
    const [newBankAccountNumber, setNewBankAccountNumber] = useState(bankAccountNumber);

    useEffect(() => {
        setNewBankAccountNumber(bankAccountNumber);
    }, [bankAccountNumber]);

    const handleExport = () => {
        // This function would need significant changes to export from firestore.
        // For now, it's a placeholder.
        addToast('وظيفة التصدير تتطلب تكامل من جهة الخادم.');
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        // This function would need significant changes to import to firestore.
        addToast('وظيفة الاستيراد تتطلب تكامل من جهة الخادم.');
    };
    
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const { username, email, password, role } = newUserData;
        if (username.trim() === '') {
            addToast('اسم المستخدم لا يمكن أن يكون فارغًا.');
            return;
        }
        if (email.trim() === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            addToast('الرجاء إدخال بريد إلكتروني صحيح.');
            return;
        }
        if (password.length < 6) {
             addToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
            return;
        }
        if (users.some(u => u.username === username.trim())) {
            addToast('اسم المستخدم موجود مسبقًا.');
            return;
        }
        if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
            addToast('البريد الإلكتروني مستخدم مسبقًا.');
            return;
        }

        try {
            // In a real app, you'd use Firebase Auth to create a user.
            // Here we just add to the 'users' collection for display.
            const userData = {
                username: username.trim(),
                email: email.trim(),
                role
            };
            await addDoc(collection(db, 'users'), userData);
            addLog(`إضافة مستخدم جديد: ${username.trim()} (${email.trim()})`);
            addToast(`تمت إضافة المستخدم ${username.trim()} بنجاح.`);
            setNewUserData({username: '', role: 'employee', email: '', password: ''});
        } catch (e) {
            console.error("Error adding user:", e);
            addToast('خطأ: لم يتم إضافة المستخدم.');
        }
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if(username === 'admin') {
            addToast('لا يمكن حذف المستخدم المسؤول.');
            return;
        }
        if (window.confirm(`هل أنت متأكد من حذف المستخدم ${username}؟`)) {
            try {
                await deleteDoc(doc(db, 'users', userId));
                addLog(`حذف المستخدم: ${username}`);
                addToast(`تم حذف المستخدم ${username}.`);
            } catch (e) {
                 console.error("Error deleting user:", e);
                addToast('خطأ: لم يتم حذف المستخدم.');
            }
        }
    };

    const handleSaveSettings = async () => {
        try {
            await setDoc(doc(db, "settings", "app"), { bankAccountNumber: newBankAccountNumber }, { merge: true });
            addLog('تحديث رقم الحساب البنكي');
            addToast('تم حفظ الإعدادات بنجاح.');
        } catch (e) {
            console.error("Error saving settings:", e);
            addToast('خطأ: لم يتم حفظ الإعدادات.');
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">الإعدادات</h2>
            <div className="space-y-8">
                 <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-bold text-amber-400 mb-4">إدارة المستخدمين</h3>
                    <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-4">
                        <Input className="md:col-span-1" label="اسم المستخدم" id="newUsername" type="text" value={newUserData.username} onChange={e => setNewUserData(prev => ({...prev, username: e.target.value}))} required/>
                        <Input className="md:col-span-2" label="البريد الإلكتروني" id="newUserEmail" type="email" value={newUserData.email} onChange={e => setNewUserData(prev => ({...prev, email: e.target.value}))} required/>
                        <Input className="md:col-span-1" label="كلمة المرور" id="newUserPassword" type="password" value={newUserData.password} onChange={e => setNewUserData(prev => ({...prev, password: e.target.value}))} required/>
                        <Input className="md:col-span-1" label="الصلاحية" id="newUserRole" type="select" value={newUserData.role} onChange={e => setNewUserData(prev => ({...prev, role: e.target.value as UserRole}))}>
                            <option value="employee">موظف</option>
                            <option value="admin">مسؤول</option>
                        </Input>
                        <button type="submit" className="md:col-span-5 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-500 transition-colors">إضافة مستخدم</button>
                    </form>
                     <div className="space-y-2">
                        {users.map(user => (
                            <div key={user.id} className="flex justify-between items-center bg-gray-700 p-3 rounded-md">
                                <div>
                                    <p className="font-bold text-white">{user.username}</p>
                                    <p className="text-sm text-gray-400">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                     <span className={`text-xs px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-600 text-gray-300'}`}>{user.role === 'admin' ? 'مسؤول' : 'موظف'}</span>
                                    <button onClick={() => handleDeleteUser(user.id, user.username)} className="text-red-400 hover:text-red-300 disabled:opacity-50" disabled={user.username === 'admin'}>
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-bold text-amber-400 mb-4">معلومات الحساب البنكي</h3>
                     <Input label="رقم الحساب البنكي (IBAN)" id="bankAccount" type="text" value={newBankAccountNumber} onChange={e => setNewBankAccountNumber(e.target.value)} placeholder="SA..." />
                </div>
                 <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <button onClick={handleSaveSettings} className="w-full bg-amber-500 text-gray-900 font-bold p-3 rounded-lg hover:bg-amber-400 transition-colors shadow-lg hover:shadow-amber-500/30">حفظ الإعدادات</button>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-xl font-bold text-amber-400">إدارة البيانات (غير مفعل)</h3>
                        <Tooltip text="تتطلب هذه الوظائف تكاملاً مع خادم خلفي لإدارة الملفات بشكل آمن.">
                             <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500" />
                        </Tooltip>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <button onClick={handleExport} className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-500 transition-colors text-lg disabled:bg-gray-600 disabled:cursor-not-allowed" disabled>تصدير نسخة احتياطية (JSON)</button>
                        <label className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-500 transition-colors text-center cursor-pointer text-lg disabled:bg-gray-600 disabled:cursor-not-allowed">
                            <span className="opacity-50">استيراد نسخة احتياطية (JSON)</span>
                            <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MODALS ---
const SectionHeader: React.FC<{title: string}> = ({title}) => (
    <div className="pt-4 border-t border-gray-700">
        <h4 className="font-bold mb-3 text-amber-400">{title}</h4>
    </div>
);

type ModalOrderProduct = {
    productId: string;
    name: string;
    cost: number | '';
    supplierId: string;
}

const AddSupplierModal: React.FC<{
    onAddSupplier: (supplierData: Omit<Supplier, 'id'>) => void;
    closeModal: () => void;
}> = ({ onAddSupplier, closeModal }) => {
    const [formData, setFormData] = useState({ name: '', contact: '', city: '', email: '', address: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddSupplier(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
            <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-lg flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">إضافة مورد جديد</h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input label="اسم المورد" id="name" type="text" value={formData.name} onChange={handleChange} required />
                    <Input label="رقم الجوال" id="contact" type="tel" value={formData.contact} onChange={handleChange} placeholder="05xxxxxxxx" required />
                    <Input label="المدينة" id="city" type="text" value={formData.city} onChange={handleChange} required />
                    <Input label="البريد الإلكتروني (اختياري)" id="email" type="email" value={formData.email} onChange={handleChange} />
                    <Input label="العنوان (اختياري)" id="address" type="text" value={formData.address} onChange={handleChange} />
                    <button type="submit" className="w-full bg-amber-500 text-gray-900 font-bold p-3 rounded-lg hover:bg-amber-400 transition-colors">حفظ المورد</button>
                </form>
            </div>
        </div>
    );
};


const AddOrderModal: React.FC<{modalData?: PrefilledOrderData | Order | null, orders: Order[], suppliers: Supplier[], masterProducts: MasterProduct[], addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => void, updateOrder: (order: Order) => void, addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier | null>, closeModal: () => void}> = ({ modalData, orders, suppliers, masterProducts, addOrder, updateOrder, addSupplier, closeModal }) => {
    const isEditing = modalData && 'id' in modalData;
    const initialOrder = isEditing ? (modalData as Order) : null;
    const prefilledData = !isEditing ? (modalData as PrefilledOrderData) : null;

    const [formData, setFormData] = useState({
        orderNumber: '',
        customerName: '',
        orderTotal: '' as number | '',
        deliveryFee: '' as number | '',
        gatewayFee: '' as number | '',
        shippingCompany: shippingOptions[0].id,
        paymentMethod: paymentGateways[0].id,
        date: new Date().toISOString().split('T')[0],
        status: 'مكتمل' as OrderStatus,
        cancellationFee: 0,
    });
    
    const [products, setProducts] = useState<ModalOrderProduct[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [productIndexForSupplierAdd, setProductIndexForSupplierAdd] = useState<number | null>(null);
    const [isGoodwill, setIsGoodwill] = useState(false);

    useEffect(() => {
        if (modalData) {
            if (isEditing) {
                const orderToEdit = modalData as Order;
                setFormData({
                    orderNumber: orderToEdit.orderNumber,
                    customerName: orderToEdit.customerName,
                    orderTotal: orderToEdit.orderTotal,
                    deliveryFee: orderToEdit.deliveryFee,
                    gatewayFee: orderToEdit.gatewayFee,
                    shippingCompany: orderToEdit.shippingCompany,
                    paymentMethod: orderToEdit.paymentMethod,
                    date: orderToEdit.date,
                    status: orderToEdit.status,
                    cancellationFee: orderToEdit.cancellationFee,
                });
                setProducts(orderToEdit.products.map(p => ({...p, cost: p.cost ?? ''})));
                 if (orderToEdit.status !== 'مكتمل' && orderToEdit.cancellationFee === 0) {
                    setIsGoodwill(true);
                } else {
                    setIsGoodwill(false);
                }
            } else {
                 const prefilled = modalData as PrefilledOrderData;
                 setFormData(prev => ({
                    ...prev,
                    orderNumber: prefilled.orderNumber || '',
                    customerName: prefilled.customerName || '',
                    orderTotal: prefilled.orderTotal || '',
                    deliveryFee: prefilled.deliveryFee || '',
                    shippingCompany: prefilled.shippingCompany && shippingOptions.some(s => s.id === prefilled.shippingCompany) ? prefilled.shippingCompany : prev.shippingCompany,
                    paymentMethod: prefilled.paymentMethod && paymentGateways.some(p => p.id === prefilled.paymentMethod) ? prefilled.paymentMethod : prev.paymentMethod,
                }));
                setProducts(prefilled.products as ModalOrderProduct[] || []);
            }
        }
    }, [modalData, isEditing]);


    useEffect(() => {
        const selectedShipping = shippingOptions.find(s => s.id === formData.shippingCompany);
        if (selectedShipping && selectedShipping.cost !== null) {
            setFormData(prev => ({...prev, deliveryFee: selectedShipping.cost}));
        }
    }, [formData.shippingCompany]);
    
    useEffect(() => {
        const selectedPayment = paymentGateways.find(p => p.id === formData.paymentMethod);
        const orderTotal = typeof formData.orderTotal === 'number' ? formData.orderTotal : 0;
        if (selectedPayment && orderTotal > 0) {
            const fee = selectedPayment.feeRule(orderTotal);
            setFormData(prev => ({...prev, gatewayFee: parseFloat(fee.toFixed(2))}));
        } else {
             setFormData(prev => ({...prev, gatewayFee: 0}));
        }
    }, [formData.paymentMethod, formData.orderTotal]);

    useEffect(() => {
        if (isGoodwill) {
            setFormData(prev => ({ ...prev, cancellationFee: 0 }));
        }
    }, [isGoodwill]);
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        const isNumberField = ['orderTotal', 'deliveryFee', 'gatewayFee', 'cancellationFee'].includes(id);
        setFormData(prev => ({
            ...prev,
            [id]: isNumberField ? (value === '' ? '' : parseFloat(value)) : value
        }));
    };

    const handleAddProduct = () => {
        const productToAddName = productSearch.trim();
        if (!productToAddName) return;

        const masterProduct = masterProducts.find(p => p.name.toLowerCase() === productToAddName.toLowerCase());
        
        let newOrderProduct: ModalOrderProduct;

        if (masterProduct) {
            newOrderProduct = {
                productId: masterProduct.id,
                name: masterProduct.name,
                cost: masterProduct.cost,
                supplierId: masterProduct.supplierId,
            };
        } else {
            // New product not in master list
            newOrderProduct = {
                productId: `new_${productToAddName}_${Date.now()}`,
                name: productToAddName,
                cost: '', // Needs to be filled
                supplierId: '', // Needs to be filled
            };
        }
        setProducts(prev => [...prev, newOrderProduct]);
        setProductSearch(''); // Reset search field
    };


    const handleProductUpdate = (index: number, field: 'cost' | 'supplierId', value: string) => {
        if (field === 'supplierId' && value === 'add_new_supplier') {
            setProductIndexForSupplierAdd(index);
            setIsSupplierModalOpen(true);
        } else {
            setProducts(currentProducts => {
                const newProducts = [...currentProducts];
                const productToUpdate = { ...newProducts[index] };
                if (field === 'cost') {
                    productToUpdate.cost = value === '' ? '' : parseFloat(value);
                } else {
                    productToUpdate.supplierId = value;
                }
                newProducts[index] = productToUpdate;
                return newProducts;
            });
        }
    };
    
    const handleAddNewSupplier = async (supplierData: Omit<Supplier, 'id'>) => {
        const newSupplier = await addSupplier(supplierData);
        if (newSupplier && productIndexForSupplierAdd !== null) {
            handleProductUpdate(productIndexForSupplierAdd, 'supplierId', newSupplier.id);
            setIsSupplierModalOpen(false);
            setProductIndexForSupplierAdd(null);
        }
    };

    const removeProduct = (index: number) => {
        setProducts(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isEditing && orders.some(o => o.orderNumber.trim() === formData.orderNumber.trim() && formData.orderNumber.trim() !== '')) {
            alert('رقم الطلب موجود مسبقاً. الرجاء إدخال رقم فريد.');
            return;
        }
        if (isEditing && initialOrder && orders.some(o => o.orderNumber.trim() === formData.orderNumber.trim() && o.id !== initialOrder.id)) {
            alert('رقم الطلب موجود مسبقاً لطلب آخر.');
            return;
        }


        const incompleteProduct = products.find(p => p.cost === '' || p.cost <= 0 || !p.supplierId);
        if (incompleteProduct) {
            alert(`الرجاء إكمال بيانات المنتج: "${incompleteProduct.name}". يجب إدخال تكلفة صالحة واختيار مورد.`);
            return;
        }

        const { orderNumber, customerName, orderTotal, deliveryFee, gatewayFee, shippingCompany, paymentMethod, date, status, cancellationFee } = formData;
        if (orderNumber && customerName && date && orderTotal !== '' && orderTotal > 0 && deliveryFee !== '' && deliveryFee >= 0 && gatewayFee !== '' && gatewayFee >= 0 && products.length > 0 && shippingCompany && paymentMethod) {
            
            const finalProducts: OrderProduct[] = products.map(p => ({
                ...p,
                cost: p.cost as number,
            }));

            if (isEditing && initialOrder) {
                const updatedOrderData: Order = {
                    ...initialOrder,
                    orderNumber, customerName, shippingCompany, paymentMethod, date, status,
                    orderTotal: Number(orderTotal),
                    deliveryFee: Number(deliveryFee),
                    gatewayFee: Number(gatewayFee),
                    products: finalProducts,
                    cancellationFee: Number(cancellationFee),
                };
                updateOrder(updatedOrderData);
            } else {
                 addOrder({ 
                    orderNumber, customerName, orderTotal, deliveryFee, gatewayFee, date,
                    products: finalProducts, 
                    shippingCompany, paymentMethod, status: 'مكتمل', cancellationFee: 0,
                });
            }
            
            closeModal();
        } else {
            alert('يرجى تعبئة جميع الحقول وإضافة منتج واحد على الأقل.');
        }
    };

    const modalTitle = isEditing
        ? `تعديل الطلب #${initialOrder?.orderNumber}`
        : (prefilledData ? 'مراجعة الطلب المستورد' : 'إضافة طلب جديد');

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            {isSupplierModalOpen && (
                <AddSupplierModal
                    onAddSupplier={handleAddNewSupplier}
                    closeModal={() => setIsSupplierModalOpen(false)}
                />
            )}
            <div className="bg-gray-800 rounded-xl w-full max-w-3xl border border-gray-700 shadow-lg max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">{modalTitle}</h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto" id="add-order-form">
                    <SectionHeader title="معلومات الطلب الأساسية" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input label="رقم الطلب (إجباري)" id="orderNumber" type="text" placeholder="1001" value={formData.orderNumber} onChange={handleFormChange} required />
                        <Input label="اسم العميل" id="customerName" type="text" placeholder="اسم العميل" value={formData.customerName} onChange={handleFormChange} required />
                        <Input label="إجمالي الطلب (ر.س)" id="orderTotal" type="number" placeholder="350" value={formData.orderTotal} onChange={handleFormChange} required />
                        <Input label="تاريخ الطلب" id="date" type="date" value={formData.date} onChange={handleFormChange} required />
                    </div>
                    
                    <SectionHeader title="الشحن والدفع" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="طريقة الدفع" id="paymentMethod" type="select" value={formData.paymentMethod} onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))} required>
                            {paymentGateways.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
                        </Input>
                        <Input label="شركة الشحن" id="shippingCompany" type="select" value={formData.shippingCompany} onChange={(e) => setFormData(prev => ({ ...prev, shippingCompany: e.target.value }))} required>
                            {shippingOptions.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name} {s.cost !== null ? `(${s.cost} ر.س)` : ''}</option>)}
                        </Input>
                    </div>

                    <SectionHeader title="الرسوم والتكاليف" />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="تكلفة التوصيل (ر.س)" id="deliveryFee" type="number" placeholder="28" value={formData.deliveryFee} onChange={handleFormChange} required />
                        <Input label="رسوم البوابة (ر.س)" id="gatewayFee" type="number" placeholder="5.25" value={formData.gatewayFee} onChange={handleFormChange} required tooltip="يتم حسابها تلقائياً عند تغيير طريقة الدفع أو إجمالي الطلب."/>
                    </div>
                    
                    {isEditing && (
                        <>
                            <SectionHeader title="حالة الطلب" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-gray-900/50 p-4 rounded-lg">
                                <Input label="تغيير حالة الطلب" id="status" type="select" value={formData.status} onChange={handleFormChange}>
                                    <option value="مكتمل">مكتمل</option>
                                    <option value="ملغي">ملغي</option>
                                    <option value="مرتجع">مرتجع</option>
                                </Input>

                                {(formData.status === 'ملغي' || formData.status === 'مرتجع') && (
                                    <div>
                                        <Input label="رسوم الإلغاء/الإرجاع" id="cancellationFee" type="number" value={formData.cancellationFee} onChange={handleFormChange} disabled={isGoodwill} />
                                        <div className="flex items-center mt-2 gap-2">
                                            <input id="goodwill" type="checkbox" checked={isGoodwill} onChange={e => setIsGoodwill(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"/>
                                            <label htmlFor="goodwill" className="text-sm text-gray-300">إلغاء بدون رسوم (تسوية ودية)</label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <SectionHeader title="منتجات الطلب (إجباري)" />
                    <div className="space-y-2">
                       {products.map((p, i) => {
                            const isIncomplete = p.cost === '' || !p.supplierId;
                            return (
                                <div key={`${p.productId}-${i}`} className={`flex flex-col sm:flex-row items-center gap-2 p-2 rounded-md ${isIncomplete ? 'bg-red-900/50 border border-red-500/50' : 'bg-gray-700'}`}>
                                    <span className="flex-grow text-gray-200 font-semibold">{p.name}</span>
                                    {isIncomplete ? (
                                        <>
                                            <div className="flex-grow w-full sm:w-auto">
                                                <Input label="التكلفة" id={`cost-${i}`} type="number" value={p.cost} onChange={(e) => handleProductUpdate(i, 'cost', e.target.value)} placeholder="0.00" inputClassName="bg-gray-800 border-gray-600 text-white h-9" required/>
                                            </div>
                                            <div className="flex-grow w-full sm:w-auto">
                                                <Input label="المورد" id={`supplier-${i}`} type="select" value={p.supplierId} onChange={(e) => handleProductUpdate(i, 'supplierId', e.target.value)} inputClassName="bg-gray-800 border-gray-600 text-white h-9" required>
                                                    <option value="" disabled>اختر مورد</option>
                                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    <option value="add_new_supplier" className="text-amber-400 font-bold">➕ إضافة مورد جديد</option>
                                                </Input>
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-sm text-gray-400">التكلفة: <span className="text-red-400">{p.cost} ر.س</span> (المورد: <span className="text-amber-300">{suppliers.find(s=>s.id === p.supplierId)?.name}</span>)</span>
                                    )}
                                    <button type="button" onClick={() => removeProduct(i)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-5 h-5"/></button>
                                </div>
                            );
                        })}
                    </div>
                     <div className="grid grid-cols-12 gap-2 items-end mt-3">
                        <div className="col-span-12 sm:col-span-11 relative">
                            <label htmlFor="productSearch" className="block text-sm font-medium text-gray-400 mb-1">إضافة منتج إضافي</label>
                            <input
                                id="productSearch"
                                type="text"
                                list="master-products-list"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddProduct(); } }}
                                placeholder="اكتب اسم المنتج أو اختر من القائمة"
                                className="w-full p-2 rounded-md border bg-gray-600 border-gray-500 text-white placeholder-gray-400 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                            />
                            <datalist id="master-products-list">
                                {masterProducts.map(p => <option key={p.id} value={p.name} />)}
                            </datalist>
                        </div>
                        <div className="col-span-12 sm:col-span-1 self-end">
                            <button
                                type="button"
                                onClick={handleAddProduct}
                                className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-400 h-10 w-full flex items-center justify-center"
                            >
                                <PlusIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                </form>
                <div className="p-4 bg-gray-800/50 border-t border-gray-700 mt-auto">
                    <button type="submit" form="add-order-form" className="w-full bg-amber-500 text-gray-900 font-bold p-3 rounded-lg hover:bg-amber-400 transition-colors shadow-lg hover:shadow-amber-500/30">{isEditing ? 'حفظ التعديلات' : 'قفل الطلب وحفظ'}</button>
                </div>
            </div>
        </div>
    );
};

const AddPaymentModal: React.FC<{supplier: Supplier, purchasers: Purchaser[], addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => void, closeModal: () => void}> = ({ supplier, purchasers, addPayment, closeModal }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [sourceType, setSourceType] = useState<'treasury' | 'custody'>('treasury');
    const [purchaserId, setPurchaserId] = useState(purchasers[0]?.id || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (sourceType === 'custody' && !purchaserId && purchasers.length > 0) {
            setPurchaserId(purchasers[0].id);
        }
    }, [sourceType, purchaserId, purchasers]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!amount || amount <= 0) {
            alert('الرجاء إدخال مبلغ صحيح.');
            return;
        }
        if(sourceType === 'custody' && !purchaserId) {
            alert('الرجاء اختيار مدير المشتريات.');
            return;
        }
        
        const selectedPurchaser = purchasers.find(p => p.id === purchaserId);
        if(sourceType === 'custody' && selectedPurchaser && selectedPurchaser.balance < amount) {
            alert('رصيد العهدة لمدير المشتريات غير كافٍ.');
            return;
        }

        addPayment({
            supplierId: supplier.id,
            amount,
            sourceType,
            purchaserId: sourceType === 'custody' ? purchaserId : undefined,
            date,
        });
        closeModal();
    };

    return (
         <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-lg flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">سداد دفعة للمورد: {supplier.name}</h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input
                        label="المبلغ (ر.س)"
                        id="paymentAmount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="500"
                        required
                    />
                    <Input
                        label="تاريخ التحويل"
                        id="paymentDate"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                    <Input
                        label="مصدر الدفعة"
                        id="sourceType"
                        type="select"
                        value={sourceType}
                        onChange={(e) => setSourceType(e.target.value as any)}
                    >
                        <option value="treasury">من الخزينة مباشرة</option>
                        <option value="custody">من رصيد العهدة</option>
                    </Input>
                    {sourceType === 'custody' && (
                         <Input
                            label="مدير المشتريات"
                            id="purchaserId"
                            type="select"
                            value={purchaserId}
                            onChange={(e) => setPurchaserId(e.target.value)}
                            disabled={!purchasers.length}
                        >
                             {purchasers.length > 0 ? purchasers.map(p => <option key={p.id} value={p.id}>{p.name} (الرصيد: {p.balance} ر.س)</option>) : <option>لا يوجد مديرين</option>}
                        </Input>
                    )}
                     <button type="submit" className="w-full bg-amber-500 text-gray-900 font-bold p-3 rounded-lg hover:bg-amber-400 transition-colors shadow-lg hover:shadow-amber-500/30">تأكيد الدفع</button>
                </form>
            </div>
        </div>
    )
};

const AddSettlementModal: React.FC<{
    gatewayName: string,
    addSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt'>) => void,
    closeModal: () => void,
    user: User,
}> = ({ gatewayName, addSettlement, closeModal, user }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attachment, setAttachment] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachment(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!amount || amount <= 0) {
            setError('الرجاء إدخال مبلغ صحيح.');
            return;
        }
        if (!date) {
            setError('الرجاء تحديد تاريخ التحويل.');
            return;
        }
        if (gatewayName === 'تحويل بنكي' && !attachment) {
            setError('الرجاء إرفاق صورة الإيصال للتحويل البنكي.');
            return;
        }
        if (gatewayName === 'عند الاستلام' && !notes.trim()) {
            setError('الرجاء كتابة ملاحظة لدفعة الدفع عند الاستلام.');
            return;
        }
        
        addSettlement({
            gatewayId: gatewayName,
            amount,
            date,
            attachment: attachment || undefined,
            notes: notes.trim() || undefined,
            user: user.username,
        });
        closeModal();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-lg flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">إضافة دفعة تسوية لـ <span className="text-amber-400">{gatewayName}</span></h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input label="المبلغ الصافي المستلم (ر.س)" id="settlementAmount" type="number" value={amount} onChange={e => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="10000" required tooltip="أدخل المبلغ الذي وصل إلى حسابك البنكي بعد خصم الرسوم."/>
                    <Input label="تاريخ التحويل" id="settlementDate" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    
                    {gatewayName === 'تحويل بنكي' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">إرفاق صورة الإيصال (إجباري)</label>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/10 file:text-amber-300 hover:file:bg-amber-500/20" required/>
                            {attachment && <img src={attachment} alt="Preview" className="mt-2 rounded-md max-h-32"/>}
                        </div>
                    )}

                    {gatewayName === 'عند الاستلام' && (
                         <div>
                            <label htmlFor="settlementNotes" className="block text-sm font-medium text-gray-400 mb-1">ملاحظات (إجباري)</label>
                            <textarea id="settlementNotes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-2 rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-amber-500 focus:border-amber-500 transition-colors" placeholder="مثال: تسوية دفعة المندوب فلان" required></textarea>
                        </div>
                    )}
                    
                    {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-md">{error}</p>}
                    
                    <button type="submit" className="w-full bg-amber-500 text-gray-900 font-bold p-3 rounded-lg hover:bg-amber-400 transition-colors shadow-lg hover:shadow-amber-500/30">تسجيل التسوية</button>
                </form>
            </div>
        </div>
    );
};

const AddCustodyExpenseModal: React.FC<{
    purchasers: Purchaser[];
    expenseCategories: string[];
    addCustodyExpense: (data: { description: string; amount: number; category: string; date: string; purchaserId: string; }) => void;
    closeModal: () => void;
}> = ({ purchasers, expenseCategories, addCustodyExpense, closeModal }) => {
    const initialFormState = {
        description: '',
        amount: '' as number | '',
        category: expenseCategories.filter(c => c !== 'تحويل عهدة')[0] || 'أخرى',
        date: new Date().toISOString().split('T')[0],
        purchaserId: purchasers[0]?.id || ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: id === 'amount' ? (value === '' ? '' : parseFloat(value)) : value
        }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { description, amount, category, date, purchaserId } = formData;
        if (description && amount && category && date && purchaserId) {
             const selectedPurchaser = purchasers.find(p => p.id === purchaserId);
             if (selectedPurchaser && selectedPurchaser.balance < amount) {
                alert('رصيد العهدة للمسؤول المحدد غير كافٍ.');
                return;
             }
            addCustodyExpense({ ...formData, amount });
            closeModal();
        } else {
            alert('الرجاء تعبئة جميع الحقول.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 shadow-lg flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">تسجيل صرف من رصيد العهدة</h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <Input label="اختر مسؤول المشتريات" id="purchaserId" type="select" value={formData.purchaserId} onChange={handleChange} disabled={!purchasers.length}>
                        {purchasers.map(p => <option key={p.id} value={p.id}>{p.name} (الرصيد: {p.balance} ر.س)</option>)}
                    </Input>
                    <Input label="وصف المصروف" id="description" type="text" value={formData.description} onChange={handleChange} placeholder="مثال: لوازم مكتبية" required />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="المبلغ (ر.س)" id="amount" type="number" value={formData.amount} onChange={handleChange} placeholder="150" required />
                        <Input label="تاريخ المصروف" id="date" type="date" value={formData.date} onChange={handleChange} required />
                    </div>
                     <Input label="الفئة" id="category" type="select" value={formData.category} onChange={handleChange}>
                        {expenseCategories.filter(c => c !== 'تحويل عهدة').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Input>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-500 transition-colors">تسجيل وخصم من العهدة</button>
                </form>
            </div>
        </div>
    );
};

const GatewayDetailsModal: React.FC<{
    gatewayName: string,
    orders: Order[],
    settlements: Settlement[],
    formatCurrency: (amount: number) => string,
    closeModal: () => void
}> = ({ gatewayName, orders, settlements, formatCurrency, closeModal }) => {

    const gatewayDetails = useMemo(() => {
        const groupedGatewayName = 'Apple Pay / فيزا / ماستركارد';
        const gatewayIds = gatewayName === groupedGatewayName
            ? ['Apple Pay', 'فيزا/ماستركارد']
            : [gatewayName];

        const relevantOrders = orders.filter(o => o.status === 'مكتمل' && gatewayIds.includes(o.paymentMethod))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const relevantSettlements = settlements.filter(s => s.gatewayId === gatewayName)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalRevenue = relevantOrders.reduce((acc, o) => acc + o.orderTotal, 0);
        const totalFees = relevantOrders.reduce((acc, o) => acc + o.gatewayFee, 0);
        const totalSettled = relevantSettlements.reduce((acc, s) => acc + s.amount, 0);
        const outstandingBalance = (totalRevenue - totalFees) - totalSettled;

        return { relevantOrders, relevantSettlements, totalRevenue, totalFees, totalSettled, outstandingBalance };
    }, [gatewayName, orders, settlements]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl w-full max-w-4xl border border-gray-700 shadow-lg flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">تفاصيل تسوية: <span className="text-amber-400">{gatewayName}</span></h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Orders Section */}
                    <div>
                        <h4 className="font-bold text-lg text-amber-300 mb-2">سجل الطلبات ({gatewayDetails.relevantOrders.length})</h4>
                        <div className="max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg">
                             <table className="w-full text-right text-sm">
                                <thead className="sticky top-0 bg-gray-800"><tr className="border-b border-gray-600"><th className="p-2 text-amber-300">رقم الطلب</th><th className="p-2 text-amber-300">التاريخ</th><th className="p-2 text-amber-300">الإيراد</th><th className="p-2 text-amber-300">الرسوم</th></tr></thead>
                                <tbody>
                                    {gatewayDetails.relevantOrders.length > 0 ? gatewayDetails.relevantOrders.map(o => (
                                        <tr key={o.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="p-2 font-mono">{o.orderNumber}</td>
                                            <td className="p-2 font-mono">{formatDate(o.date)}</td>
                                            <td className="p-2 font-mono text-green-400">{formatCurrency(o.orderTotal)}</td>
                                            <td className="p-2 font-mono text-red-400">{formatCurrency(-o.gatewayFee)}</td>
                                        </tr>
                                    )) : <tr><td colSpan={4} className="p-4 text-center text-gray-400">لا توجد طلبات.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Settlements Section */}
                    <div>
                        <h4 className="font-bold text-lg text-amber-300 mb-2">سجل التسويات ({gatewayDetails.relevantSettlements.length})</h4>
                         <div className="max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg">
                            <table className="w-full text-right text-sm">
                                <thead className="sticky top-0 bg-gray-800"><tr className="border-b border-gray-600"><th className="p-2 text-amber-300">تاريخ التحويل</th><th className="p-2 text-amber-300">المبلغ المستلم</th><th className="p-2 text-amber-300">تمت التسوية بواسطة</th><th className="p-2 text-amber-300">وقت التسجيل</th></tr></thead>
                                <tbody>
                                     {gatewayDetails.relevantSettlements.length > 0 ? gatewayDetails.relevantSettlements.map(s => (
                                        <tr key={s.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                            <td className="p-2 font-mono">{formatDate(s.date)}</td>
                                            <td className="p-2 font-mono text-blue-400">{formatCurrency(s.amount)}</td>
                                            <td className="p-2 text-white">{s.user}</td>
                                            <td className="p-2 font-mono text-xs text-gray-400">{formatDateTime(s.createdAt)}</td>
                                        </tr>
                                    )) : <tr><td colSpan={4} className="p-4 text-center text-gray-400">لا توجد تسويات.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                {/* Summary Section */}
                <div className="p-4 bg-gray-900/50 border-t border-gray-700 mt-auto space-y-2">
                    <div className="flex justify-between items-center text-md"><span className="text-gray-300">إجمالي الإيرادات:</span><span className="font-mono text-green-400 font-bold">{formatCurrency(gatewayDetails.totalRevenue)}</span></div>
                    <div className="flex justify-between items-center text-md"><span className="text-gray-300">إجمالي الرسوم:</span><span className="font-mono text-red-400 font-bold">{formatCurrency(-gatewayDetails.totalFees)}</span></div>
                    <div className="flex justify-between items-center text-md"><span className="text-gray-300">إجمالي المبالغ المسددة:</span><span className="font-mono text-blue-400 font-bold">{formatCurrency(gatewayDetails.totalSettled)}</span></div>
                    <div className="border-t border-gray-600 my-1 !mt-3 !mb-2"></div>
                    <div className="flex justify-between items-center text-xl font-bold"><span className="text-amber-400">الرصيد المستحق النهائي:</span><span className={`font-mono ${gatewayDetails.outstandingBalance > 0 ? 'text-amber-400' : 'text-green-400'}`}>{formatCurrency(gatewayDetails.outstandingBalance)}</span></div>
                </div>
            </div>
        </div>
    );
};

const SupplierDetailsModal: React.FC<{
    supplier: Supplier;
    orders: Order[];
    payments: Payment[];
    formatCurrency: (amount: number) => string;
    closeModal: () => void;
}> = ({ supplier, orders, payments, formatCurrency, closeModal }) => {

    const details = useMemo(() => {
        const debits = orders
            .filter(o => o.status === 'مكتمل')
            .flatMap(o => o.products.filter(p => p.supplierId === supplier.id).map(p => ({
                date: o.date,
                description: `تكلفة بضاعة الطلب #${o.orderNumber}`,
                amount: p.cost
            })))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const credits = payments
            .filter(p => p.supplierId === supplier.id)
            .map(p => ({
                date: p.date,
                description: `دفعة سداد (${p.sourceType === 'custody' ? 'عهدة' : 'خزينة'})`,
                amount: p.amount
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalDebits = debits.reduce((sum, item) => sum + item.amount, 0);
        const totalCredits = credits.reduce((sum, item) => sum + item.amount, 0);
        const balance = totalDebits - totalCredits;

        return { debits, credits, totalDebits, totalCredits, balance };
    }, [supplier.id, orders, payments]);

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl w-full max-w-3xl border border-gray-700 shadow-lg flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">تفاصيل رصيد المورد: <span className="text-amber-400">{supplier.name}</span></h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
                    {/* Debits Section */}
                    <div>
                        <h4 className="font-bold text-lg text-red-400 mb-2">سجل الديون (المدينة)</h4>
                        <div className="max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-2 space-y-2">
                            {details.debits.length > 0 ? details.debits.map((d, i) => (
                                <div key={`debit-${i}`} className="flex justify-between items-center text-sm p-2 bg-gray-700/50 rounded">
                                    <div>
                                        <p className="font-semibold">{d.description}</p>
                                        <p className="text-xs text-gray-400">{formatDate(d.date)}</p>
                                    </div>
                                    <p className="font-mono font-semibold text-red-400">{formatCurrency(d.amount)}</p>
                                </div>
                            )) : <p className="text-center text-gray-400 p-4">لا توجد ديون مسجلة.</p>}
                        </div>
                    </div>
                    {/* Credits Section */}
                    <div>
                         <h4 className="font-bold text-lg text-green-400 mb-2">سجل الدفعات (الدائنة)</h4>
                         <div className="max-h-64 overflow-y-auto bg-gray-900/50 rounded-lg p-2 space-y-2">
                            {details.credits.length > 0 ? details.credits.map((c, i) => (
                                <div key={`credit-${i}`} className="flex justify-between items-center text-sm p-2 bg-gray-700/50 rounded">
                                    <div>
                                        <p className="font-semibold">{c.description}</p>
                                        <p className="text-xs text-gray-400">{formatDate(c.date)}</p>
                                    </div>
                                    <p className="font-mono font-semibold text-green-400">{formatCurrency(c.amount)}</p>
                                </div>
                            )) : <p className="text-center text-gray-400 p-4">لا توجد دفعات مسجلة.</p>}
                        </div>
                    </div>
                </div>
                 {/* Summary Section */}
                <div className="p-4 bg-gray-900/50 border-t border-gray-700 mt-auto space-y-2">
                    <div className="flex justify-between items-center text-md"><span className="text-gray-300">إجمالي الديون (مدين):</span><span className="font-mono text-red-400 font-bold">{formatCurrency(details.totalDebits)}</span></div>
                    <div className="flex justify-between items-center text-md"><span className="text-gray-300">إجمالي الدفعات (دائن):</span><span className="font-mono text-green-400 font-bold">{formatCurrency(details.totalCredits)}</span></div>
                    <div className="border-t border-gray-600 my-1 !mt-3 !mb-2"></div>
                    <div className="flex justify-between items-center text-xl font-bold"><span className="text-amber-400">الرصيد النهائي المستحق:</span><span className={`font-mono ${details.balance > 0 ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(details.balance)}</span></div>
                </div>
            </div>
        </div>
    );
};


const AddFromInvoiceModal: React.FC<{closeModal: () => void, onParseSuccess: (data: ParsedInvoiceData) => void}> = ({ closeModal, onParseSuccess }) => {
    const [invoiceText, setInvoiceText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleParse = async () => {
        if (!process.env.API_KEY) {
            setError("مفتاح Gemini API غير مهيأ. الرجاء الاتصال بمسؤول النظام.");
            return;
        }
        if (!invoiceText.trim()) {
            setError("الرجاء لصق نص الفاتورة.");
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const shippingOptionsForPrompt = shippingOptions.map(s => `- id: '${s.id}', name: '${s.name}'`).join('\n');
            const paymentOptionsForPrompt = paymentGateways.map(p => `- id: '${p.id}', name: '${p.name}'`).join('\n');

            const prompt = `You are an expert accounting assistant. Analyze the following invoice text from an e-commerce store in Saudi Arabia and extract the specified information in a strict JSON format. The invoice is in Arabic.\n\nInvoice Text:\n---\n${invoiceText}\n---\n\n**Mission-Critical Instructions:**\n1.  You **MUST** extract all the fields defined in the JSON schema.\n2.  For 'shippingCompany', you **MUST** identify the shipping provider from the text, find the **exact match** from the 'Known Shipping Options' list, and return its corresponding 'id'. If no clear match is found, you **MUST** return the 'id' for 'أخرى'.\n3.  For 'paymentMethod', you **MUST** identify the payment gateway from the text (e.g., 'مدى', 'تابي', 'تمارا'), find the **exact match** from the 'Known Payment Options' list, and return its 'id'. If no payment method is mentioned, you **MUST** default to the 'id' for 'تحويل بنكي'.\n4.  Extract product names and quantities accurately.\n5.  Return **ONLY** the JSON object, with no additional text or markdown.\n\n**Known Shipping Options:**\n${shippingOptionsForPrompt}\n\n**Known Payment Options:**\n${paymentOptionsForPrompt}`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            orderNumber: { type: Type.STRING },
                            customerName: { type: Type.STRING },
                            orderTotal: { type: Type.NUMBER },
                            deliveryFee: { type: Type.NUMBER },
                            shippingCompany: { type: Type.STRING },
                            paymentMethod: { type: Type.STRING },
                            products: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        quantity: { type: Type.INTEGER }
                                    },
                                    required: ['name', 'quantity']
                                }
                            }
                        },
                         required: ['orderNumber', 'customerName', 'orderTotal', 'deliveryFee', 'shippingCompany', 'paymentMethod', 'products']
                    }
                }
            });

            const parsedData = JSON.parse(response.text);
            onParseSuccess(parsedData);

        } catch (e) {
            console.error("Gemini API Error:", e);
            setError("فشل تحليل الفاتورة. الرجاء المحاولة مرة أخرى أو التأكد من صحة المفتاح.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl w-full max-w-xl border border-gray-700 shadow-lg flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">إضافة طلب من فاتورة (AI)</h3>
                    <button onClick={closeModal} className="text-gray-400 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-gray-400">قم بنسخ ولصق محتوى الفاتورة بالكامل في الحقل أدناه. سيقوم النظام بتحليل البيانات تلقائياً.</p>
                    <textarea 
                        value={invoiceText}
                        onChange={(e) => setInvoiceText(e.target.value)}
                        placeholder="الصق نص الفاتورة هنا..."
                        className="w-full h-48 p-2 rounded-md bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                    />
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>
                <div className="p-4 bg-gray-800/50 border-t border-gray-700 mt-auto">
                    <button onClick={handleParse} disabled={isLoading} className="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-500 transition-colors shadow-lg hover:shadow-blue-500/30 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                جاري التحليل...
                            </>
                        ) : (
                            "تحليل الفاتورة"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- CHART COMPONENTS ---
const BarChart: React.FC<{data: {label: string, value: number}[], formatCurrency: (v:number) => string}> = ({data, formatCurrency}) => {
    const maxValue = Math.max(...data.map(d => Math.abs(d.value)), 1);
    
    return (
        <div className="w-full h-64 flex items-end gap-2" dir="ltr">
            {data.map((d, i) => {
                const isNegative = d.value < 0;
                const barHeight = (Math.abs(d.value) / maxValue) * 100;
                return (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                         <div className={`text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity ${isNegative ? 'text-red-400' : 'text-green-400'}`}>{formatCurrency(d.value)}</div>
                        <div title={`${d.label}: ${formatCurrency(d.value)}`} className="w-full h-full flex items-end">
                            <div
                                className={`w-full rounded-t-md transition-all duration-500 group-hover:opacity-100 opacity-80 ${isNegative ? 'bg-red-400' : 'bg-green-400'}`}
                                style={{ height: `${barHeight}%`, minHeight: '2px' }}
                            />
                        </div>
                         <div className="text-xs text-gray-400 mt-1">{d.label}</div>
                    </div>
                );
            })}
        </div>
    );
};

// --- NEW REPORTING VIEW ---
type ReportTransaction = {
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
};

const ReportGeneratorView: React.FC<{
    suppliers: Supplier[];
    orders: Order[];
    payments: Payment[];
    addLog: (action: string) => void;
    preselectedSupplierId?: string | null;
    clearPreselection: () => void;
} & ViewProps> = ({ suppliers, orders, payments, formatCurrency, addLog, preselectedSupplierId, clearPreselection }) => {
    const [supplierId, setSupplierId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportData, setReportData] = useState<ReportTransaction[] | null>(null);
    const [summary, setSummary] = useState({ initial: 0, debits: 0, credits: 0, final: 0 });
    const [showPrintPreview, setShowPrintPreview] = useState(false);

    useEffect(() => {
        if (preselectedSupplierId) {
            setSupplierId(preselectedSupplierId);
            clearPreselection();
        }
    }, [preselectedSupplierId, clearPreselection]);

    const handleGenerateReport = (format: 'csv' | 'pdf') => {
        if (!supplierId || !startDate || !endDate) {
            alert('الرجاء اختيار المورد وتحديد فترة زمنية.');
            return;
        }

        const selectedSupplier = suppliers.find(s => s.id === supplierId);
        if (!selectedSupplier) return;

        // 1. Calculate initial balance before start date
        let initialBalance = 0;
        orders.forEach(order => {
            if (order.status === 'مكتمل' && new Date(order.date) < new Date(startDate)) {
                order.products.forEach(p => {
                    if (p.supplierId === supplierId) initialBalance += p.cost;
                });
            }
        });
        payments.forEach(p => {
            if (p.supplierId === supplierId && new Date(p.date) < new Date(startDate)) {
                initialBalance -= p.amount;
            }
        });
        
        // 2. Get transactions within the date range
        const debitTransactions = orders
            .filter(o => o.status === 'مكتمل' && new Date(o.date) >= new Date(startDate) && new Date(o.date) <= new Date(endDate + 'T23:59:59'))
            .flatMap(o => o.products.filter(p => p.supplierId === supplierId).map(p => ({
                date: o.date,
                description: `تكلفة بضاعة الطلب #${o.orderNumber}`,
                debit: p.cost,
                credit: 0
            })));

        const creditTransactions = payments
            .filter(p => p.supplierId === supplierId && new Date(p.date) >= new Date(startDate) && new Date(p.date) <= new Date(endDate + 'T23:59:59'))
            .map(p => ({
                date: p.date,
                description: `دفعة سداد`,
                debit: 0,
                credit: p.amount
            }));
            
        // 3. Combine, sort, and calculate running balance
        const allTransactions = [...debitTransactions, ...creditTransactions]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let currentBalance = initialBalance;
        const processedTransactions: ReportTransaction[] = allTransactions.map(tx => {
            currentBalance = currentBalance + tx.debit - tx.credit;
            return { ...tx, date: formatDate(tx.date), balance: currentBalance };
        });

        const totalDebits = processedTransactions.reduce((sum, tx) => sum + tx.debit, 0);
        const totalCredits = processedTransactions.reduce((sum, tx) => sum + tx.credit, 0);

        setReportData(processedTransactions);
        setSummary({ initial: initialBalance, debits: totalDebits, credits: totalCredits, final: currentBalance });

        addLog(`توليد كشف حساب للمورد: ${selectedSupplier.name}`);

        if (format === 'csv') {
            exportToCsv(processedTransactions, selectedSupplier.name);
        } else {
            setShowPrintPreview(true);
        }
    };

    const exportToCsv = (data: ReportTransaction[], supplierName: string) => {
        const headers = ["التاريخ", "الوصف", "مدين", "دائن", "الرصيد"];
        const rows = data.map(tx => [tx.date, `"${tx.description}"`, tx.debit, tx.credit, tx.balance]);
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // \uFEFF for BOM to support Arabic in Excel
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");
        
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `kashf_hisab_${supplierName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-white mb-6">مولد التقارير الاحترافي</h2>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold text-amber-400 mb-4">كشف حساب تدقيقي للمورد</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <Input label="اختر المورد" id="supplier" type="select" value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
                        <option value="" disabled>-- اختر --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Input>
                    <div className="grid grid-cols-2 gap-2">
                        <Input label="من تاريخ" id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                        <Input label="إلى تاريخ" id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                    </div>
                     <div className="flex gap-2">
                        <button onClick={() => handleGenerateReport('pdf')} className="flex-1 bg-red-600 text-white font-bold p-3 rounded-lg hover:bg-red-500 transition-colors h-14">توليد PDF</button>
                        <button onClick={() => handleGenerateReport('csv')} className="flex-1 bg-green-600 text-white font-bold p-3 rounded-lg hover:bg-green-500 transition-colors h-14">توليد CSV</button>
                    </div>
                </div>
            </div>
            {showPrintPreview && reportData && (
                <SupplierStatementPrintView
                    supplier={suppliers.find(s => s.id === supplierId)!}
                    data={reportData}
                    summary={summary}
                    startDate={startDate}
                    endDate={endDate}
                    formatCurrency={formatCurrency}
                    onClose={() => setShowPrintPreview(false)}
                />
            )}
        </div>
    );
};

const SupplierStatementPrintView: React.FC<{
    supplier: Supplier;
    data: ReportTransaction[];
    summary: { initial: number, debits: number, credits: number, final: number };
    startDate: string;
    endDate: string;
    onClose: () => void;
} & ViewProps> = ({ supplier, data, summary, startDate, endDate, formatCurrency, onClose }) => {
    
    const printContentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const printWindow = window.open('', '_blank');
        if (printWindow && printContentRef.current) {
            const content = printContentRef.current.innerHTML;
            printWindow.document.write(`
                <html>
                    <head>
                        <title>كشف حساب المورد: ${supplier.name}</title>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
                        <style>
                            body { font-family: 'Tajawal', sans-serif; direction: rtl; }
                            @page { size: A4; margin: 20mm; }
                            table { width: 100%; border-collapse: collapse; }
                            th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: right; }
                            th { background-color: #f1f5f9; }
                        </style>
                    </head>
                    <body>${content}</body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
        onClose();
    }, [supplier, data, summary, startDate, endDate, onClose]);

    return (
        <div ref={printContentRef} className="hidden">
            <div className="p-8 bg-white text-gray-800">
                <div className="flex justify-between items-start mb-8 pb-4 border-b">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">كشف حساب تدقيقي</h1>
                        <h2 className="text-xl text-gray-700">المورد: {supplier.name}</h2>
                    </div>
                    {/* In a real scenario, you'd use a real image source, but for this self-contained component, an SVG is fine. */}
                    <svg className="w-24 h-24" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="print_gold_gradient" x1="50%" y1="0%" x2="50%" y2="100%">
                                <stop offset="0%" stopColor="#FDE08D" />
                                <stop offset="50%" stopColor="#D97706" />
                                <stop offset="100%" stopColor="#FDE08D" />
                            </linearGradient>
                        </defs>
                        <path d="M80 55 C 60 80, 70 105, 85 105 L 90 105 C 80 100, 80 80, 90 65 L 100 45 L 110 65 C 120 80, 120 100, 110 105 L 115 105 C 130 105, 140 80, 120 55 L 100 20 Z" fill="url(#print_gold_gradient)" />
                        <g transform="translate(0, -5)">
                            <path d="M100 15 L120 30 L80 30 Z" fill="#FBBF24"/>
                            <path d="M100 15 L100 30 L80 30 Z" fill="#FDE08D" opacity="0.8"/>
                            <path d="M100 15 L100 30 L120 30 Z" fill="#D97706" opacity="0.8"/>
                        </g>
                        <text x="100" y="125" fontFamily="Times New Roman, serif" fontSize="24" fill="#333" textAnchor="middle" style={{fontVariant: 'small-caps', letterSpacing: '1px'}}>Mahwous</text>
                        <text x="100" y="148" fontFamily="sans-serif" fontSize="14" fill="#555" textAnchor="middle">Perfume</text>
                        <rect x="20" y="118" width="50" height="3" fill="url(#print_gold_gradient)" rx="1.5" />
                        <rect x="130" y="118" width="50" height="3" fill="url(#print_gold_gradient)" rx="1.5" />
                    </svg>
                </div>
                <p className="mb-4">الفترة: من {formatDate(startDate)} إلى {formatDate(endDate)}</p>
                
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ</th>
                            <th>الوصف</th>
                            <th>مدين (لكم)</th>
                            <th>دائن (عليكم)</th>
                            <th>الرصيد</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={4}><strong>الرصيد الافتتاحي</strong></td>
                            <td><strong>{formatCurrency(summary.initial)}</strong></td>
                        </tr>
                        {data.map((tx, i) => (
                            <tr key={i}>
                                <td>{tx.date}</td>
                                <td>{tx.description}</td>
                                <td>{tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</td>
                                <td>{tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</td>
                                <td>{formatCurrency(tx.balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-100 font-bold">
                            <td colSpan={2}>الإجماليات</td>
                            <td>{formatCurrency(summary.debits)}</td>
                            <td>{formatCurrency(summary.credits)}</td>
                            <td>{formatCurrency(summary.final)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};


const PieChart: React.FC<{data: {name: string, value: number, percentage: number}[], formatCurrency: (v:number) => string}> = ({data, formatCurrency}) => {
    const colors = ['#F59E0B', '#10B981', '#EF4444', '#EC4899', '#3B82F6', '#8B5CF6']; // amber, emerald, red, pink, blue, violet
    let accumulatedPercentage = 0;

    return (
        <div className="flex flex-col gap-4">
            <div className="w-40 h-40 mx-auto rounded-full transition-transform hover:scale-105" style={{
                background: `conic-gradient(${data.map((d, i) => {
                    const color = colors[i % colors.length];
                    const start = accumulatedPercentage;
                    accumulatedPercentage += d.percentage;
                    const end = accumulatedPercentage;
                    return `${color} ${start}% ${end}%`;
                }).join(', ')}, #4b5563 0)`
            }}></div>
            <div className="space-y-2">
                {data.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: colors[i % colors.length]}}></div>
                            <span className="text-gray-300">{d.name}</span>
                        </div>
                        <span className="font-semibold text-white">{formatCurrency(d.value)} <span className="text-xs text-gray-400">({d.percentage.toFixed(1)}%)</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
};


export default AppWrapper;