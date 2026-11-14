import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, ClipboardList, GraduationCap, Heart, RotateCcw, Search, Star } from 'lucide-react';
import './documents.css';

export type DocumentEntry = {
  id: string; order: number; categoryId: string; heading: string; displayCode: string;
  approvedAt: string; statusLabel: string; validityLabel: string; documentKind: string;
  summary: string; keyPoints: string[]; source: { label: string; url: string };
  reviewedAt: string; priority: boolean;
};
type Category = { id: string; title: string; order: number };
type SectionFile = { category: Category; documents: DocumentEntry[] };
type Question = { id: string; question: string; answer: string; acceptedDocumentIds?: string[] };
type Rating = 'good' | 'partial' | 'miss';
type Skill = 'number' | 'content';
type PracticeMode = 'cards' | 'quiz' | 'scenario' | 'exam';
type PracticeQuestion = { id: string; prompt: string; answer: string; skill: Skill; documentId?: string; choices?: string[] };
type Store = { favorites: string[]; ratings: Record<string, Rating>; history: Record<string, number> };

const files = import.meta.glob('../../documents/catalog/*.json', { eager: true, import: 'default' });
const sections = Object.values(files) as SectionFile[];
export const nursingDocuments = sections.flatMap(s => s.documents).sort((a, b) => a.order - b.order);
const categories = sections.map(s => s.category).sort((a, b) => a.order - b.order);
import examData from '../../documents/data/oral-exam-questions.json';
import scenarioData from '../../documents/data/scenario-questions.json';
import infectionsNav from '../../documents/data/sanpin-infections-nav.json';
import wasteNav from '../../documents/data/sanpin-waste-nav.json';
import formNav from '../../documents/data/form-058-comparison.json';
import obsoleteNav from '../../documents/data/obsolete-documents.json';

const navs = [infectionsNav, wasteNav, formNav, obsoleteNav];
const storageKey = 'nursing-documents-progress-v1';
const emptyStore: Store = { favorites: [], ratings: {}, history: {} };
function readStore(): Store {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return emptyStore;
    const val: unknown = JSON.parse(raw);
    if (!val || typeof val !== 'object') return emptyStore;
    const obj = val as Partial<Store>;
    return { favorites: Array.isArray(obj.favorites) ? obj.favorites.filter(x => typeof x === 'string') : [],
      ratings: obj.ratings && typeof obj.ratings === 'object' ? obj.ratings : {},
      history: obj.history && typeof obj.history === 'object' ? obj.history : {} };
  } catch { return emptyStore; }
}
function useDocumentStore() {
  const [state, setState] = useState<Store>(readStore);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* storage disabled */ } }, [state]);
  return { state,
    toggleFavorite: (id: string) => setState(prev => ({ ...prev, favorites: prev.favorites.includes(id) ? prev.favorites.filter(x => x !== id) : [...prev.favorites, id] })),
    rate: (id: string, score: Rating) => setState(prev => ({ ...prev,
      ratings: { ...prev.ratings, [id]: score },
      history: { ...prev.history, [id]: Date.now() }
    }))
  };
}
function pluralRu(value: number, one: string, few: string, many: string) {
  const n = Math.abs(value);
  if (n % 100 >= 11 && n % 100 <= 14) return many;
  if (n % 10 === 1) return one;
  if (n % 10 >= 2 && n % 10 <= 4) return few;
  return many;
}
function niceCategory(id: string) { return categories.find(x => x.id === id)?.title || id; }
function Stars({ selected, onClick }: { selected: boolean; onClick: () => void }) {
  return <button type="button" className={'doc-star ' + (selected ? 'selected' : '')} onClick={onClick} aria-label={selected ? 'Убрать из избранного' : 'В избранное'} aria-pressed={selected}><Star size={19} fill={selected ? 'currentColor' : 'none'}/></button>;
}
function Notice() {
  return <div className="doc-notice">Учебный справочник · Актуализация: 14.11.2026. Не заменяет действующие нормативные акты, локальные СОП и инструкции учреждения. Перед практическим применением проверяйте актуальную редакцию.</div>;
}
export function DocumentsHome() {
  const { state, toggleFavorite } = useDocumentStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = nursingDocuments.filter(d => {
    const text = [d.displayCode, d.heading, d.summary, ...d.keyPoints].join(' ').toLocaleLowerCase('ru');
    return (filter === 'all' || filter === d.categoryId) && text.includes(query.trim().toLocaleLowerCase('ru'));
  });
  const fav = filtered.filter(d => state.favorites.includes(d.id));
  const other = filtered.filter(d => !state.favorites.includes(d.id));
  function renderList(items: DocumentEntry[]) {
    return <div className="doc-list">{items.map(d => <article className="doc-item" key={d.id}>
      <Stars selected={state.favorites.includes(d.id)} onClick={() => toggleFavorite(d.id)}/>
      <Link to={'/documents/' + d.id} className="doc-item-main"><strong>{d.displayCode}</strong><span>{d.heading.split(' — ').slice(1).join(' — ') || d.summary}</span><small>{niceCategory(d.categoryId)}</small></Link>
      <Link to={'/documents/' + d.id} aria-label={'Открыть ' + d.displayCode}><ChevronRight size={18}/></Link>
    </article>)}</div>;
  }
  return <div className="layout page documents-page">
    <Link to="/" className="back-link"><ArrowLeft size={16}/> На главную</Link>
    <div className="doc-intro"><div><div className="eyebrow"><BookOpen size={16}/> Материалы для 1 курса</div><h1>Нормативные документы</h1><p>Изучай номера, названия и смысл документов. Отмечай важное и тренируй память.</p></div><span className="count-pill">{nursingDocuments.length} {pluralRu(nursingDocuments.length, 'документ', 'документа', 'документов')}</span></div>
    <Notice/>
    <div className="doc-feature"><div><h2>Повторение на сегодня</h2><p>Вспоминай номера и содержание самостоятельно. Сложные вопросы возвращаются чаще.</p></div><Link className="btn primary" to="/documents/train?mode=cards">Начать <ArrowRight size={17}/></Link></div>
    <div className="doc-modes">
      <Link to="/documents/train?mode=cards"><BookOpen size={20}/><strong>Карточки</strong><span>В обе стороны</span></Link>
      <Link to="/documents/train?mode=quiz"><ClipboardList size={20}/><strong>Быстрый тест</strong><span>4 варианта</span></Link>
      <Link to="/documents/train?mode=scenario"><Heart size={20}/><strong>Ситуации</strong><span>Применение знаний</span></Link>
      <Link to="/documents/train?mode=exam"><GraduationCap size={20}/><strong>Экзамен</strong><span>Без подсказок</span></Link>
    </div>
    <div className="search-field"><Search size={18}/><input aria-label="Поиск документов" placeholder="Номер, название, что регулирует…" value={query} onChange={e => setQuery(e.target.value)}/></div>
    <select className="doc-filter" aria-label="Раздел справочника" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Все разделы</option>{categories.map(c=><option key={c.id} value={c.id}>{c.title}</option>)}</select>
    {fav.length > 0 && <section className="doc-section"><h2><Star size={16} fill="currentColor"/> Избранное · {fav.length}</h2>{renderList(fav)}</section>}
    <section className={'doc-section ' + (fav.length ? 'doc-separated' : '')}><h2>{fav.length ? 'Остальные документы' : 'Все документы'} · {other.length}</h2>{renderList(other)}{filtered.length === 0 && <p>Ничего не найдено. Попробуй другой запрос.</p>}</section>
    <section className="doc-glossary" aria-labelledby="doc-glossary-heading">
      <h2 id="doc-glossary-heading">Сокращения в документах</h2>
      <dl>
        <div><dt>НП «НАСКИ»</dt><dd>Некоммерческое партнёрство «Национальная ассоциация специалистов по контролю инфекций, связанных с оказанием медицинской помощи».</dd></div>
        <div><dt>МР</dt><dd>Методические рекомендации.</dd></div>
        <div><dt>МУ</dt><dd>Методические указания.</dd></div>
        <div><dt>СП</dt><dd>Санитарные правила.</dd></div>
      </dl>
      <p>Рекомендации НП «НАСКИ» не равнозначны обязательным государственным нормативным актам.</p>
    </section>
    <p className="doc-small">Документы и учебные вопросы хранятся в отдельных JSON-файлах, не в компонентах React.</p>
  </div>;
}
export function DocumentDetail() {
  const { id } = useParams();
  const { state, toggleFavorite } = useDocumentStore();
  const d = nursingDocuments.find(x => x.id === id);
  if (!d) return <div className="layout page"><h1>Документ не найден</h1><Link to="/documents">К справочнику</Link></div>;
  const related = navs.filter(n => (n.id === 'sanpin-infections-nav' && d.id === 'doc-09') || (n.id === 'sanpin-waste-nav' && d.id === 'doc-11') || (n.id === 'form-058-comparison' && (d.id === 'doc-26' || d.id === 'doc-27')));
  return <div className="layout page documents-page"><Link to="/documents" className="back-link"><ArrowLeft size={16}/> К документам</Link>
    <div className="doc-detail-title"><div><div className="eyebrow">{niceCategory(d.categoryId)}</div><h1>{d.displayCode}</h1><h2>{d.heading}</h2></div><Stars selected={state.favorites.includes(d.id)} onClick={()=>toggleFavorite(d.id)}/></div>
    <Notice/><div className="doc-detail-card"><p><strong>Что регулирует</strong></p><p>{d.summary}</p><h3>Основные положения</h3><ul>{d.keyPoints.map((p,i)=><li key={i}>{p}</li>)}</ul>
      <div className="doc-details-grid"><span><strong>Утверждён:</strong> {d.approvedAt}</span><span><strong>Статус:</strong> {d.statusLabel}</span><span><strong>Срок:</strong> {d.validityLabel}</span><span><strong>Вид:</strong> {d.documentKind}</span></div>
      <a href={d.source.url} target="_blank" rel="noopener noreferrer" className="doc-source">Перейти к источнику ↗</a></div>
    {related.map(n=><section className="doc-table-card" key={n.id}><h2>{n.title}</h2><div className="doc-table-scroll"><table><thead><tr>{n.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>{n.rows.map((r,i)=><tr key={i}>{n.columns.map(c=><td key={c}>{String((r as Record<string,string>)[c]||'')}</td>)}</tr>)}</tbody></table></div></section>)}
    <Link className="btn primary" to="/documents/train?mode=cards">Тренировать запоминание <ArrowRight size={17}/></Link>
  </div>;
}
const clean = (s: string) => s.toLocaleLowerCase('ru').replace(/[№\s.,\-–—()«»"'']/g, '');
const same = (a: string, b: string) => clean(a) === clean(b);
function makeQuestions(mode: PracticeMode): PracticeQuestion[] {
  const numbers = nursingDocuments.map(d => d.displayCode);
  if (mode === 'scenario') return (scenarioData.questions as Question[]).map(s => ({ id:s.id,prompt:s.question,answer:s.answer,skill:'content',documentId:s.acceptedDocumentIds?.[0] }));
  if (mode === 'exam') {
    const oral = (examData.questions as Question[]).map(s => ({id:s.id,prompt:s.question,answer:s.answer,skill:'content' as Skill}));
    const numberQuestions = nursingDocuments.filter(d=>d.priority).map(d=>({ id:d.id+'-exam',prompt:'Назови номер документа: '+d.summary,answer:d.displayCode,skill:'number' as Skill,documentId:d.id }));
    return [...numberQuestions,...oral].sort((a,b)=>a.id.localeCompare(b.id));
  }
  const both = nursingDocuments.flatMap(d=>[
    {id:d.id+':number',prompt:'Какой номер у документа? '+d.summary,answer:d.displayCode,skill:'number' as Skill,documentId:d.id},
    {id:d.id+':content',prompt:'Что регулирует '+d.displayCode+'?',answer:d.summary+'\n\n'+d.keyPoints.join('\n'),skill:'content' as Skill,documentId:d.id}
  ]);
  if (mode === 'cards') return both;
  return both.map((q,i) => {
    const correct=q.skill==='number'?q.answer:nursingDocuments.find(d=>d.id===q.documentId)!.summary;
    const pool=q.skill==='number'?numbers:nursingDocuments.map(d=>d.summary);
    const wrong=pool.filter(x=>!same(x,correct)).sort((a,b)=> {
      const ai=pool.indexOf(a),bi=pool.indexOf(b);
      return ((ai*37+i*13)%101)-((bi*37+i*13)%101);
    }).slice(0,3);
    const choices=[correct,...wrong].sort((a,b)=> ((a.length+i*17)%23)-((b.length+i*17)%23));
    return {...q,answer:correct,choices};
  });
}
function questionScore(state: Store, q: PracticeQuestion) {
  const r=state.ratings[q.id];
  return r==='miss'?0:r==='partial'?1:r==='good'?3:0;
}
export function DocumentsTrain() {
  const navigate=useNavigate();
  const { state, rate }=useDocumentStore();
  const initial=(new URLSearchParams(window.location.search).get('mode')||'cards') as PracticeMode;
  const [mode,setMode]=useState<PracticeMode>(['cards','quiz','scenario','exam'].includes(initial)?initial:'cards');
  const [scope,setScope]=useState<'all'|'favorites'|'priority'>('all');
  const [index,setIndex]=useState(0),[revealed,setRevealed]=useState(false),[selected,setSelected]=useState(''),[missed,setMissed]=useState(0),[finished,setFinished]=useState(false);
  const questions=useMemo(()=>{
    const all=makeQuestions(mode);
    const filtered=scope==='all'?all:all.filter(q=>q.documentId && (scope==='favorites'?state.favorites.includes(q.documentId):nursingDocuments.some(d=>d.id===q.documentId&&d.priority)));
    if(mode==='cards')return filtered.sort((a,b)=>questionScore(state,a)-questionScore(state,b)||((state.history[a.id]||0)-(state.history[b.id]||0))).slice(0,15);
    if(mode==='quiz')return filtered.slice(0,20);
    return filtered;
  // Recompute set when mode/scope changes, not each score update.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[mode,scope]);
  const current=questions[index];
  function reset(nextMode=mode,nextScope=scope){setMode(nextMode);setScope(nextScope);setIndex(0);setSelected('');setRevealed(false);setMissed(0);setFinished(false);navigate('/documents/train?mode='+nextMode,{replace:true});}
  function answer(score:Rating){if(!current)return;rate(current.id,score);if(score!=='good')setMissed(x=>x+1);if(index+1>=questions.length)setFinished(true);else {setIndex(i=>i+1);setRevealed(false);setSelected('');}}
  function choose(value:string){if(selected)return;setSelected(value);setRevealed(true);}
  return <div className="layout page documents-page doc-train"><Link to="/documents" className="back-link"><ArrowLeft size={16}/> К справочнику</Link>
    <h1>Тренажёр документов</h1><p className="doc-muted">Помни номер и смысл документа — это разные навыки. Отвечай своими словами, когда нет вариантов.</p>
    <div className="doc-train-tabs">{([['cards','Карточки'],['quiz','Тест'],['scenario','Ситуации'],['exam','Экзамен']] as const).map(([v,l])=><button key={v} className={v===mode?'active':''} onClick={()=>reset(v)}>{l}</button>)}</div>
    <div className="doc-train-settings"><label>Что тренировать? <select value={scope} onChange={e=>reset(mode,e.target.value as typeof scope)}><option value="all">Все документы</option><option value="priority">Приоритетные</option><option value="favorites">Избранные</option></select></label></div>
    {questions.length===0?<div className="doc-training-card"><h2>Нет вопросов для этой выборки</h2><p>Добавь документы в избранное или выбери все документы.</p><button className="btn primary" onClick={()=>reset(mode,'all')}>Все документы</button></div>:
    finished?<div className="doc-training-card doc-finished"><GraduationCap size={36}/><h2>Готово!</h2><p>Вопросов: {questions.length}. Требуют повторения: {missed}.</p><button className="btn primary" onClick={()=>reset()}>Повторить <RotateCcw size={17}/></button></div>:
    <div className="doc-training-card"><div className="doc-counter">{index+1} / {questions.length} <span>{current.skill==='number'?'Номер документа':'Значение и требования'}</span></div>
      <div className="doc-progress"><div style={{width:(index/questions.length*100)+'%'}}/></div>
      <h2>{current.prompt}</h2>
      {!revealed&&<p className="doc-muted">{mode==='quiz'?'Выбери правильный вариант.':'Ответь вслух, затем открой эталон.'}</p>}
      {mode==='quiz'&&current.choices&&<div className="doc-choices">{current.choices.map(v=>{const correct=same(v,current.answer);const picked=same(v,selected);const state=selected?(correct?'correct':picked?'incorrect':'muted'):'';return <button key={v} type="button" disabled={Boolean(selected)} className={state} onClick={()=>choose(v)}>{selected&&correct?<span aria-hidden="true">✓ </span>:selected&&picked?<span aria-hidden="true">✕ </span>:null}{v}</button>;})}</div>}
      {revealed&&<div className={'doc-answer '+(mode==='quiz'?(same(selected,current.answer)?'doc-answer-correct':'doc-answer-incorrect'):'')} role="status" aria-live="polite"><strong>{mode==='quiz'?(same(selected,current.answer)?'✓ Верно!':'✕ Неверно — правильный ответ выделен зелёным'):'Эталонный ответ'}</strong><p>{current.answer}</p>{mode==='quiz'&&selected&&!same(selected,current.answer)&&<p><strong>Твой ответ:</strong> {selected}</p>}</div>}
      {!revealed&&mode!=='quiz'&&<button className="btn primary" onClick={()=>setRevealed(true)}>Показать ответ <ArrowRight size={16}/></button>}
      {revealed&&<div className="doc-rating"><span>{mode==='quiz' ? 'Ответ проверен' : 'Насколько хорошо получилось?'}</span>{mode!=='quiz'&&<><button onClick={()=>answer('miss')}>Забыла</button><button onClick={()=>answer('partial')}>Частично</button></>}<button onClick={()=>answer(mode==='quiz'?(same(selected,current.answer)?'good':'miss'):'good')}><Check size={15}/> {mode==='quiz'?'Далее':'Вспомнила'}</button></div>}
    </div>}
    <Notice/>
  </div>;
}
