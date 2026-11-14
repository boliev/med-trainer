import { DocumentsHome, DocumentDetail, DocumentsTrain } from './documents/Module';
import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Brain, Check, CheckCircle2, ChevronRight, CircleHelp, ClipboardCheck, Clock3, GraduationCap, HeartPulse, ListChecks, RotateCcw, Search, Sparkles, Star, Stethoscope, X } from 'lucide-react';
import { checklists, flatten, loadErrors, type Checklist } from './data';
import { useStudy, type Rating, type StudyState } from './storage';

type StudyActions = ReturnType<typeof useStudy>;

function Header() {
  return <header className="site-header"><div className="layout header-inside">
    <Link to="/" className="brand" aria-label="На главную"><span className="brand-symbol"><HeartPulse size={22}/></span><span>практика<span className="brand-dot">.</span></span></Link>
    <span className="header-note"><span className="status-dot"/> Учиться с заботой о себе</span>
  </div></header>;
}

function Home() {
  return <div className="layout home">
    <div className="eyebrow"><Sparkles size={15}/> Учёба без перегруза</div>
    <h1>Маленькие шаги.<br/><span>Большие знания.</span></h1>
    <p className="hero-description">Место, где сложные медицинские алгоритмы становятся понятнее. Повторяй в своём темпе, проверяй себя и замечай прогресс.</p>
    <div className="home-grid">
      <Link to="/check" className="module-card module-active"><div className="module-icon"><ListChecks size={25}/></div><div className="module-body"><span className="module-kicker">Тренажёр № 01</span><h2>Чек-листы</h2><p>Учи последовательность действий, вспоминай по памяти и повторяй сложное.</p><span className="module-link">Открыть тренажёр <ArrowRight size={17}/></span></div><div className="module-corner"><ChevronRight size={21}/></div></Link>
      <Link to="/documents" className="module-card module-active"><div className="module-icon"><BookOpen size={25}/></div><div className="module-body"><span className="module-kicker">Справочник и тренажёр № 02</span><h2>Нормативные документы</h2><p>Запоминай номера приказов и понимай, что регулирует каждый документ.</p><span className="module-link">Открыть справочник и тренажёр <ArrowRight size={17}/></span></div><div className="module-corner"><ChevronRight size={21}/></div></Link>
    </div>
    <div className="home-footer"><Stethoscope size={18}/> Создано для спокойной, последовательной подготовки к занятиям</div>
  </div>;
}
function pluralRu(value: number, one: string, few: string, many: string) {
  const n = Math.abs(value);
  if (n % 100 >= 11 && n % 100 <= 14) return many;
  if (n % 10 === 1) return one;
  if (n % 10 >= 2 && n % 10 <= 4) return few;
  return many;
}
function stepCount(c: Checklist) { return c.parts.reduce((n,p)=>n+p.items.length,0); }
function summary(c: Checklist, study: StudyState) {
  const ratings=study.progress[c.id]?.ratings??{};
  const count=flatten(c).filter(it=>ratings[it.pos]==='good').length;
  return { mastered:count, total:stepCount(c), attempts:study.progress[c.id]?.attempts??0 };
}
function ListCard({c,study,toggleFavorite}:{c:Checklist;study:StudyState;toggleFavorite:(id:number)=>void}){
  const fav=study.favorites.includes(c.id), s=summary(c,study);
  return <article className="check-card">
    <button type="button" className={`star-button ${fav?'selected':''}`} onClick={()=>toggleFavorite(c.id)} aria-label={fav?'Убрать из избранного':'В избранное'} title={fav?'Убрать из избранного':'В избранное'} aria-pressed={fav}><Star size={20} fill={fav?'currentColor':'none'}/></button>
    <Link className="check-link" to={`/check/${c.id}`}>
      <span className="check-title">{c.name}</span>
      <span className="check-meta"><span>{s.total} {pluralRu(s.total, 'пункт', 'пункта', 'пунктов')}</span><span className="meta-sep"/>{s.attempts?`${s.mastered} освоено · ${s.attempts} ${pluralRu(s.attempts, 'тренировка', 'тренировки', 'тренировок')}`:'Ещё не проходили'}</span>
    </Link>
    <Link to={`/check/${c.id}`} className="card-arrow" aria-label={`Открыть ${c.name}`}><ChevronRight size={19}/></Link>
  </article>;
}
function ChecklistList({actions}:{actions:StudyActions}){
  const [query,setQuery]=useState('');
  const filtered=checklists.filter(c=>c.name.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')));
  const fav=filtered.filter(c=>actions.study.favorites.includes(c.id));
  const rest=filtered.filter(c=>!actions.study.favorites.includes(c.id));
  return <div className="layout page"><Link to="/" className="back-link"><ArrowLeft size={16}/> На главную</Link>
    <div className="page-heading"><div><div className="eyebrow"><GraduationCap size={16}/> Учебный тренажёр</div><h1>Чек-листы</h1><p>Вспоминай действия по порядку. Не обязательно слово в слово — главное, ничего не упустить.</p></div><span className="count-pill">{checklists.length} {pluralRu(checklists.length, 'алгоритм', 'алгоритма', 'алгоритмов')}</span></div>
    <div className="search-field"><Search size={19}/><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Найти чек-лист…" aria-label="Поиск чек-листа"/>{query&&<button onClick={()=>setQuery('')} aria-label="Очистить поиск"><X size={17}/></button>}</div>
    {loadErrors.length>0&&<div className="error-box">Ошибки загрузки JSON: {loadErrors.join('; ')}</div>}
    {fav.length>0&&<section className="list-section"><div className="section-heading"><Star size={16} fill="currentColor"/><h2>Избранное</h2><span>{fav.length}</span></div><div className="checks">{fav.map(c=><ListCard key={c.id} c={c} study={actions.study} toggleFavorite={actions.toggleFavorite}/>)}</div></section>}
    {rest.length>0&&<section className={`list-section ${fav.length?'with-divider':''}`}><div className="section-heading"><ListChecks size={17}/><h2>{fav.length?'Все остальные':'Все чек-листы'}</h2><span>{rest.length}</span></div><div className="checks">{rest.map(c=><ListCard key={c.id} c={c} study={actions.study} toggleFavorite={actions.toggleFavorite}/>)}</div></section>}
    {filtered.length===0&&<div className="empty-state"><Search size={30}/><h3>Ничего не найдено</h3><p>Попробуй другое название.</p></div>}
    <p className="footnote"><Star size={15}/> Добавляй в избранное те алгоритмы, которые учишь прямо сейчас. Они всегда будут сверху.</p>
  </div>;
}

type Mode='learn'|'review'|'exam';
function RatingButtons({onRate}:{onRate:(r:Rating)=>void}){
  return <div className="rating-row"><button type="button" className="rating good" onClick={()=>onRate('good')}><Check size={18}/> Вспомнила</button><button type="button" className="rating partial" onClick={()=>onRate('partial')}><CircleHelp size={18}/> Частично</button><button type="button" className="rating miss" onClick={()=>onRate('miss')}><RotateCcw size={18}/> Забыла</button></div>;
}
function ProgressBar({current,total}:{current:number;total:number}) {return <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current}><div className="progress-fill" style={{width:`${total?current/total*100:0}%`}}/></div>}
function Practice({c,actions}:{c:Checklist;actions:StudyActions}){
  const steps=useMemo(()=>flatten(c),[c]);
  const navigate=useNavigate();
  const oldRatings=actions.study.progress[c.id]?.ratings??{};
  const [mode,setMode]=useState<Mode>('learn');
  const [idx,setIdx]=useState(0);
  const [show,setShow]=useState(false);
  const [hint,setHint]=useState(false);
  const [sessionRatings,setSessionRatings]=useState<Record<string,Rating>>({});
  const [done,setDone]=useState(false);
  const [examReveal,setExamReveal]=useState(false);
  const [examMisses,setExamMisses]=useState<number[]>([]);
  const weakSteps=steps.filter(s=>oldRatings[s.pos]==='partial'||oldRatings[s.pos]==='miss');
  const active=mode==='review'?weakSteps:steps;
  const current=active[idx];
  const favorite=actions.study.favorites.includes(c.id);
  function reset(m:Mode){setMode(m);setIdx(0);setShow(false);setHint(false);setSessionRatings({});setDone(false);setExamReveal(false);setExamMisses([]);}
  function rate(r:Rating){
    if(!current)return;
    const next={...sessionRatings,[current.pos]:r};
    setSessionRatings(next);setShow(false);setHint(false);
    if(idx>=active.length-1){actions.saveRatings(c.id,next,mode==='learn');setDone(true);}else setIdx(i=>i+1);
  }
  function saveExam(){const ratings=Object.fromEntries(steps.map(s=>[String(s.pos),examMisses.includes(s.pos)?'miss':'good' as Rating])) as Record<string,Rating>;
    actions.saveRatings(c.id,ratings,true);setDone(true);
  }
  function goBack(){navigate('/check');}
  const score=Object.values(sessionRatings).filter(r=>r==='good').length;
  const problem=Object.values(sessionRatings).filter(r=>r!=='good').length;
  useEffect(()=>{window.scrollTo({top:0,behavior:'smooth'});},[done,mode]);
  return <div className="layout page practice-page"><button className="back-link back-button" onClick={goBack}><ArrowLeft size={16}/> Все чек-листы</button>
    <div className="practice-heading"><div><div className="eyebrow"><ClipboardCheck size={16}/> Тренировка алгоритма</div><h1>{c.name}</h1><p>{steps.length} {pluralRu(steps.length, 'пункт', 'пункта', 'пунктов')} · {c.parts.length} {pluralRu(c.parts.length, 'этап', 'этапа', 'этапов')}</p></div><button type="button" className={`favorite-large ${favorite?'selected':''}`} onClick={()=>actions.toggleFavorite(c.id)} title={favorite?'Убрать из избранного':'В избранное'}><Star size={19} fill={favorite?'currentColor':'none'}/><span>{favorite?'В избранном':'В избранное'}</span></button></div>
    <div className="mode-tabs" role="group" aria-label="Режим тренировки"><button className={mode==='learn'?'active':''} onClick={()=>reset('learn')}><Brain size={17}/> Обучение</button><button className={mode==='review'?'active':''} onClick={()=>reset('review')}><RotateCcw size={17}/> Ошибки{weakSteps.length>0&&<span className="tab-count">{weakSteps.length}</span>}</button><button className={mode==='exam'?'active':''} onClick={()=>reset('exam')}><GraduationCap size={18}/> Экзамен</button></div>
    {done?<div className="study-card completed"><div className="finished-icon"><CheckCircle2 size={34}/></div><h2>{mode==='exam'?'Экзамен завершён':'Тренировка завершена!'}</h2><p>{mode==='exam'?`Отмечено пропусков: ${examMisses.length} из ${steps.length}.`:`Полностью вспомнила: ${score} · Нужно повторить: ${problem}`}</p><div className="finish-actions"><button className="btn primary" onClick={()=>reset(mode)}><RotateCcw size={17}/> Пройти ещё раз</button>{mode!=='exam'&&problem>0&&<button className="btn outline" onClick={()=>reset('review')}>Повторить сложное</button>}<button className="btn subtle" onClick={goBack}>К списку <ArrowRight size={17}/></button></div></div>:
      mode==='exam'?<div className="study-card exam-card"><div className="study-card-header"><span className="stage-tag"><GraduationCap size={16}/> Самопроверка</span><span className="step-number">{steps.length} {pluralRu(steps.length, 'пункт', 'пункта', 'пунктов')}</span></div>
        {!examReveal?<div className="question-area"><div className="big-icon"><Brain size={30}/></div><h2>Расскажи весь алгоритм</h2><p>Воспроизведи все действия в правильной последовательности, не заглядывая в ответы. Когда закончишь, открой эталон и отметь пропущенные пункты.</p><button className="btn primary" onClick={()=>setExamReveal(true)}>Открыть чек-лист <ArrowRight size={17}/></button></div>:
        <div className="exam-results"><h2>Проверь себя</h2><p>Отметь пункты, которые пропустила или назвала неверно. Остальные будем считать верными.</p>{steps.map(s=><label className={`exam-item ${examMisses.includes(s.pos)?'missed':''}`} key={s.pos}><input type="checkbox" checked={examMisses.includes(s.pos)} onChange={e=>setExamMisses(a=>e.target.checked?[...a,s.pos]:a.filter(n=>n!==s.pos))}/><span className="exam-step-number">{s.pos}.</span><span>{s.item}</span></label>)}<button className="btn primary full" onClick={saveExam}>Сохранить результат <Check size={17}/></button></div>}</div>:
      mode==='review'&&weakSteps.length===0?<div className="study-card empty-review"><CheckCircle2 size={34}/><h2>Пока нет сложных пунктов</h2><p>Пройди чек-лист в режиме обучения и отметь, что удалось вспомнить не полностью. Здесь появятся пункты для повторения.</p><button className="btn primary" onClick={()=>reset('learn')}>Начать обучение <ArrowRight size={17}/></button></div>:
      <div className="study-card"><div className="study-card-header"><span className="stage-tag"><span className="stage-dot"/>{current?.partName}</span><span className="step-number">{idx+1} / {active.length}</span></div><ProgressBar current={idx} total={active.length}/>
        {mode==='learn'&&idx>0&&<div className="history-block"><span className="history-label">Уже вспомнили</span><div className="history-list">{active.slice(0,idx).map(s=><div className="history-item" key={s.pos}><span className={`history-mark ${sessionRatings[s.pos]}`}><Check size={13}/></span><span><strong>{s.pos}.</strong> {s.item}</span></div>)}</div></div>}
        {mode==='review'&&current&&<div className="previous-context"><span>Предыдущее действие</span>{steps.find(s=>s.pos===current.pos-1)?.item??'Это первый пункт алгоритма'}</div>}
        <div className="question-area"><div className="big-icon"><Brain size={30}/></div><span className="question-kicker">{mode==='review'?'Вспомни этот шаг алгоритма':'Следующий шаг'}</span><h2>{mode==='review'?'Что нужно сделать на этом этапе?':'Какое действие идёт следующим?'}</h2><p>Проговори ответ вслух своими словами, затем сравни с эталоном.</p>
          {!show?<div className="reveal-actions">{current?.hint&&<button className="hint-button" onClick={()=>setHint(v=>!v)}><CircleHelp size={16}/>{hint?'Скрыть подсказку':'Нужна подсказка?'}</button>}{hint&&current?.hint&&<div className="hint-box">{current.hint}</div>}<button className="btn primary" onClick={()=>setShow(true)}>Показать ответ <ArrowRight size={18}/></button></div>:
          <div className="answer"><div className="answer-label"><CheckCircle2 size={16}/> Правильный ответ · пункт {current?.pos}</div><div className="answer-content">{current?.item}</div><p className="assess-label">Насколько полно получилось вспомнить?</p><RatingButtons onRate={rate}/><p className="rating-help">Оцени действие и важные детали, а не точность формулировки.</p></div>}</div>
      </div>}
    <p className="practice-tip"><Clock3 size={15}/> Прогресс сохраняется в этом браузере. Текст алгоритмов взят из загруженных учебных материалов.</p>
  </div>;
}
function Detail({actions}:{actions:StudyActions}){
  const {id}=useParams();const c=checklists.find(c=>String(c.id)===id);
  if(!c)return <div className="layout not-found"><h1>Чек-лист не найден</h1><p>Возможно, его удалили или изменили идентификатор.</p><Link to="/check" className="btn primary">Вернуться к списку</Link></div>;
  return <Practice key={c.id} c={c} actions={actions}/>;
}
export default function App(){const actions=useStudy();return <><Header/><main><Routes><Route path="/" element={<Home/>}/><Route path="/check" element={<ChecklistList actions={actions}/>}/><Route path="/documents" element={<DocumentsHome/>}/><Route path="/documents/train" element={<DocumentsTrain/>}/><Route path="/documents/:id" element={<DocumentDetail/>}/><Route path="/check/:id" element={<Detail actions={actions}/>}/><Route path="*" element={<div className="layout not-found"><h1>Такой страницы нет</h1><Link to="/" className="btn primary">На главную</Link></div>}/></Routes></main><footer className="site-footer layout">С любовью к знаниям <span>✳</span> Практика</footer></>}
