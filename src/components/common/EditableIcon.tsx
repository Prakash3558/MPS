import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCMS } from '../../context/CMSContext';
import {
  GraduationCap, BookOpen, Award, Trophy, Bus, Clock,
  ShieldCheck, Heart, Sparkles, Laptop, Smartphone, Users,
  MapPin, Phone, Mail, FileText, CheckCircle2, Star, Calendar,
  Music, Palette, Dumbbell, Compass, Shield, Flame, Lightbulb,
  Target, Rocket, Globe, Edit3, X, Check
} from 'lucide-react';

interface EditableIconProps {
  iconKey: string;
  defaultIcon: string;
  defaultColor?: string;
  className?: string;
  size?: number;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  GraduationCap,
  BookOpen,
  Award,
  Trophy,
  Bus,
  Clock,
  ShieldCheck,
  Heart,
  Sparkles,
  Laptop,
  Smartphone,
  Users,
  MapPin,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  Star,
  Calendar,
  Music,
  Palette,
  Dumbbell,
  Compass,
  Shield,
  Flame,
  Lightbulb,
  Target,
  Rocket,
  Globe
};

const COLOR_PALETTE = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Slate', hex: '#64748b' }
];

export const EditableIcon: React.FC<EditableIconProps> = ({
  iconKey,
  defaultIcon,
  defaultColor,
  className = '',
  size = 20
}) => {
  const { isEditMode } = useAuth();
  const { getContentBlock, updateContentBlock } = useCMS();

  const currentIconName = getContentBlock(`icon.${iconKey}`, defaultIcon);
  const currentColor = getContentBlock(`iconColor.${iconKey}`, defaultColor || '');

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(currentIconName);
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [searchFilter, setSearchFilter] = useState('');

  const IconComponent = ICON_MAP[currentIconName] || ICON_MAP[defaultIcon] || CheckCircle2;

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateContentBlock(`icon.${iconKey}`, selectedIcon);
      if (selectedColor) {
        await updateContentBlock(`iconColor.${iconKey}`, selectedColor);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to update icon:', err);
    }
  };

  const filteredIcons = Object.keys(ICON_MAP).filter(name =>
    name.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <>
      <span
        onClick={(e) => {
          if (isEditMode) {
            e.stopPropagation();
            setSelectedIcon(currentIconName);
            setSelectedColor(currentColor);
            setModalOpen(true);
          }
        }}
        title={isEditMode ? `Click to change icon (${currentIconName})` : undefined}
        className={`inline-flex items-center justify-center relative ${
          isEditMode
            ? 'cursor-pointer rounded-lg p-0.5 outline-dashed outline-2 outline-amber-400/80 hover:outline-amber-500 hover:bg-amber-500/20 group/icon-edit transition-all'
            : ''
        }`}
      >
        <IconComponent
          size={size}
          style={currentColor ? { color: currentColor } : undefined}
          className={`${className} transition-transform ${isEditMode ? 'group-hover/icon-edit:scale-110' : ''}`}
        />
        {isEditMode && (
          <span className="opacity-0 group-hover/icon-edit:opacity-100 transition-opacity absolute -top-4 -right-3 z-30 bg-amber-500 text-slate-950 text-[9px] font-bold px-1 py-0.2 rounded shadow whitespace-nowrap flex items-center gap-0.5 pointer-events-none">
            <Edit3 className="w-2.5 h-2.5" />
            <span>Icon</span>
          </span>
        )}
      </span>

      {/* Icon Picker Modal */}
      {modalOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl p-5 flex flex-col max-h-[85vh] animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Select Icon & Color
                  </h3>
                  <p className="text-xs text-slate-500">Pick any symbol from the library</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search icons (e.g., school, book, bus, star)..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Icon Grid */}
            <div className="grid grid-cols-5 gap-2 overflow-y-auto max-h-56 p-1 border border-slate-100 dark:border-slate-800 rounded-2xl">
              {filteredIcons.map((name) => {
                const ItemIcon = ICON_MAP[name];
                const isSelected = selectedIcon === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedIcon(name)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-500 ring-2 ring-amber-500 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <ItemIcon size={22} style={selectedColor ? { color: selectedColor } : undefined} />
                    <span className="text-[9px] mt-1 truncate max-w-full">{name}</span>
                  </button>
                );
              })}
            </div>

            {/* Color Palette */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 mt-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2">
                Icon Accent Color
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      selectedColor === c.hex ? 'scale-125 ring-2 ring-offset-2 ring-amber-500' : 'hover:scale-110'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Icon</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
