import React, { useState, useEffect } from 'react';
import { useCMS } from '../../context/CMSContext';
import { api } from '../../lib/api';
import { HeroSlide, Facility, GalleryItem, FeeItem, FacultyMember, Notice, NoticeBannerConfig } from '../../types';
import { FloatingAdminSaveBar } from './FloatingAdminSaveBar';
import {
  School, Image, Camera, Plus, Trash2, Edit3, Save, Check, Palette, Type, Upload, Link as LinkIcon, Monitor, FlaskConical, Cpu, Bus, BookOpen, Trophy, Sparkles, Phone, Mail, MapPin, DollarSign, List, Search, Globe, Share2, Code, CheckCircle2, SearchCode, UserCheck, GraduationCap, Award, Briefcase, ShieldCheck, Wifi, Music, Activity, HeartPulse, Layers, Calendar, PhoneCall, Tag, Star, Database, RefreshCw, Megaphone, Bell, ExternalLink, X
} from 'lucide-react';

export const WebsiteCMSManager: React.FC = () => {
  const { settings, updateSettings, updateContentBlock } = useCMS();
  const [subTab, setSubTab] = useState<'identity' | 'notice_banner' | 'hero' | 'about' | 'faculty' | 'facilities' | 'gallery' | 'fees' | 'theme' | 'textblocks' | 'seo'>('identity');

  // Search filter for text blocks
  const [textSearch, setTextSearch] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [cmsNotices, setCmsNotices] = useState<Notice[]>([]);
  const [showAddNoticeModal, setShowAddNoticeModal] = useState(false);
  const [editingCmsNotice, setEditingCmsNotice] = useState<Notice | null>(null);
  const [newCmsNotice, setNewCmsNotice] = useState({
    title: '',
    content: '',
    category: 'Urgent' as const,
    targetClass: 'All',
    isUrgentTicker: true
  });

  const loadCmsNotices = () => {
    api.getNotices(true).then(data => {
      setCmsNotices(data || []);
    }).catch(() => {});
  };

  useEffect(() => {
    loadCmsNotices();
  }, []);

  if (!settings) return <div className="p-4 text-xs text-slate-500">Loading site settings...</div>;

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleSyncSupabase = async () => {
    setIsSyncingSupabase(true);
    try {
      const res = await api.syncAllToSupabase();
      if (res.success) {
        showNotification(`⚡ Supabase Synced Successfully! (${res.seededCount || 'All'} records updated)`);
      } else {
        showNotification(`⚠️ Sync completed with note: ${res.message || 'Check console'}`);
      }
    } catch (err: any) {
      showNotification('⚠️ Supabase sync completed locally.');
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Helper file uploader with automatic high-speed image compression and persistent server upload
  const handleFileUpload = (callback: (dataUrl: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.type.startsWith('video/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              const resultStr = reader.result.toString();
              api.uploadFile(resultStr, file.name).then(res => {
                callback(res.url || resultStr);
              }).catch(() => callback(resultStr));
            }
          };
          reader.readAsDataURL(file);
          return;
        }

        const img = document.createElement('img');
        const reader = new FileReader();
        reader.onload = (event: any) => {
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const MAX_SIZE = 1200;
            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round((height * MAX_SIZE) / width);
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round((width * MAX_SIZE) / height);
                height = MAX_SIZE;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            let dataUrl = event.target.result;
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              dataUrl = canvas.toDataURL('image/jpeg', 0.82);
            }
            api.uploadFile(dataUrl, file.name).then(res => {
              callback(res.url || dataUrl);
            }).catch(() => callback(dataUrl));
          };
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // --- HERO SLIDES HELPERS ---
  const handleAddSlide = () => {
    const newSlide: HeroSlide = {
      id: 'slide-' + Date.now(),
      badge: 'New Highlight',
      title: 'Excellence in Modern Education',
      subtitle: 'Nurturing future leaders at Model Public School, Sikta.',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1600',
      primaryBtnText: 'Inquire Now',
      primaryBtnUrl: '#admissions',
      secondaryBtnText: 'View Gallery',
      secondaryBtnUrl: '#gallery'
    };
    updateSettings({ hero_slides: [...settings.hero_slides, newSlide] });
    showNotification('New Hero Slide Added!');
  };

  const handleUpdateSlide = (index: number, updated: Partial<HeroSlide>) => {
    const slides = [...settings.hero_slides];
    slides[index] = { ...slides[index], ...updated };
    updateSettings({ hero_slides: slides });
    showNotification('Hero Slide Updated!');
  };

  const handleDeleteSlide = (index: number) => {
    if (settings.hero_slides.length <= 1) {
      alert('You must keep at least 1 hero slide!');
      return;
    }
    const slides = settings.hero_slides.filter((_, i) => i !== index);
    updateSettings({ hero_slides: slides });
    showNotification('Slide Deleted!');
  };

  // --- FACILITIES HELPERS ---
  const handleAddFacility = () => {
    const newFac: Facility = {
      id: 'f-' + Date.now(),
      title: 'New Campus Facility',
      iconName: 'Monitor',
      description: 'State of the art learning equipment and infrastructure.',
      image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=600'
    };
    updateSettings({ facilities: [...settings.facilities, newFac] });
    showNotification('Facility Added!');
  };

  const handleUpdateFacility = (id: string, updated: Partial<Facility>) => {
    const updatedList = settings.facilities.map(f => f.id === id ? { ...f, ...updated } : f);
    updateSettings({ facilities: updatedList });
    showNotification('Facility Updated!');
  };

  const handleDeleteFacility = (id: string) => {
    const updatedList = settings.facilities.filter(f => f.id !== id);
    updateSettings({ facilities: updatedList });
    showNotification('Facility Removed!');
  };

  // --- FACULTY HELPERS ---
  const handleAddFacultyMember = () => {
    const newMember: FacultyMember = {
      id: 'fac-' + Date.now(),
      name: 'New Faculty Educator',
      designation: 'Senior Faculty Member',
      subject: 'Subject & Specialization',
      qualification: 'M.A. / M.Sc., B.Ed.',
      experience: '5+ Years Experience',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600',
      bio: 'Dedicated to fostering holistic academic excellence and student growth.',
      email: 'educator@modelpublicschool.com'
    };
    const currentList = settings.faculty || [];
    updateSettings({ faculty: [newMember, ...currentList] });
    showNotification('New Faculty Member Profile Added!');
  };

  const handleUpdateFacultyMember = (id: string, updated: Partial<FacultyMember>) => {
    const currentList = settings.faculty || [];
    const updatedList = currentList.map(item => item.id === id ? { ...item, ...updated } : item);
    updateSettings({ faculty: updatedList });
    showNotification('Faculty Profile Updated!');
  };

  const handleDeleteFacultyMember = (id: string) => {
    if (!confirm('Are you sure you want to remove this faculty member profile?')) return;
    const currentList = settings.faculty || [];
    const updatedList = currentList.filter(item => item.id !== id);
    updateSettings({ faculty: updatedList });
    showNotification('Faculty Member Profile Removed!');
  };

  // --- GALLERY HELPERS ---
  const handleAddGalleryItem = () => {
    const newItem: GalleryItem = {
      id: 'g-' + Date.now(),
      title: 'Campus Life Photo',
      category: 'Campus',
      url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&q=80&w=800',
      caption: 'Model Public School Sikta activities'
    };
    updateSettings({ gallery: [newItem, ...settings.gallery] });
    showNotification('Gallery Item Added!');
  };

  const handleUpdateGalleryItem = (id: string, updated: Partial<GalleryItem>) => {
    const updatedList = settings.gallery.map(g => g.id === id ? { ...g, ...updated } : g);
    updateSettings({ gallery: updatedList });
    showNotification('Gallery Updated!');
  };

  const handleDeleteGalleryItem = (id: string) => {
    const updatedList = settings.gallery.filter(g => g.id !== id);
    updateSettings({ gallery: updatedList });
    showNotification('Gallery Item Deleted!');
  };

  // --- FEE STRUCTURE HELPERS ---
  const handleAddFeeItem = () => {
    const newItem: FeeItem = {
      id: 'fee-' + Date.now(),
      className: 'Class 11 & 12',
      admissionFee: 7500,
      monthlyTuition: 2200,
      annualCharges: 4000,
      examFee: 1200
    };
    updateSettings({ grade_fees: [...settings.grade_fees, newItem] });
    showNotification('Fee Row Added!');
  };

  const handleUpdateFeeItem = (id: string, updated: Partial<FeeItem>) => {
    const updatedList = settings.grade_fees.map(f => f.id === id ? { ...f, ...updated } : f);
    updateSettings({ grade_fees: updatedList });
    showNotification('Fee Structure Updated!');
  };

  const handleDeleteFeeItem = (id: string) => {
    const updatedList = settings.grade_fees.filter(f => f.id !== id);
    updateSettings({ grade_fees: updatedList });
    showNotification('Fee Row Removed!');
  };

  // Preset Palettes
  const themePresets = [
    { name: 'Warm Academic (Default)', primary: '#1e3a8a', secondary: '#d97706', accent: '#0d9488', bg: '#fcfbf7', card: '#ffffff', text: '#1e293b' },
    { name: 'Royal Indigo Gold', primary: '#3730a3', secondary: '#f59e0b', accent: '#0284c7', bg: '#f8fafc', card: '#ffffff', text: '#0f172a' },
    { name: 'Emerald Forest', primary: '#065f46', secondary: '#ca8a04', accent: '#0891b2', bg: '#f0fdf4', card: '#ffffff', text: '#064e3b' },
    { name: 'Sunset Amber', primary: '#9a3412', secondary: '#d97706', accent: '#2563eb', bg: '#fff7ed', card: '#ffffff', text: '#431407' },
    { name: 'Deep Midnight Slate', primary: '#0f172a', secondary: '#38bdf8', accent: '#10b981', bg: '#020617', card: '#0f172a', text: '#f8fafc' }
  ];

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5 text-amber-300" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        <button
          onClick={() => setSubTab('identity')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'identity' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <School className="w-4 h-4" /> Branding & Logo
        </button>

        <button
          onClick={() => setSubTab('notice_banner')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap font-bold ${
            subTab === 'notice_banner' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Megaphone className="w-4 h-4 text-amber-500" /> Top Notice Banner
        </button>

        <button
          onClick={() => setSubTab('hero')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'hero' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Image className="w-4 h-4" /> Hero Slides & Backgrounds
        </button>

        <button
          onClick={() => setSubTab('about')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'about' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Camera className="w-4 h-4" /> About & Director's Desk
        </button>

        <button
          onClick={() => setSubTab('faculty')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'faculty' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <UserCheck className="w-4 h-4" /> Faculty Members ({(settings.faculty || []).length})
        </button>

        <button
          onClick={() => setSubTab('facilities')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'facilities' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Monitor className="w-4 h-4" /> Campus Facilities ({settings.facilities.length})
        </button>

        <button
          onClick={() => setSubTab('gallery')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'gallery' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Camera className="w-4 h-4" /> Photo Gallery ({settings.gallery.length})
        </button>

        <button
          onClick={() => setSubTab('fees')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'fees' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Fee Table ({settings.grade_fees.length})
        </button>

        <button
          onClick={() => setSubTab('theme')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'theme' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <Palette className="w-4 h-4" /> Theme & Fonts
        </button>

        <button
          onClick={() => setSubTab('seo')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'seo' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <SearchCode className="w-4 h-4" /> SEO & Search Metadata
        </button>

        <button
          onClick={() => setSubTab('textblocks')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            subTab === 'textblocks' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          <List className="w-4 h-4" /> All Text Blocks Editor
        </button>

        <button
          onClick={handleSyncSupabase}
          disabled={isSyncingSupabase}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow transition-all whitespace-nowrap ml-auto"
        >
          {isSyncingSupabase ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 text-emerald-200" />}
          {isSyncingSupabase ? 'Syncing to Supabase...' : 'Sync All Data to Supabase'}
        </button>
      </div>

      {/* --- SUBTAB 1: IDENTITY & BRANDING --- */}
      {subTab === 'identity' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <School className="w-5 h-5 text-amber-500" />
              School Logo & Main Branding Details
            </h3>
            <span className="text-xs text-slate-400">Updates live website headers and footers instantly</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Logo Upload Box */}
            <div className="md:col-span-4 bg-stone-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Official School Logo
              </span>
              <div className="w-28 h-28 mx-auto rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-400 p-2 shadow-md flex items-center justify-center overflow-hidden">
                {settings.logo_url ? (
                  <img src={settings.logo_url} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                ) : (
                  <School className="w-12 h-12 text-amber-500" />
                )}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleFileUpload((url) => {
                    updateSettings({ logo_url: url });
                    showNotification('Logo Image Uploaded!');
                  })}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> Upload New Logo Photo
                </button>

                <input
                  type="text"
                  placeholder="Or paste Logo URL"
                  value={settings.logo_url || ''}
                  onChange={e => updateSettings({ logo_url: e.target.value })}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* School Text Details */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
              <div className="sm:col-span-2">
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">School Name</label>
                <input
                  type="text"
                  value={settings.school_name}
                  onChange={e => updateSettings({ school_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">CBSE Affiliation Number</label>
                <input
                  type="text"
                  value={settings.cbse_affiliation}
                  onChange={e => updateSettings({ cbse_affiliation: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">School Tagline</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={e => updateSettings({ tagline: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Contact Phone Numbers</label>
                <input
                  type="text"
                  value={settings.phones}
                  onChange={e => updateSettings({ phones: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Official Email</label>
                <input
                  type="text"
                  value={settings.email}
                  onChange={e => updateSettings({ email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Campus Address</label>
                <textarea
                  rows={2}
                  value={settings.address}
                  onChange={e => updateSettings({ address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB: TOP NOTICE BANNER / TICKER --- */}
      {subTab === 'notice_banner' && (
        <div className="space-y-6">
          {/* Main Top Banner Controls Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                  Top Notice & Announcement Banner Control
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Customizable top headline bar visible on all pages with live ticker, custom badges, and instant links.
                </p>
              </div>

              {/* Master Enabled Switch */}
              <div className="flex items-center gap-3 bg-stone-50 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Banner Visibility:</span>
                <button
                  type="button"
                  onClick={() => {
                    const currentBanner = settings.notice_banner || {
                      enabled: true,
                      badgeText: 'Notice',
                      badgeColor: 'rose',
                      useLiveNotices: true,
                      customText: 'Admissions Open for Session 2026-27 from Nursery to Class 10th. Apply Now!',
                      isMarquee: true,
                      speed: 'normal'
                    };
                    updateSettings({
                      notice_banner: {
                        ...currentBanner,
                        enabled: !(currentBanner.enabled ?? true)
                      }
                    });
                    showNotification('Top Banner Visibility Updated!');
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    (settings.notice_banner?.enabled ?? true) ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      (settings.notice_banner?.enabled ?? true) ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-xs font-black ${(settings.notice_banner?.enabled ?? true) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                  {(settings.notice_banner?.enabled ?? true) ? 'Active (Live)' : 'Hidden'}
                </span>
              </div>
            </div>

            {/* LIVE PREVIEW BOX */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Live Website Banner Preview:
                </span>
                <span className="text-[11px] text-slate-400">(How visitors see the top of your site)</span>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-900/60 p-1 bg-stone-100 dark:bg-slate-950 overflow-hidden shadow-inner">
                <div className="w-full bg-slate-900 text-white border-b border-slate-800 px-3 sm:px-4 py-2 text-xs flex items-center justify-between gap-3 select-none">
                  <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                    {/* Badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 shadow-sm ${
                      (settings.notice_banner?.badgeColor === 'blue') ? 'bg-sky-500 text-slate-950' :
                      (settings.notice_banner?.badgeColor === 'amber') ? 'bg-amber-400 text-slate-950' :
                      (settings.notice_banner?.badgeColor === 'emerald') ? 'bg-emerald-500 text-slate-950' :
                      (settings.notice_banner?.badgeColor === 'purple') ? 'bg-purple-500 text-white' :
                      (settings.notice_banner?.badgeColor === 'indigo') ? 'bg-indigo-500 text-white' :
                      'bg-rose-500 text-white'
                    }`}>
                      <Bell className="w-2.5 h-2.5 animate-bounce" />
                      {settings.notice_banner?.badgeText || 'Notice'}
                    </span>

                    {/* Announcement text */}
                    <div className="truncate font-semibold text-slate-200">
                      {settings.notice_banner?.useLiveNotices ? (
                        <span>
                          {cmsNotices.filter(n => n.isUrgentTicker).map(n => n.title).join('  ★  ') || 'Admissions Open for Session 2026-27 | Call: +91 87579 68130'}
                        </span>
                      ) : (
                        <span>{settings.notice_banner?.customText || 'Admissions Open for Session 2026-27 from Nursery to Class 10th.'}</span>
                      )}
                    </div>
                  </div>

                  {/* Optional Action Button */}
                  {settings.notice_banner?.linkText && (
                    <a
                      href={settings.notice_banner.linkUrl || '#'}
                      onClick={e => e.preventDefault()}
                      className="shrink-0 bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-lg text-[10px] font-black hover:bg-amber-400 flex items-center gap-1"
                    >
                      {settings.notice_banner.linkText}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* FORM CONFIGURATION FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-2">
              {/* Badge Text & Quick Presets */}
              <div className="md:col-span-6 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Badge Label Text
                </label>
                <input
                  type="text"
                  value={settings.notice_banner?.badgeText || 'Notice'}
                  onChange={e => {
                    const currentBanner = settings.notice_banner || {
                      enabled: true,
                      badgeText: 'Notice',
                      badgeColor: 'rose',
                      useLiveNotices: true,
                      customText: '',
                      isMarquee: true,
                      speed: 'normal'
                    };
                    updateSettings({
                      notice_banner: {
                        ...currentBanner,
                        badgeText: e.target.value
                      }
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  placeholder="e.g. Urgent, Admissions 2026-27, Notice"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Notice', 'Urgent', 'Admissions 2026-27', 'Holiday Alert', 'Exam Schedule', 'Breaking'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const currentBanner = settings.notice_banner || {
                          enabled: true,
                          badgeText: tag,
                          badgeColor: 'rose',
                          useLiveNotices: true,
                          customText: '',
                          isMarquee: true,
                          speed: 'normal'
                        };
                        updateSettings({
                          notice_banner: {
                            ...currentBanner,
                            badgeText: tag
                          }
                        });
                      }}
                      className="px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    >
                      +{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badge Color Preset */}
              <div className="md:col-span-6 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Badge Accent Color
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { id: 'rose', name: 'Rose Red', bg: 'bg-rose-500 text-white' },
                    { id: 'amber', name: 'Amber Gold', bg: 'bg-amber-500 text-slate-950' },
                    { id: 'blue', name: 'Sky Blue', bg: 'bg-sky-500 text-slate-950' },
                    { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500 text-white' },
                    { id: 'purple', name: 'Purple', bg: 'bg-purple-600 text-white' },
                    { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-600 text-white' },
                  ].map(c => {
                    const isSelected = (settings.notice_banner?.badgeColor || 'rose') === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const currentBanner = settings.notice_banner || {
                            enabled: true,
                            badgeText: 'Notice',
                            badgeColor: c.id as any,
                            useLiveNotices: true,
                            customText: '',
                            isMarquee: true,
                            speed: 'normal'
                          };
                          updateSettings({
                            notice_banner: {
                              ...currentBanner,
                              badgeColor: c.id as any
                            }
                          });
                        }}
                        className={`p-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1 transition-all ${c.bg} ${
                          isSelected ? 'ring-2 ring-offset-2 ring-amber-400 shadow-md scale-105' : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        <span>{c.name}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Mode Selection */}
              <div className="md:col-span-12 space-y-3 bg-stone-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Banner Announcement Content Source
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      (settings.notice_banner?.useLiveNotices ?? true)
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 text-amber-950 dark:text-amber-200 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="banner_source"
                      checked={settings.notice_banner?.useLiveNotices ?? true}
                      onChange={() => {
                        const currentBanner = settings.notice_banner || {
                          enabled: true,
                          badgeText: 'Notice',
                          badgeColor: 'rose',
                          useLiveNotices: true,
                          customText: '',
                          isMarquee: true,
                          speed: 'normal'
                        };
                        updateSettings({
                          notice_banner: {
                            ...currentBanner,
                            useLiveNotices: true
                          }
                        });
                      }}
                      className="mt-1 accent-amber-500"
                    />
                    <div>
                      <p className="font-bold text-xs">Live Ticker from Urgent Notices</p>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Automatically feeds and loops all active notice items that have "Live Ticker Active" enabled.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      !(settings.notice_banner?.useLiveNotices ?? true)
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400 text-amber-950 dark:text-amber-200 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="banner_source"
                      checked={!(settings.notice_banner?.useLiveNotices ?? true)}
                      onChange={() => {
                        const currentBanner = settings.notice_banner || {
                          enabled: true,
                          badgeText: 'Notice',
                          badgeColor: 'rose',
                          useLiveNotices: false,
                          customText: '',
                          isMarquee: true,
                          speed: 'normal'
                        };
                        updateSettings({
                          notice_banner: {
                            ...currentBanner,
                            useLiveNotices: false
                          }
                        });
                      }}
                      className="mt-1 accent-amber-500"
                    />
                    <div>
                      <p className="font-bold text-xs">Fixed Custom Announcement Message</p>
                      <p className="text-[11px] opacity-80 mt-0.5">
                        Display a specific custom headline text written by you below.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Custom Textarea if Custom Message Selected */}
                {!(settings.notice_banner?.useLiveNotices ?? true) && (
                  <div className="pt-2 space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Custom Headline Message
                    </label>
                    <textarea
                      rows={2}
                      value={settings.notice_banner?.customText || ''}
                      onChange={e => {
                        const currentBanner = settings.notice_banner || {
                          enabled: true,
                          badgeText: 'Notice',
                          badgeColor: 'rose',
                          useLiveNotices: false,
                          customText: '',
                          isMarquee: true,
                          speed: 'normal'
                        };
                        updateSettings({
                          notice_banner: {
                            ...currentBanner,
                            customText: e.target.value
                          }
                        });
                      }}
                      placeholder="e.g. Admissions Open for 2026-27 (Nursery to 10th). Limited seats available - Apply now at Model Public School, Bhawanipur!"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                    />
                  </div>
                )}
              </div>

              {/* Call-to-Action Link Options */}
              <div className="md:col-span-6 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Action Button Text (Optional)
                </label>
                <input
                  type="text"
                  value={settings.notice_banner?.linkText || ''}
                  onChange={e => {
                    const currentBanner = settings.notice_banner || {
                      enabled: true,
                      badgeText: 'Notice',
                      badgeColor: 'rose',
                      useLiveNotices: true,
                      customText: '',
                      isMarquee: true,
                      speed: 'normal'
                    };
                    updateSettings({
                      notice_banner: {
                        ...currentBanner,
                        linkText: e.target.value
                      }
                    });
                  }}
                  placeholder="e.g. Apply Now, View Details, Download PDF"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="md:col-span-6 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Action Button Link / URL
                </label>
                <input
                  type="text"
                  value={settings.notice_banner?.linkUrl || ''}
                  onChange={e => {
                    const currentBanner = settings.notice_banner || {
                      enabled: true,
                      badgeText: 'Notice',
                      badgeColor: 'rose',
                      useLiveNotices: true,
                      customText: '',
                      isMarquee: true,
                      speed: 'normal'
                    };
                    updateSettings({
                      notice_banner: {
                        ...currentBanner,
                        linkUrl: e.target.value
                      }
                    });
                  }}
                  placeholder="e.g. #admissions, #fees, /portal, or https://..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>

              {/* Marquee and Speed Controls */}
              <div className="md:col-span-6 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Animation Style
                </label>
                <select
                  value={settings.notice_banner?.isMarquee ? 'marquee' : 'static'}
                  onChange={e => {
                    const currentBanner = settings.notice_banner || {
                      enabled: true,
                      badgeText: 'Notice',
                      badgeColor: 'rose',
                      useLiveNotices: true,
                      customText: '',
                      isMarquee: true,
                      speed: 'normal'
                    };
                    updateSettings({
                      notice_banner: {
                        ...currentBanner,
                        isMarquee: e.target.value === 'marquee'
                      }
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="marquee">🌊 Continuous Smooth Marquee Ticker</option>
                  <option value="static">📌 Fixed Compact Bar (No Scroll)</option>
                </select>
              </div>

              <div className="md:col-span-6 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Marquee Scroll Speed
                </label>
                <select
                  value={settings.notice_banner?.speed || 'normal'}
                  onChange={e => {
                    const currentBanner = settings.notice_banner || {
                      enabled: true,
                      badgeText: 'Notice',
                      badgeColor: 'rose',
                      useLiveNotices: true,
                      customText: '',
                      isMarquee: true,
                      speed: 'normal'
                    };
                    updateSettings({
                      notice_banner: {
                        ...currentBanner,
                        speed: e.target.value as any
                      }
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="slow">🐢 Slow & Steady (Easy to Read)</option>
                  <option value="normal">⚡ Normal Speed</option>
                  <option value="fast">🚀 Fast Ticker</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => showNotification('Top Notice Banner Configuration Saved & Broadcasted!')}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Banner Settings
              </button>
            </div>
          </div>

          {/* URGENT NOTICES LIVE STREAM TABLE */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h4 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500" />
                  Urgent Notice Board Items (Feeds Live Ticker)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle which notices appear in the top website banner marquee in real-time.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddNoticeModal(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Urgent Notice
              </button>
            </div>

            {cmsNotices.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No notice items found. Click "+ Add Urgent Notice" above to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {cmsNotices.map(notice => (
                  <div
                    key={notice.id}
                    className="p-4 bg-stone-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {notice.category || 'General'}
                        </span>
                        {notice.isUrgentTicker && (
                          <span className="font-black text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                            ● ON TOP BANNER
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">Target: Class {notice.targetClass || 'All'}</span>
                        <span className="text-[11px] text-slate-400">• {notice.date}</span>
                      </div>
                      <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">{notice.title}</h5>
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-1">{notice.content}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* 1-Click Banner Toggle */}
                      <button
                        type="button"
                        onClick={async () => {
                          const newStatus = !notice.isUrgentTicker;
                          const updated = cmsNotices.map(n => n.id === notice.id ? { ...n, isUrgentTicker: newStatus } : n);
                          setCmsNotices(updated);
                          await api.updateNotice(notice.id, { isUrgentTicker: newStatus });
                          showNotification(newStatus ? 'Notice added to Top Banner Ticker!' : 'Notice removed from Top Banner Ticker.');
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                          notice.isUrgentTicker
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 hover:bg-rose-500/20'
                            : 'bg-stone-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-stone-300 dark:hover:bg-slate-600'
                        }`}
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        {notice.isUrgentTicker ? 'Ticker Active' : 'Enable on Ticker'}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setEditingCmsNotice(notice)}
                        className="p-2 bg-stone-200 dark:bg-slate-700 hover:bg-stone-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl"
                        title="Edit Notice"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Delete notice "${notice.title}"?`)) {
                            setCmsNotices(prev => prev.filter(n => n.id !== notice.id));
                            await api.deleteNotice(notice.id);
                            showNotification('Notice deleted.');
                          }
                        }}
                        className="p-2 bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-xl"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ADD NOTICE MODAL */}
          {showAddNoticeModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-amber-500" />
                    Create New Announcement / Ticker Notice
                  </h4>
                  <button
                    onClick={() => setShowAddNoticeModal(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    const created = await api.createNotice({
                      title: newCmsNotice.title,
                      content: newCmsNotice.content,
                      category: newCmsNotice.category,
                      targetClass: newCmsNotice.targetClass,
                      isUrgentTicker: newCmsNotice.isUrgentTicker
                    });
                    setShowAddNoticeModal(false);
                    setNewCmsNotice({
                      title: '',
                      content: '',
                      category: 'Urgent',
                      targetClass: 'All',
                      isUrgentTicker: true
                    });
                    loadCmsNotices();
                    showNotification('New Notice Created & Added to Ticker!');
                  }}
                  className="space-y-4 text-xs font-medium"
                >
                  <div>
                    <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Notice Headline / Title</label>
                    <input
                      type="text"
                      required
                      value={newCmsNotice.title}
                      onChange={e => setNewCmsNotice({ ...newCmsNotice, title: e.target.value })}
                      placeholder="e.g. Admissions Open 2026-27 (Nursery to 10th)"
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Notice Content / Details</label>
                    <textarea
                      rows={3}
                      required
                      value={newCmsNotice.content}
                      onChange={e => setNewCmsNotice({ ...newCmsNotice, content: e.target.value })}
                      placeholder="Enter the full description or announcement guidelines..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Category</label>
                      <select
                        value={newCmsNotice.category}
                        onChange={e => setNewCmsNotice({ ...newCmsNotice, category: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="Urgent">🚨 Urgent</option>
                        <option value="Admission">🎓 Admission</option>
                        <option value="Academic">📚 Academic</option>
                        <option value="General">📢 General</option>
                        <option value="Holiday">🌴 Holiday</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Target Class</label>
                      <select
                        value={newCmsNotice.targetClass}
                        onChange={e => setNewCmsNotice({ ...newCmsNotice, targetClass: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="All">All Classes (Public)</option>
                        <option value="10">Class 10</option>
                        <option value="9">Class 9</option>
                        <option value="8">Class 8</option>
                        <option value="7">Class 7</option>
                        <option value="6">Class 6</option>
                      </select>
                    </div>
                  </div>

                  {/* Show on Ticker Checkbox */}
                  <label className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCmsNotice.isUrgentTicker}
                      onChange={e => setNewCmsNotice({ ...newCmsNotice, isUrgentTicker: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">Broadcast on Top Live Banner</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Stream this headline across the top ticker marquee</p>
                    </div>
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddNoticeModal(false)}
                      className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-lg"
                    >
                      Publish Notice
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* EDIT NOTICE MODAL */}
          {editingCmsNotice && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h4 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-amber-500" />
                    Edit Notice / Ticker Item
                  </h4>
                  <button
                    onClick={() => setEditingCmsNotice(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    if (!editingCmsNotice) return;
                    await api.updateNotice(editingCmsNotice.id, editingCmsNotice);
                    setEditingCmsNotice(null);
                    loadCmsNotices();
                    showNotification('Notice Updated successfully!');
                  }}
                  className="space-y-4 text-xs font-medium"
                >
                  <div>
                    <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Notice Title</label>
                    <input
                      type="text"
                      required
                      value={editingCmsNotice.title}
                      onChange={e => setEditingCmsNotice({ ...editingCmsNotice, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Content</label>
                    <textarea
                      rows={3}
                      required
                      value={editingCmsNotice.content}
                      onChange={e => setEditingCmsNotice({ ...editingCmsNotice, content: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Category</label>
                      <select
                        value={editingCmsNotice.category}
                        onChange={e => setEditingCmsNotice({ ...editingCmsNotice, category: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="Urgent">🚨 Urgent</option>
                        <option value="Admission">🎓 Admission</option>
                        <option value="Academic">📚 Academic</option>
                        <option value="General">📢 General</option>
                        <option value="Holiday">🌴 Holiday</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Target Class</label>
                      <select
                        value={editingCmsNotice.targetClass || 'All'}
                        onChange={e => setEditingCmsNotice({ ...editingCmsNotice, targetClass: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 font-bold"
                      >
                        <option value="All">All Classes (Public)</option>
                        <option value="10">Class 10</option>
                        <option value="9">Class 9</option>
                        <option value="8">Class 8</option>
                        <option value="7">Class 7</option>
                        <option value="6">Class 6</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingCmsNotice.isUrgentTicker)}
                      onChange={e => setEditingCmsNotice({ ...editingCmsNotice, isUrgentTicker: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-xs">Broadcast on Top Live Banner</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Stream this headline across the top ticker marquee</p>
                    </div>
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingCmsNotice(null)}
                      className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 2: HERO SLIDES & MEDIA --- */}
      {subTab === 'hero' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <Image className="w-5 h-5 text-amber-500" />
                Hero Slides & Background Video Manager
              </h3>
              <p className="text-xs text-slate-500">Configure hero titles, banner photos, buttons and background media</p>
            </div>

            <button
              onClick={handleAddSlide}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add New Hero Slide
            </button>
          </div>

          {/* Optional Video Background Setting */}
          <div className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Optional Hero Background Video URL (MP4 Format)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.hero_video_url || ''}
                onChange={e => updateSettings({ hero_video_url: e.target.value })}
                placeholder="Leave blank for slide photos, or paste video URL..."
                className="flex-grow p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <button
                type="button"
                onClick={() => handleFileUpload((url) => {
                  updateSettings({ hero_video_url: url });
                  showNotification('Background Video Uploaded!');
                })}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1"
              >
                <Upload className="w-4 h-4" /> Video File
              </button>
            </div>
          </div>

          {/* Falling Stars & Depth-of-Field Background Effect Controls */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                <h4 className="font-extrabold text-sm text-white font-heading">
                  Falling Stars & Depth-of-Field Background Controls
                </h4>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Admin Customizable Real-time Effect
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
              {/* Enable / Disable */}
              <div>
                <label className="block mb-1 text-slate-300 font-bold">Falling Stars Effect</label>
                <select
                  value={settings.content_blocks['stars.enabled'] || 'true'}
                  onChange={e => updateContentBlock('stars.enabled', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold"
                >
                  <option value="true">✨ Enabled (Active Background)</option>
                  <option value="false">🚫 Disabled</option>
                </select>
              </div>

              {/* Depth of field blur mode */}
              <div>
                <label className="block mb-1 text-slate-300 font-bold">Depth of Field Blur</label>
                <select
                  value={settings.content_blocks['stars.dof_blur'] || 'High'}
                  onChange={e => updateContentBlock('stars.dof_blur', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold"
                >
                  <option value="High">🔬 High Depth Blur (Bokeh Background)</option>
                  <option value="Medium">🌤️ Medium Softness</option>
                  <option value="Off">⚡ Off (All Sharp)</option>
                </select>
              </div>

              {/* Fall speed */}
              <div>
                <label className="block mb-1 text-slate-300 font-bold">Fall Speed Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  value={settings.content_blocks['stars.speed'] || '1.0'}
                  onChange={e => updateContentBlock('stars.speed', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-amber-400 font-extrabold"
                />
              </div>

              {/* Opacity */}
              <div>
                <label className="block mb-1 text-slate-300 font-bold">Star Opacity ({settings.content_blocks['stars.opacity'] || '0.75'})</label>
                <input
                  type="range"
                  step="0.05"
                  min="0.1"
                  max="1.0"
                  value={settings.content_blocks['stars.opacity'] || '0.75'}
                  onChange={e => updateContentBlock('stars.opacity', e.target.value)}
                  className="w-full mt-2 accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Slides List */}
          <div className="space-y-6">
            {settings.hero_slides.map((slide, idx) => (
              <div
                key={slide.id || idx}
                className="p-5 bg-stone-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="font-extrabold text-xs text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-lg">
                    Slide #{idx + 1}
                  </span>
                  <button
                    onClick={() => handleDeleteSlide(idx)}
                    className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg flex items-center gap-1 text-xs font-bold"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Slide
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-medium">
                  {/* Photo Preview & Replace */}
                  <div className="md:col-span-4 space-y-2">
                    <label className="block font-bold">Banner Photo</label>
                    <div className="h-40 rounded-xl overflow-hidden border border-slate-300 bg-slate-900 relative">
                      <img src={slide.image} alt="Banner" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleFileUpload((url) => handleUpdateSlide(idx, { image: url }))}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Photo
                      </button>
                    </div>
                    <input
                      type="text"
                      value={slide.image}
                      onChange={e => handleUpdateSlide(idx, { image: e.target.value })}
                      placeholder="Image URL"
                      className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  {/* Texts & Buttons */}
                  <div className="md:col-span-8 space-y-3">
                    <div>
                      <label className="block mb-1 font-bold">Badge Text</label>
                      <input
                        type="text"
                        value={slide.badge}
                        onChange={e => handleUpdateSlide(idx, { badge: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-amber-600"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-bold">Slide Headline Title</label>
                      <input
                        type="text"
                        value={slide.title}
                        onChange={e => handleUpdateSlide(idx, { title: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-extrabold text-sm"
                      />
                    </div>

                    <div>
                      <label className="block mb-1 font-bold">Slide Subtitle Text</label>
                      <textarea
                        rows={2}
                        value={slide.subtitle}
                        onChange={e => handleUpdateSlide(idx, { subtitle: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 font-bold">Primary Button Label</label>
                        <input
                          type="text"
                          value={slide.primaryBtnText}
                          onChange={e => handleUpdateSlide(idx, { primaryBtnText: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-bold">Primary Button Link</label>
                        <input
                          type="text"
                          value={slide.primaryBtnUrl}
                          onChange={e => handleUpdateSlide(idx, { primaryBtnUrl: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: ABOUT & DIRECTOR'S DESK --- */}
      {subTab === 'about' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              Director's Desk & About Us Content
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Director Photo Card */}
            <div className="md:col-span-4 bg-stone-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Director Portrait Photo
              </span>
              <div className="w-36 h-44 mx-auto rounded-2xl bg-slate-900 border-2 border-amber-400 shadow-md overflow-hidden">
                <img
                  src={settings.principal_photo}
                  alt="Director"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleFileUpload((url) => {
                    updateSettings({ principal_photo: url });
                    showNotification('Director Photo Uploaded!');
                  })}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> Change Director Photo
                </button>

                <input
                  type="text"
                  placeholder="Photo URL"
                  value={settings.principal_photo}
                  onChange={e => updateSettings({ principal_photo: e.target.value })}
                  className="w-full p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>
            </div>

            {/* Director Message & Text */}
            <div className="md:col-span-8 space-y-4 text-xs font-medium">
              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Director Name</label>
                <input
                  type="text"
                  value={settings.principal_name}
                  onChange={e => updateSettings({ principal_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block mb-1 font-bold text-slate-700 dark:text-slate-300">Director's Welcome Speech / Message</label>
                <textarea
                  rows={4}
                  value={settings.principal_message}
                  onChange={e => updateSettings({ principal_message: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 leading-relaxed"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">About Section Text Paragraphs</h4>

                <div>
                  <label className="block mb-1 font-bold">About Paragraph 1</label>
                  <textarea
                    rows={3}
                    value={settings.content_blocks['about.text1'] || ''}
                    onChange={e => updateContentBlock('about.text1', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-bold">About Paragraph 2</label>
                  <textarea
                    rows={3}
                    value={settings.content_blocks['about.text2'] || ''}
                    onChange={e => updateContentBlock('about.text2', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB: FACULTY MEMBERS MANAGER --- */}
      {subTab === 'faculty' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-500" />
                Faculty Members & Teacher Profiles ({(settings.faculty || []).length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full details editor for teacher names, designations, qualifications, experience, photos, email, phone, bio, and assignments.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddFacultyMember}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Faculty Member
            </button>
          </div>

          {(settings.faculty || []).length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6">
              <UserCheck className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No faculty members currently added.</p>
              <p className="text-xs text-slate-500 mb-4">Click below to create the first teacher profile for your website.</p>
              <button
                type="button"
                onClick={handleAddFacultyMember}
                className="bg-amber-500 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl"
              >
                Add First Faculty Member
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {(settings.faculty || []).map((member, index) => (
                <div
                  key={member.id}
                  className="p-6 bg-stone-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-5 shadow-sm"
                >
                  <div className="flex flex-wrap justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="p-2 bg-amber-500/20 text-amber-500 rounded-xl font-bold text-xs">
                        #{index + 1}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          {member.name || `Faculty Member #${index + 1}`}
                        </h4>
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          {member.designation || 'Educator Profile'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={member.status || 'Active'}
                        onChange={e => handleUpdateFacultyMember(member.id, { status: e.target.value as 'Active' | 'On Leave' })}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                          member.status === 'On Leave'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        <option value="Active">Active Faculty</option>
                        <option value="On Leave">On Leave</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleDeleteFacultyMember(member.id)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-red-500/20"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </div>
                  </div>

                  {/* Photo & Detailed Inputs Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Photo Box */}
                    <div className="md:col-span-3 text-center space-y-3">
                      <div className="w-36 h-44 mx-auto rounded-2xl bg-slate-900 border-2 border-slate-300 dark:border-slate-600 overflow-hidden relative shadow-md">
                        <img
                          src={member.photo || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600'}
                          alt={member.name}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => handleFileUpload((url) => handleUpdateFacultyMember(member.id, { photo: url }))}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <Upload className="w-3.5 h-3.5" /> Change Photo
                        </button>
                        
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 text-left">
                            Direct Image URL
                          </label>
                          <input
                            type="text"
                            value={member.photo}
                            onChange={e => handleUpdateFacultyMember(member.id, { photo: e.target.value })}
                            className="w-full p-2 text-[11px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Detailed Inputs */}
                    <div className="md:col-span-9 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Full Name <span className="text-amber-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={member.name}
                            onChange={e => handleUpdateFacultyMember(member.id, { name: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                            placeholder="e.g. Dr. Ramesh Chandra Sharma"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Designation / Position
                          </label>
                          <input
                            type="text"
                            value={member.designation}
                            onChange={e => handleUpdateFacultyMember(member.id, { designation: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                            placeholder="e.g. Principal & Senior PGT Physics"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Subject Specialization
                          </label>
                          <input
                            type="text"
                            value={member.subject}
                            onChange={e => handleUpdateFacultyMember(member.id, { subject: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
                            placeholder="e.g. Physics & Educational Leadership"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Degrees & Qualifications
                          </label>
                          <input
                            type="text"
                            value={member.qualification}
                            onChange={e => handleUpdateFacultyMember(member.id, { qualification: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="e.g. Ph.D. in Physics, M.Ed., B.Ed."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Teaching Experience
                          </label>
                          <input
                            type="text"
                            value={member.experience || ''}
                            onChange={e => handleUpdateFacultyMember(member.id, { experience: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="e.g. 22+ Years Experience"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={member.email || ''}
                            onChange={e => handleUpdateFacultyMember(member.id, { email: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="e.g. principal@modelpublicschool.com"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Phone / Contact Number
                          </label>
                          <input
                            type="text"
                            value={member.phone || ''}
                            onChange={e => handleUpdateFacultyMember(member.id, { phone: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="e.g. +91 98765 43210"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Assigned Classes
                          </label>
                          <input
                            type="text"
                            value={member.assignedClasses || ''}
                            onChange={e => handleUpdateFacultyMember(member.id, { assignedClasses: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="e.g. Class 10-A, 11-A, 12-A"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Joining Year
                          </label>
                          <input
                            type="text"
                            value={member.joiningYear || ''}
                            onChange={e => handleUpdateFacultyMember(member.id, { joiningYear: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="e.g. 2016"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Achievements & Awards
                          </label>
                          <input
                            type="text"
                            value={member.achievements || ''}
                            onChange={e => handleUpdateFacultyMember(member.id, { achievements: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            placeholder="e.g. CBSE Best Teacher Award 2022"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Educator Bio & Teaching Philosophy
                        </label>
                        <textarea
                          rows={3}
                          value={member.bio || ''}
                          onChange={e => handleUpdateFacultyMember(member.id, { bio: e.target.value })}
                          className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white leading-relaxed"
                          placeholder="Dedicated to inspiring scholastic excellence, interactive experiments, and character building..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SUBTAB 4: FACILITIES MANAGER --- */}
      {subTab === 'facilities' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <Monitor className="w-5 h-5 text-amber-500" />
                Campus Facilities & Infrastructure Full Editor ({settings.facilities.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Edit facility titles, icons, categories, detailed overview, highlights, photos, and maintenance status.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddFacility}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" /> Add New Facility
            </button>
          </div>

          <div className="space-y-6">
            {settings.facilities.map((fac, index) => (
              <div
                key={fac.id}
                className="p-6 bg-stone-50 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-5 shadow-sm"
              >
                <div className="flex flex-wrap justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-3 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="p-2 bg-amber-500/20 text-amber-500 rounded-xl font-bold text-xs">
                      #{index + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        {fac.title || 'Campus Facility'}
                      </h4>
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                        Category: {fac.category || 'Technology & Infrastructure'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={fac.status || 'Active'}
                      onChange={e => handleUpdateFacility(fac.id, { status: e.target.value as any })}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                        fac.status === 'Under Maintenance'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      <option value="Active">Active Facility</option>
                      <option value="Featured">Featured Facility</option>
                      <option value="Under Maintenance">Under Maintenance</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteFacility(fac.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border border-red-500/20"
                      title="Delete Facility"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start text-xs font-medium">
                  {/* Photo & Upload */}
                  <div className="md:col-span-4 space-y-3">
                    <div className="h-44 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-300 dark:border-slate-600 shadow-md">
                      <img src={fac.image} alt={fac.title} className="w-full h-full object-cover" />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFileUpload((url) => handleUpdateFacility(fac.id, { image: url }))}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload Facility Image
                    </button>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Direct Image URL
                      </label>
                      <input
                        type="text"
                        value={fac.image}
                        onChange={e => handleUpdateFacility(fac.id, { image: e.target.value })}
                        className="w-full p-2 text-[11px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="md:col-span-8 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Facility Title <span className="text-amber-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fac.title}
                          onChange={e => handleUpdateFacility(fac.id, { title: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                          placeholder="e.g. AI & Computer Science Lab"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Category
                        </label>
                        <select
                          value={fac.category || 'Technology'}
                          onChange={e => handleUpdateFacility(fac.id, { category: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        >
                          <option value="Academic">Academic & Learning</option>
                          <option value="Technology">Technology & AI</option>
                          <option value="Science">Science & Discovery Labs</option>
                          <option value="Sports">Sports & Athletics</option>
                          <option value="Library">Library & Research</option>
                          <option value="Transport">Transport & Buses</option>
                          <option value="Infrastructure">Safety & Infrastructure</option>
                          <option value="Co-Curricular">Co-Curricular & Arts</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Icon Symbol
                        </label>
                        <select
                          value={fac.iconName}
                          onChange={e => handleUpdateFacility(fac.id, { iconName: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        >
                          <option value="Monitor">Monitor / Smart Digital Board</option>
                          <option value="FlaskConical">FlaskConical / Science Lab</option>
                          <option value="Cpu">Cpu / AI Computer Lab</option>
                          <option value="Bus">Bus / School Transport</option>
                          <option value="BookOpen">BookOpen / Library</option>
                          <option value="Trophy">Trophy / Sports & Gym</option>
                          <option value="ShieldCheck">ShieldCheck / Security & CCTV</option>
                          <option value="Wifi">Wifi / High-Speed Fiber</option>
                          <option value="Music">Music / Cultural Auditorium</option>
                          <option value="Activity">Activity / Playground</option>
                          <option value="HeartPulse">HeartPulse / Medical Infirmary</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Key Highlights (Comma-separated)
                        </label>
                        <input
                          type="text"
                          value={Array.isArray(fac.highlights) ? fac.highlights.join(', ') : (fac.highlights || '')}
                          onChange={e => handleUpdateFacility(fac.id, { highlights: e.target.value.split(',').map(s => s.trim()) })}
                          className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                          placeholder="e.g. 30 Dual Core PCs, Air Conditioned, UPS Backup"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Short Summary Description
                      </label>
                      <input
                        type="text"
                        value={fac.description}
                        onChange={e => handleUpdateFacility(fac.id, { description: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                        placeholder="Short card summary text..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Detailed Overview & Technical Details
                      </label>
                      <textarea
                        rows={3}
                        value={fac.overview || ''}
                        onChange={e => handleUpdateFacility(fac.id, { overview: e.target.value })}
                        className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white leading-relaxed"
                        placeholder="Comprehensive description of equipment, specs, safety measures, and student usage..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SUBTAB 5: GALLERY MANAGER --- */}
      {subTab === 'gallery' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-amber-500" />
                Photo & Media Gallery Items ({settings.gallery.length})
              </h3>
            </div>

            <button
              onClick={handleAddGalleryItem}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add New Photo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {settings.gallery.map((g) => (
              <div
                key={g.id}
                className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
              >
                <div className="h-40 rounded-xl overflow-hidden bg-slate-900 relative">
                  <img src={g.url} alt={g.title} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeleteGalleryItem(g.id)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg shadow hover:bg-rose-700"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => handleFileUpload((url) => handleUpdateGalleryItem(g.id, { url }))}
                    className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Photo File
                  </button>

                  <div>
                    <label className="block mb-0.5 font-bold">Category</label>
                    <select
                      value={g.category}
                      onChange={e => handleUpdateGalleryItem(g.id, { category: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="Campus">Campus</option>
                      <option value="Academics">Academics</option>
                      <option value="Events">Events</option>
                      <option value="Sports">Sports</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-0.5 font-bold">Title</label>
                    <input
                      type="text"
                      value={g.title}
                      onChange={e => handleUpdateGalleryItem(g.id, { title: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block mb-0.5 font-bold">Caption Details</label>
                    <input
                      type="text"
                      value={g.caption}
                      onChange={e => handleUpdateGalleryItem(g.id, { caption: e.target.value })}
                      className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SUBTAB 6: FEES MANAGER --- */}
      {subTab === 'fees' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                Grade Fee Structure Table ({settings.grade_fees.length})
              </h3>
            </div>

            <button
              onClick={handleAddFeeItem}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Grade Fee Tier
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold uppercase">
                <tr>
                  <th className="p-3">Class / Grade Name</th>
                  <th className="p-3">Admission Fee (₹)</th>
                  <th className="p-3">Monthly Tuition (₹)</th>
                  <th className="p-3">Annual Charges (₹)</th>
                  <th className="p-3">Exam Fee (₹)</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {settings.grade_fees.map((fee) => (
                  <tr key={fee.id}>
                    <td className="p-2">
                      <input
                        type="text"
                        value={fee.className}
                        onChange={e => handleUpdateFeeItem(fee.id, { className: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={fee.admissionFee}
                        onChange={e => handleUpdateFeeItem(fee.id, { admissionFee: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={fee.monthlyTuition}
                        onChange={e => handleUpdateFeeItem(fee.id, { monthlyTuition: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 font-bold text-amber-600"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={fee.annualCharges}
                        onChange={e => handleUpdateFeeItem(fee.id, { annualCharges: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={fee.examFee}
                        onChange={e => handleUpdateFeeItem(fee.id, { examFee: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
                      />
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleDeleteFeeItem(fee.id)}
                        className="p-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- SUBTAB 7: THEME & FONTS --- */}
      {subTab === 'theme' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-500" />
              Website Color Scheme & Typography Settings
            </h3>
            <p className="text-xs text-slate-500">Pick from curated aesthetic presets or define custom colors and Google Fonts</p>
          </div>

          {/* Presets */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Curated Palette Presets</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {themePresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    updateSettings({
                      theme_colors: {
                        primary: p.primary,
                        secondary: p.secondary,
                        accent: p.accent,
                        background: p.bg,
                        cardBg: p.card,
                        text: p.text
                      }
                    });
                    showNotification(`Applied ${p.name} Theme!`);
                  }}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 hover:border-amber-500 transition-all text-left flex flex-col justify-between"
                >
                  <span className="font-bold text-xs text-slate-900 dark:text-white mb-2">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: p.primary }} title="Primary"></span>
                    <span className="w-6 h-6 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: p.secondary }} title="Secondary"></span>
                    <span className="w-6 h-6 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: p.accent }} title="Accent"></span>
                    <span className="w-6 h-6 rounded-full border border-black/10 shadow-inner" style={{ backgroundColor: p.bg }} title="Background"></span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Color Inputs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-xs font-medium pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block mb-1 font-bold">Primary</label>
              <input
                type="color"
                value={settings.theme_colors?.primary || '#1e3a8a'}
                onChange={e => updateSettings({ theme_colors: { ...settings.theme_colors, primary: e.target.value } })}
                className="w-full h-10 rounded-xl cursor-pointer bg-slate-100 dark:bg-slate-800 border-0"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold">Secondary (Gold)</label>
              <input
                type="color"
                value={settings.theme_colors?.secondary || '#d97706'}
                onChange={e => updateSettings({ theme_colors: { ...settings.theme_colors, secondary: e.target.value } })}
                className="w-full h-10 rounded-xl cursor-pointer bg-slate-100 dark:bg-slate-800 border-0"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold">Accent (Teal)</label>
              <input
                type="color"
                value={settings.theme_colors?.accent || '#0d9488'}
                onChange={e => updateSettings({ theme_colors: { ...settings.theme_colors, accent: e.target.value } })}
                className="w-full h-10 rounded-xl cursor-pointer bg-slate-100 dark:bg-slate-800 border-0"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold">Background</label>
              <input
                type="color"
                value={settings.theme_colors?.background || '#fcfbf7'}
                onChange={e => updateSettings({ theme_colors: { ...settings.theme_colors, background: e.target.value } })}
                className="w-full h-10 rounded-xl cursor-pointer bg-slate-100 dark:bg-slate-800 border-0"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold">Card Background</label>
              <input
                type="color"
                value={settings.theme_colors?.cardBg || '#ffffff'}
                onChange={e => updateSettings({ theme_colors: { ...settings.theme_colors, cardBg: e.target.value } })}
                className="w-full h-10 rounded-xl cursor-pointer bg-slate-100 dark:bg-slate-800 border-0"
              />
            </div>

            <div>
              <label className="block mb-1 font-bold">Body Text</label>
              <input
                type="color"
                value={settings.theme_colors?.text || '#1e293b'}
                onChange={e => updateSettings({ theme_colors: { ...settings.theme_colors, text: e.target.value } })}
                className="w-full h-10 rounded-xl cursor-pointer bg-slate-100 dark:bg-slate-800 border-0"
              />
            </div>
          </div>

          {/* Font Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium pt-4 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block mb-1 font-bold">Heading Font Family</label>
              <select
                value={settings.font_heading || 'Outfit'}
                onChange={e => updateSettings({ font_heading: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-sm font-bold"
              >
                <option value="Outfit">Outfit (Modern Clean)</option>
                <option value="Plus Jakarta Sans">Plus Jakarta Sans (Contemporary)</option>
                <option value="Playfair Display">Playfair Display (Academic Serif)</option>
                <option value="Montserrat">Montserrat (Geometric Bold)</option>
                <option value="Inter">Inter (Universal)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-bold">Body Font Family</label>
              <select
                value={settings.font_body || 'Plus Jakarta Sans'}
                onChange={e => updateSettings({ font_body: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-sm font-bold"
              >
                <option value="Plus Jakarta Sans">Plus Jakarta Sans (Readable)</option>
                <option value="Outfit">Outfit</option>
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 8: ALL TEXT BLOCKS SEARCH & KEY-VALUE EDITOR --- */}
      {subTab === 'textblocks' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                <List className="w-5 h-5 text-amber-500" />
                Website Text Content Blocks
              </h3>
              <p className="text-xs text-slate-500">Directly edit any string key rendered across the public website</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search text keys..."
                value={textSearch}
                onChange={e => setTextSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(settings.content_blocks || {})
              .filter(([key, val]) => {
                const strVal = String(val || '');
                return key.toLowerCase().includes(textSearch.toLowerCase()) ||
                       strVal.toLowerCase().includes(textSearch.toLowerCase());
              })
              .map(([key, val]) => {
                const strVal = String(val || '');
                return (
                  <div key={key} className="p-4 bg-stone-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                    <div className="flex justify-between items-center text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">
                      <span>Block Key: {key}</span>
                    </div>
                    <textarea
                      rows={strVal.length > 80 ? 3 : 1}
                      value={strVal}
                      onChange={e => updateContentBlock(key, e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* --- SUBTAB 9: SEO & SEARCH ENGINE METADATA MANAGER --- */}
      {subTab === 'seo' && (() => {
        const seoMeta = settings.seo_meta || {};
        const titleVal = seoMeta.meta_title ?? `${settings.school_name || 'Model Public School'} (MPS Sikta) - ${settings.tagline || 'Excellence in Education'}`;
        const descVal = seoMeta.meta_description ?? `${settings.school_name || 'Model Public School'} at ${settings.address || 'Bhawanipur, Sikta, West Champaran, Bihar'}. CBSE Affiliated school providing quality education, admissions, and campus facilities.`;
        const keywordsVal = seoMeta.meta_keywords ?? `Model Public School, MPS Sikta, School in Sikta, CBSE School Bhawanipur, Schools in West Champaran, West Champaran CBSE School, MPS Bhawanipur`;
        const ogImageVal = seoMeta.og_image ?? settings.logo_url ?? '/logo.svg';
        const canonicalVal = seoMeta.canonical_url ?? (typeof window !== 'undefined' ? window.location.origin : 'https://mpssikta.edu.in');
        const authorVal = seoMeta.author ?? `${settings.school_name || 'Model Public School'} Management`;
        const robotsVal = seoMeta.robots ?? 'index, follow';
        const schemaVal = seoMeta.enable_schema_markup !== false;

        const titleLen = titleVal.length;
        const descLen = descVal.length;

        const handleSeoChange = (key: string, value: any) => {
          updateSettings({
            seo_meta: {
              ...(settings.seo_meta || {}),
              [key]: value
            }
          });
        };

        const adsenseVal = settings.seo_meta?.google_adsense_id || settings.google_adsense_id || 'ca-pub-0000000000000000';
        const analyticsVal = settings.seo_meta?.google_analytics_id || '';
        const searchConsoleVal = settings.seo_meta?.google_search_console_id || '';
        const enableAdsenseVal = settings.seo_meta?.enable_adsense ?? true;

        const handlePublishSeo = () => {
          updateSettings({
            google_adsense_id: adsenseVal,
            seo_meta: {
              meta_title: titleVal,
              meta_description: descVal,
              meta_keywords: keywordsVal,
              og_image: ogImageVal,
              canonical_url: canonicalVal,
              author: authorVal,
              robots: robotsVal,
              enable_schema_markup: schemaVal,
              google_adsense_id: adsenseVal,
              google_analytics_id: analyticsVal,
              google_search_console_id: searchConsoleVal,
              enable_adsense: enableAdsenseVal
            }
          });
          showNotification('SEO & AdSense Meta Tags Saved & Published Live!');
        };

        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                    <SearchCode className="w-5 h-5 text-amber-500" />
                    Dynamic Search Engine & Social Media Metadata Manager
                  </h3>
                  <p className="text-xs text-slate-500">
                    Control how Model Public School appears on Google, Bing, WhatsApp, Facebook, and Twitter.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 hidden sm:flex">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Dynamic Injection Active
                  </span>
                  <button
                    type="button"
                    onClick={handlePublishSeo}
                    className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold px-4 py-2 rounded-xl flex items-center gap-1.5 text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save & Publish Meta Tags
                  </button>
                </div>
              </div>

              {/* Status Bar Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
                <div className="p-4 bg-stone-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex justify-between">
                    <span>Meta Title Length</span>
                    <span className={titleLen >= 50 && titleLen <= 65 ? 'text-emerald-500' : 'text-amber-500'}>
                      {titleLen}/60 Chars
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {titleLen >= 50 && titleLen <= 65 ? 'Optimal Length' : titleLen < 50 ? 'Slightly Short' : 'May Be Truncated'}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${titleLen >= 50 && titleLen <= 65 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, (titleLen / 60) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-stone-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider flex justify-between">
                    <span>Meta Description</span>
                    <span className={descLen >= 120 && descLen <= 165 ? 'text-emerald-500' : 'text-amber-500'}>
                      {descLen}/160 Chars
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {descLen >= 120 && descLen <= 165 ? 'Optimal Snippet' : descLen < 120 ? 'Slightly Short' : 'May Be Truncated'}
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${descLen >= 120 && descLen <= 165 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, (descLen / 160) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-stone-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Search Indexing</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    {robotsVal.includes('index') ? 'Indexed (Follow)' : 'Noindex'}
                  </div>
                  <p className="text-[10px] text-slate-500">Crawler instructions for Googlebot</p>
                </div>

                <div className="p-4 bg-stone-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1">
                  <div className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Schema.org JSON-LD</div>
                  <div className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-blue-500" />
                    {schemaVal ? 'Educational Org Active' : 'Disabled'}
                  </div>
                  <p className="text-[10px] text-slate-500">Rich snippet structure injected</p>
                </div>
              </div>

              {/* Input Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Form Controls Column */}
                <div className="space-y-4 text-xs font-medium">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex justify-between">
                      <span>Meta Page Title (document.title) *</span>
                      <span className="text-[10px] text-slate-400 font-normal">Ideal: 50-60 characters</span>
                    </label>
                    <input
                      type="text"
                      value={titleVal}
                      onChange={e => handleSeoChange('meta_title', e.target.value)}
                      placeholder="e.g. Model Public School (MPS Sikta) - CBSE School in Bhawanipur, Bihar"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex justify-between">
                      <span>Meta Description *</span>
                      <span className="text-[10px] text-slate-400 font-normal">Ideal: 140-160 characters</span>
                    </label>
                    <textarea
                      rows={3}
                      value={descVal}
                      onChange={e => handleSeoChange('meta_description', e.target.value)}
                      placeholder="e.g. Model Public School (MPS Sikta) is a premier CBSE affiliated institution in Bhawanipur, Sikta, West Champaran offering modern education and facilities."
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Target Keywords (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={keywordsVal}
                      onChange={e => handleSeoChange('meta_keywords', e.target.value)}
                      placeholder="Model Public School, MPS Sikta, CBSE School Bhawanipur, Schools in Sikta"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Canonical Base URL
                      </label>
                      <input
                        type="url"
                        value={canonicalVal}
                        onChange={e => handleSeoChange('canonical_url', e.target.value)}
                        placeholder="https://mpssikta.edu.in"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Author / Publisher Name
                      </label>
                      <input
                        type="text"
                        value={authorVal}
                        onChange={e => handleSeoChange('author', e.target.value)}
                        placeholder="Model Public School Management"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                      Social Sharing Preview Image (og:image / twitter:image)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={ogImageVal}
                        onChange={e => handleSeoChange('og_image', e.target.value)}
                        placeholder="Image URL or upload"
                        className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleFileUpload((dataUrl) => handleSeoChange('og_image', dataUrl))}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold px-3 py-2.5 rounded-xl flex items-center gap-1 text-xs whitespace-nowrap"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSeoChange('og_image', settings.logo_url || '/logo.svg')}
                        className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold px-3 py-2.5 rounded-xl text-xs whitespace-nowrap"
                      >
                        Use Logo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Robots Search Directives
                      </label>
                      <select
                        value={robotsVal}
                        onChange={e => handleSeoChange('robots', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                      >
                        <option value="index, follow">index, follow (Allow Search Engines - Recommended)</option>
                        <option value="noindex, follow">noindex, follow (Hide Page from Google Search)</option>
                        <option value="noindex, nofollow">noindex, nofollow (Block All Crawlers)</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-stone-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <input
                          type="checkbox"
                          checked={schemaVal}
                          onChange={e => handleSeoChange('enable_schema_markup', e.target.checked)}
                          className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                        />
                        <span className="text-slate-800 dark:text-slate-200 font-bold text-xs">
                          Enable Schema.org EducationalOrganization
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 space-y-3">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" /> Google AdSense & Search Verification
                    </h4>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex justify-between">
                        <span>Google AdSense Publisher ID</span>
                        <span className="text-[10px] text-slate-400 font-normal">Format: ca-pub-XXXXXXXXXXXXXXXX</span>
                      </label>
                      <input
                        type="text"
                        value={adsenseVal}
                        onChange={e => handleSeoChange('google_adsense_id', e.target.value)}
                        placeholder="ca-pub-0000000000000000"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Google Search Console Meta Key
                        </label>
                        <input
                          type="text"
                          value={searchConsoleVal}
                          onChange={e => handleSeoChange('google_search_console_id', e.target.value)}
                          placeholder="e.g. google-site-verification-code"
                          className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                          Google Analytics (G-Tag ID)
                        </label>
                        <input
                          type="text"
                          value={analyticsVal}
                          onChange={e => handleSeoChange('google_analytics_id', e.target.value)}
                          placeholder="e.g. G-XXXXXXXXXX"
                          className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handlePublishSeo}
                      className="w-full bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-extrabold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Save & Publish SEO & AdSense Settings
                    </button>
                  </div>
                </div>

                {/* Previews Column: Google Search Snippet + Social Media Card */}
                <div className="space-y-6">
                  {/* Google Search Snippet Simulation */}
                  <div className="p-5 bg-stone-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-blue-500" /> Google Search Result Live Preview
                      </h4>
                      <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-extrabold">
                        Desktop & Mobile SERP
                      </span>
                    </div>

                    <div className="p-4 bg-white dark:bg-[#202124] rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 shadow-sm text-left">
                      <div className="flex items-center gap-2 text-[12px] text-slate-700 dark:text-[#bdc1c6] font-normal truncate">
                        <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 flex items-center justify-center flex-shrink-0">
                          <img src={settings.logo_url || '/logo.svg'} alt="Logo" className="w-3.5 h-3.5 object-contain" />
                        </div>
                        <div className="truncate">
                          <span className="font-medium text-slate-900 dark:text-[#e8eaed]">{settings.school_name || 'Model Public School'}</span>
                          <span className="text-slate-400 dark:text-[#9aa0a6] text-[10px] ml-1.5">https://mpssikta.edu.in</span>
                        </div>
                      </div>

                      <div className="text-base font-semibold text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer leading-snug line-clamp-1 pt-0.5">
                        {titleVal}
                      </div>

                      <div className="text-xs text-[#4d5156] dark:text-[#bdc1c6] leading-relaxed line-clamp-2">
                        {descVal}
                      </div>
                    </div>
                  </div>

                  {/* Social Media Link Card Preview (WhatsApp / Facebook / Twitter) */}
                  <div className="p-5 bg-stone-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-amber-500" /> WhatsApp & Social Card Live Preview
                      </h4>
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-extrabold">
                        Open Graph Card
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md max-w-sm mx-auto">
                      <div className="h-40 bg-slate-800 relative flex items-center justify-center overflow-hidden">
                        {ogImageVal ? (
                          <img src={ogImageVal} alt="OG Card" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-slate-400 text-xs font-bold flex flex-col items-center gap-1">
                            <Image className="w-6 h-6" /> No Card Image
                          </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                          mpssikta.edu.in
                        </div>
                      </div>

                      <div className="p-3.5 space-y-1 text-left">
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold uppercase tracking-wider">
                          {settings.school_name || 'Model Public School'}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {titleVal}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                          {descVal}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Floating Save Button Positioned Right Side Above Keyboard with 30s Auto-Save */}
      <FloatingAdminSaveBar
        onSave={async () => {
          if (settings) {
            await updateSettings(settings);
            showNotification('All Changes Saved Permanently!');
          }
        }}
        autoSaveIntervalSeconds={30}
      />
    </div>
  );
};
