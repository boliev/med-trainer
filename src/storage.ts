import { useEffect, useState } from 'react';

export type Rating = 'good' | 'partial' | 'miss';
export type ChecklistProgress = {
  ratings: Record<string, Rating>;
  attempts: number;
  completed: number;
  lastPracticed?: string;
};
export type StudyState = { favorites: number[]; progress: Record<string, ChecklistProgress> };
const KEY = 'med-trainer-study-v1';
const EMPTY: StudyState = { favorites: [], progress: {} };

function read(): StudyState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return EMPTY;
    const v = value as Partial<StudyState>;
    return { favorites: Array.isArray(v.favorites) ? v.favorites.filter(x=>typeof x==='number') : [],
      progress: v.progress && typeof v.progress === 'object' ? v.progress : {} };
  } catch { return EMPTY; }
}

export function useStudy() {
  const [study, setStudy] = useState<StudyState>(read);
  useEffect(()=>{ try { localStorage.setItem(KEY, JSON.stringify(study)); } catch { /* storage unavailable */ } },[study]);
  function toggleFavorite(id: number) {
    setStudy(s=>({...s,favorites:s.favorites.includes(id)?s.favorites.filter(x=>x!==id):[...s.favorites,id]}));
  }
  function saveRatings(id: number, ratings: Record<string, Rating>, finished: boolean) {
    setStudy(s=>{
      const old=s.progress[id]??{ratings:{},attempts:0,completed:0};
      return {...s,progress:{...s.progress,[id]:{
        ...old,ratings:{...old.ratings,...ratings},attempts:old.attempts+1,
        completed:old.completed+(finished?1:0),lastPracticed:new Date().toISOString()
      }}};
    });
  }
  return { study, toggleFavorite, saveRatings };
}
