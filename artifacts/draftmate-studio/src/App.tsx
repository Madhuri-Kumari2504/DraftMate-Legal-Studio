import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  Activity, AlignLeft, ArrowDownToLine, BookOpen,
  Check, ChevronRight, CircleHelp, ClipboardCheck, Copy, FileCheck2, FilePlus2,
  FileSearch, FileText, FolderOpen, Gavel, Library, LockKeyhole, Menu, Mic,
  PenLine, Plus, RefreshCw, Scale, Search, Settings2, ShieldCheck, Sparkles,
  Trash2, Upload, X,
} from 'lucide-react';
import {
  DraftmateCitationStatus, DraftmateModelId,
  useGenerateDraftmateDraft, useHealthCheck, useListDraftmateSkills,
  useReviewDraftmateContract, useVerifyDraftmateCitations,
  getHealthCheckQueryKey, getListDraftmateSkillsQueryKey,
} from '@workspace/api-client-react';
import type {
  DraftmateCitationCheck, DraftmateModelId as ModelId, DraftmateSkillId,
  DraftmateSupportingMaterial, DraftmateSkill,
} from '@workspace/api-client-react';

type LocalDoc = { id: string; name: string; text: string; kind: 'document' | 'template'; updatedAt: string; };
type LocalDraft = { id: string; title: string; text: string; updatedAt: string; };
const DOCS_KEY = 'draftmate.local-documents.v1';
const DRAFTS_KEY = 'draftmate.local-drafts.v1';
const PREFS_KEY = 'draftmate.preferences.v1';
const queryClient = new QueryClient();
const modelNames: Record<string, string> = {
  [DraftmateModelId['gpt-61-sol']]: 'GPT 6.1 Sol · general-purpose',
  [DraftmateModelId['gpt-6-luna']]: 'GPT 6 Luna · cost-sensitive',
  [DraftmateModelId['gpt-6-astra']]: 'GPT 6 Astra · highest capability',
};
const navItems = [
  { href: '/', label: 'Workspace', icon: AlignLeft },
  { href: '/draft', label: 'Drafting', icon: PenLine },
  { href: '/review', label: 'Contract review', icon: FileCheck2 },
  { href: '/research', label: 'Research & citations', icon: Search },
  { href: '/library', label: 'Document library', icon: Library },
  { href: '/skills', label: 'Skills catalogue', icon: Gavel },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];
const skillLabels: Record<string, string> = {
  'agreement-drafting':'Agreement drafting','legal-notice':'Legal notice','petition':'Petition',
  'contract-review':'Contract review','redlining':'Redlining','legal-research':'Legal research',
  'document-summary':'Document summary','case-analysis':'Case analysis','due-diligence':'Due diligence',
};
const defaultSkills: DraftmateSkill[] = Object.entries(skillLabels).map(([id,label]) => ({
  id: id as DraftmateSkillId, label, category: 'Legal workflow',
  description: 'A focused workflow for professional legal work, with the supplied materials as its source boundary.',
}));
function readLocal<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readLocal(key, initial));
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* browser storage quota */ } }, [key, value]);
  return [value, setValue] as const;
}
function uid() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function formatDate(date: string) { return new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
function errorText(error: unknown) { return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; }

function Studio() {
  const [path, setPath] = useLocation();
  const [documents, setDocuments] = useLocalState<LocalDoc[]>(DOCS_KEY, []);
  const [drafts, setDrafts] = useLocalState<LocalDraft[]>(DRAFTS_KEY, []);
  const [prefs, setPrefs] = useLocalState<{model: ModelId; privacy: boolean}>(PREFS_KEY, { model: DraftmateModelId['gpt-61-sol'], privacy: true });
  const [confirm, setConfirm] = useState<{title:string; body:string; action:()=>void}|null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: 1 } });
  const skillsQuery = useListDraftmateSkills({ query: { queryKey: getListDraftmateSkillsQueryKey(), retry: 1 } });
  const skills = skillsQuery.data ?? [];
  const resolvedSkills = skills.length ? skills : defaultSkills;
  const generate = useGenerateDraftmateDraft();
  const review = useReviewDraftmateContract();
  const verify = useVerifyDraftmateCitations();
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const askConfirm = (title:string, body:string, action:()=>void) => setConfirm({title,body,action});
  const pageTitle = navItems.find(i => i.href === path)?.label ?? 'Workspace';
  const insertGenerated = (title:string, text:string) => {
    const draft: LocalDraft = { id:uid(), title, text, updatedAt:new Date().toISOString() };
    setDrafts(old => [draft,...old]); flash('Saved to this browser’s draft library.');
  };
  const selectedPage = path === '/' ? <Home documents={documents} drafts={drafts} skills={resolvedSkills} health={health} skillsLoading={skillsQuery.isLoading} onRoute={setPath} /> :
    path === '/draft' ? <DraftPage docs={documents} model={prefs.model} onModelChange={m=>setPrefs({...prefs,model:m})} skills={resolvedSkills} mutation={generate} onSave={insertGenerated} onFlash={flash} requestConsent={(n,action)=>prefs.privacy&&n>0?askConfirm('Send selected references?',`${n} selected reference${n>1?'s':''} will be sent to the AI service for this action only.`,action):action()} /> :
    path === '/review' ? <ReviewPage docs={documents} model={prefs.model} mutation={review} onFlash={flash} askConfirm={askConfirm} requestConsent={(n,action)=>prefs.privacy&&n>0?askConfirm('Send selected supporting materials?',`${n} selected document${n>1?'s':''} will be sent with this review action only.`,action):action()} setDrafts={setDrafts} /> :
    path === '/research' ? <ResearchPage docs={documents} mutation={verify} onFlash={flash} requestConsent={(n,action)=>prefs.privacy&&n>0?askConfirm('Send selected source materials?',`${n} selected source${n>1?'s':''} will be sent for this citation comparison only.`,action):action()} /> :
    path === '/library' ? <LibraryPage docs={documents} setDocs={setDocuments} drafts={drafts} setDrafts={setDrafts} askConfirm={askConfirm} onFlash={flash} /> :
    path === '/skills' ? <SkillsPage skills={resolvedSkills} loading={skillsQuery.isLoading} error={skillsQuery.error} retry={() => skillsQuery.refetch()} /> :
    path === '/settings' ? <SettingsPage prefs={prefs} setPrefs={setPrefs} health={health} /> : <NotFound onBack={() => setPath('/')} />;
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav?'open':''}`}>
      <Link href="/" className="brand" onClick={() => setMobileNav(false)}><span className="brand-mark"><Scale size={19}/></span><span><span className="brand-name">DraftMate</span><span className="brand-caption">LEGAL STUDIO</span></span></Link>
      <div className="nav-label">Your workbench</div>
      <nav className="nav-list" aria-label="Primary navigation">{navItems.map(item => {
        const Icon = item.icon; return <Link key={item.href} href={item.href} className={`nav-link ${path===item.href?'active':''}`} onClick={() => setMobileNav(false)} data-testid={`link-nav-${item.href.replace('/','home')}`}><Icon/><span>{item.label}</span></Link>;
      })}</nav>
      <div className="sidebar-bottom"><div className="privacy-card"><LockKeyhole size={15} color="#d4b47c"/><strong>Private by design</strong><p>Your files stay in this browser. Nothing is sent until you choose an AI action.</p></div><div className="sidebar-footer">HUMAN JUDGMENT, ALWAYS</div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div style={{display:'flex',alignItems:'center',gap:12}}><button className="btn icon-btn mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(v=>!v)}><Menu/></button><span className="crumb">DraftMate / {pageTitle}</span></div><div className="top-actions"><div className="connection"><i className="status-dot"/><span>{health.isLoading?'Checking connection':health.isError?'Service unavailable':'Workspace ready'}</span></div><Link className="btn icon-btn" href="/settings" aria-label="Settings"><Settings2/></Link></div></header>
      {selectedPage}
    </main>
    {toast && <div role="status" className="toast-message"><Check size={15}/>{toast}</div>}
    {confirm && <div className="modal-backdrop" role="presentation"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title"><div className="section-head"><h2 id="confirm-title">{confirm.title}</h2><button className="btn icon-btn btn-quiet" onClick={() => setConfirm(null)} aria-label="Close"><X/></button></div><p className="muted">{confirm.body}</p><div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:22}}><button className="btn" onClick={() => setConfirm(null)}>Keep it</button><button className="btn btn-danger" onClick={() => {confirm.action();setConfirm(null);}}>Confirm</button></div></div></div>}
  </div>;
}

function PageHead({eyebrow,title,desc,children}:{eyebrow:string;title:string;desc:string;children?:ReactNode}) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="subhead">{desc}</p></div>{children}</div>;
}
function Home({documents,drafts,skills,health,skillsLoading,onRoute}:{documents:LocalDoc[];drafts:LocalDraft[];skills:DraftmateSkill[];health:any;skillsLoading:boolean;onRoute:(path:string)=>void}) {
  return <div className="page-wrap"><PageHead eyebrow="Legal workbench · Private by default" title="Good work begins with a clear record." desc="Draft, examine, and verify with your materials in view. You decide what leaves this browser and when."/>
    <div className="grid-two">
      <section className="panel panel-pad"><div className="section-head"><div><p className="eyebrow">Start a focused task</p><h2>What are we working on?</h2></div><span className="chip">HUMAN IN CONTROL</span></div><div className="home-actions">
        {[{to:'/draft',title:'Draft a document',text:'Start from an instruction, style guide, and supplied references.',icon:PenLine},{to:'/review',title:'Review an agreement',text:'Surface issues, examine changes, and retain the original.',icon:FileCheck2},{to:'/research',title:'Check citations',text:'Compare references only against materials you provide.',icon:Search}].map(({to,title,text,icon:Icon})=><button key={to} className="task-link" onClick={()=>onRoute(to)}><span className="task-icon"><Icon size={18}/></span><span><strong>{title}</strong><small>{text}</small></span><ChevronRight size={16}/></button>)}
      </div><div className="note-strip" style={{marginTop:18}}>AI-generated work is a starting point, not legal advice. Review every output against the full record and your professional judgment.</div></section>
      <section className="panel panel-pad"><div className="section-head"><div><p className="eyebrow">Your local workspace</p><h2>Recent material</h2></div><button className="btn" onClick={()=>onRoute('/library')}>Open library <ChevronRight/></button></div>
        {drafts.length===0&&documents.length===0?<div className="empty-state"><span className="empty-icon"><FolderOpen/></span><h3>A clean desk, ready for your files</h3><p>Documents and drafts you save remain in this browser. Add a reference when you’re ready.</p><button className="btn" onClick={()=>onRoute('/library')}><Upload/> Add material</button></div>:<div>{[...drafts.map(x=>({...x,kind:'draft'})),...documents].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,5).map((d:any)=><div className="list-row" key={d.id}><div><div className="doc-title">{d.title??d.name}</div><div className="doc-meta">{d.kind==='draft'?'Working draft':'Reference · '+d.kind} · {formatDate(d.updatedAt)}</div></div><ChevronRight size={15}/></div>)}</div>}
      </section>
    </div>
    <div className="home-foot-grid"><section className="panel panel-pad"><div className="section-head"><div><p className="eyebrow">Available workflows</p><h2>Skills for legal work</h2></div><button className="btn" onClick={()=>onRoute('/skills')}>Browse catalogue</button></div>{skillsLoading?<div className="loading-line"/>:<div className="chips">{skills.slice(0,6).map(s=><span className="chip" key={s.id}>{s.label}</span>)}</div>}</section>
      <section className="panel panel-pad"><div className="section-head"><div><p className="eyebrow">Connection</p><h2>Service status</h2></div><Activity size={19} color="#718a79"/></div>{health.isLoading?<div className="loading-line"/>:health.isError?<div className="error-box">The service could not be reached. Your local files remain available.</div>:<p className="muted">API reports: <strong>{health.data?.status ?? 'available'}</strong>. No document content is stored here.</p>}</section></div>
  </div>;
}

function ModelField({model,onChange}:{model:ModelId;onChange:(m:ModelId)=>void}) {
  return <label><span className="field-label">Working model</span><select className="field" value={model} onChange={e=>onChange(e.target.value as ModelId)}>{Object.entries(modelNames).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></label>;
}
function LocalMaterialPicker({docs,selected,onToggle}:{docs:LocalDoc[];selected:string[];onToggle:(id:string)=>void}) {
  const refs=docs.filter(d=>d.kind==='document');
  return <div><span className="field-label">Include local references · optional</span>{refs.length===0?<div className="muted">No local references yet. <Link href="/library">Add a document in your library.</Link></div>:<div className="material-list">{refs.map(d=><label className="material-option" key={d.id}><input type="checkbox" checked={selected.includes(d.id)} onChange={()=>onToggle(d.id)}/><span>{d.name}</span></label>)}</div>}<p className="tiny-hint">Selected text is sent only when you invoke this AI action.</p></div>;
}
function VoiceButton({onText}:{onText:(text:string)=>void}) {
  const [message,setMessage]=useState('');
  const start=()=>{
    type SR={lang:string;interimResults:boolean;onresult:((e:any)=>void)|null;onerror:((e:any)=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void};
    const win=window as Window & {SpeechRecognition?:new()=>SR;webkitSpeechRecognition?:new()=>SR};
    const C=win.SpeechRecognition??win.webkitSpeechRecognition;
    if(!C){setMessage('Voice dictation is not available here. Type your instruction manually.');return;}
    const rec=new C();rec.lang='en-US';rec.interimResults=false;setMessage('Listening… speak your instruction.');rec.onresult=e=>{const value=e.results?.[0]?.[0]?.transcript??'';if(value)onText(value);setMessage(value?'Dictation added. Review it before continuing.':'');};rec.onerror=()=>setMessage('Dictation stopped. You can enter the instruction manually.');rec.onend=()=>{};rec.start();
  };
  return <div className="voice-wrap"><button type="button" className="btn" onClick={start}><Mic/> Dictate instruction</button>{message&&<span role="status">{message}</span>}</div>;
}
function DraftPage({docs,model,onModelChange,skills,mutation,onSave,onFlash,requestConsent}:{docs:LocalDoc[];model:ModelId;onModelChange:(m:ModelId)=>void;skills:DraftmateSkill[];mutation:any;onSave:(title:string,text:string)=>void;onFlash:(m:string)=>void;requestConsent:(n:number,action:()=>void)=>void}) {
  const [skill,setSkill]=useState<DraftmateSkillId>('agreement-drafting');const [instruction,setInstruction]=useState('');const [jurisdiction,setJurisdiction]=useState('');const [styleGuide,setStyleGuide]=useState('');const [selected,setSelected]=useState<string[]>([]);const [result,setResult]=useState<any>(null);const [edited,setEdited]=useState('');const [saveOpen,setSaveOpen]=useState(false);const [title,setTitle]=useState('');
  const toggle=(id:string)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const run=()=>{if(!instruction.trim())return;requestConsent(selected.length,()=>{const refs:DraftmateSupportingMaterial[]=docs.filter(d=>selected.includes(d.id)).slice(0,8).map(d=>({name:d.name,text:d.text.slice(0,20000)}));mutation.mutate({data:{skill,instruction:instruction.trim(),jurisdiction,styleGuide,model,referenceMaterials:refs}},{onSuccess:(data:any)=>{setResult(data);setEdited(data.draft);setTitle(data.title);},onError:(e:unknown)=>onFlash(errorText(e))});});};
  const copy=async()=>{await navigator.clipboard.writeText(edited);onFlash('Draft copied to clipboard.');};
  const download=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([edited],{type:'text/plain'}));a.download=`${(title||'draft').replace(/[^a-z0-9-_]+/gi,'-')}.txt`;a.click();URL.revokeObjectURL(a.href);};
  return <div className="page-wrap"><PageHead eyebrow="Drafting · Human-reviewed output" title="Shape the first working draft." desc="Set the task, supply only the context you intend to use, and review every line before it becomes part of your record."/>
    <div className="grid-two"><section className="panel panel-pad stack"><div className="field-row"><label><span className="field-label">Legal skill</span><select className="field" value={skill} onChange={e=>setSkill(e.target.value as DraftmateSkillId)}>{skills.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><ModelField model={model} onChange={onModelChange} /></div>
      <label><span className="field-label">Your instruction</span><textarea className="field" value={instruction} onChange={e=>setInstruction(e.target.value)} maxLength={6000} placeholder="Describe the document, parties, purpose, key terms, and what should remain unchanged."/><small className="tiny-hint">{instruction.length}/6000 · Nothing is sent until you select Generate draft.</small></label><VoiceButton onText={v=>setInstruction(old=>old?`${old} ${v}`:v)}/>
      <div className="field-row"><label><span className="field-label">Jurisdiction · optional</span><input className="field" value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)} maxLength={300} placeholder="For example, governing jurisdiction"/></label><label><span className="field-label">Style notes · optional</span><input className="field" value={styleGuide} onChange={e=>setStyleGuide(e.target.value)} maxLength={12000} placeholder="Tone, clause style, formatting preferences"/></label></div>
      <LocalMaterialPicker docs={docs} selected={selected} onToggle={toggle}/>
      <div className="note-strip"><ShieldCheck size={15}/> {selected.length ? `${selected.length} selected local reference${selected.length>1?'s':''} will be sent for this generation only.`:'Your local files are not included unless selected above.'} AI output is not legal advice. AI usage is billed by OpenAI separately.</div>
      <button className="btn btn-primary" onClick={run} disabled={mutation.isPending||!instruction.trim()}>{mutation.isPending?<><RefreshCw className="spin"/> Preparing draft…</>:<><Sparkles/> Generate draft</>}</button>
      {mutation.isError&&<p className="error-box" role="alert">{errorText(mutation.error)} <button className="text-btn" onClick={run}>Retry</button></p>}
    </section><section className="panel panel-pad"><div className="section-head"><div><p className="eyebrow">Working document</p><h2>{result?.title??'Draft canvas'}</h2></div>{result&&<div className="chips"><button className="btn icon-btn" aria-label="Copy draft" onClick={copy}><Copy/></button><button className="btn icon-btn" aria-label="Download draft" onClick={download}><ArrowDownToLine/></button></div>}</div>
      {!result&&!mutation.isPending?<div className="empty-state"><span className="empty-icon"><PenLine/></span><h3>Your canvas is ready</h3><p>Generated language appears here for review. Your local work is not saved automatically.</p></div>:mutation.isPending?<div className="stack"><div className="loading-line"/><div className="loading-line"/><div className="loading-line"/></div>:<>
        <textarea aria-label="Editable generated draft" className="field result-editor" value={edited} onChange={e=>setEdited(e.target.value)}/><div style={{display:'flex',gap:8,marginTop:12}}><button className="btn btn-gold" onClick={()=>{setSaveOpen(true);}}><FilePlus2/> Save to local library</button><button className="btn" onClick={()=>setEdited(result.draft)}><RefreshCw/> Restore generated text</button></div>
        {result.caveats?.length>0&&<div className="note-strip" style={{marginTop:16}}><strong>Review notes</strong>{result.caveats.map((c:string,i:number)=><div key={i}>• {c}</div>)}</div>}
        {result.citationChecks?.length>0&&<CitationList checks={result.citationChecks}/>}
      </>}
      {saveOpen&&<div className="save-inline"><label><span className="field-label">Draft name</span><input className="field" value={title} onChange={e=>setTitle(e.target.value)}/></label><button className="btn btn-primary" onClick={()=>{onSave(title||'Untitled draft',edited);setSaveOpen(false);}}>Save locally</button></div>}
    </section></div>
  </div>;
}

function ReviewPage({docs,model,mutation,onFlash,askConfirm,setDrafts,requestConsent}:{docs:LocalDoc[];model:ModelId;mutation:any;onFlash:(m:string)=>void;askConfirm:(t:string,b:string,a:()=>void)=>void;setDrafts:(f:(v:LocalDraft[])=>LocalDraft[])=>void;requestConsent:(n:number,action:()=>void)=>void}) {
  const [text,setText]=useState('');const [instruction,setInstruction]=useState('');const [jurisdiction,setJurisdiction]=useState('');const [selected,setSelected]=useState<string[]>([]);const [result,setResult]=useState<any>(null);const [tab,setTab]=useState<'findings'|'redline'|'revised'>('findings');
  const toggle=(id:string)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const run=()=>{if(text.trim().length<20)return;requestConsent(selected.length,()=>mutation.mutate({data:{contractText:text,instruction,jurisdiction,model,supportingMaterials:docs.filter(d=>selected.includes(d.id)).slice(0,8).map(d=>({name:d.name,text:d.text.slice(0,20000)}))}},{onSuccess:(r:any)=>{setResult(r);setTab('findings');},onError:(e:unknown)=>onFlash(errorText(e))}));};
  const saveRevised=()=>askConfirm('Save revised version?','This creates a new local draft from the AI revision. The original contract remains unchanged.',()=>{const record:LocalDraft={id:uid(),title:`${result.title} — revised`,text:result.revisedDraft,updatedAt:new Date().toISOString()};setDrafts(old=>[record,...old]);onFlash('Revised draft saved locally.');});
  return <div className="page-wrap"><PageHead eyebrow="Review · Redline · Preserve the original" title="Read the agreement before changing it." desc="Surface the questions and proposed language. The source contract stays untouched; any revised version is a separate working copy."/>
    <div className="grid-two"><section className="panel panel-pad stack"><label><span className="field-label">Agreement text · required</span><textarea className="field tall" value={text} onChange={e=>setText(e.target.value)} maxLength={100000} placeholder="Paste the contract text here, or choose a text document from your local library."/><small className="tiny-hint">{text.length.toLocaleString()} / 100,000 characters · minimum 20</small></label>
      <div className="field-row"><label><span className="field-label">Review instruction</span><input className="field" value={instruction} onChange={e=>setInstruction(e.target.value)} placeholder="Areas of focus, if any"/></label><label><span className="field-label">Jurisdiction</span><input className="field" value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)} placeholder="Optional"/></label></div>
      <div className="local-load"><span className="field-label">Load contract from local library</span>{docs.filter(d=>d.kind==='document').length===0?<span className="muted">No reference documents saved.</span>:docs.filter(d=>d.kind==='document').map(d=><button className="btn" key={d.id} onClick={()=>{if(text.trim())askConfirm('Replace current contract text?','The text currently in this editor will be replaced with the selected local document.',()=>setText(d.text));else setText(d.text);}}><FileText/>{d.name}</button>)}</div>
      <div><span className="field-label">Additional supporting materials · optional</span>{docs.filter(d=>d.kind==='document').length===0?<p className="muted">Add local documents to provide context beyond the contract text.</p>:docs.filter(d=>d.kind==='document').map(d=><label className="material-option" key={d.id}><input type="checkbox" checked={selected.includes(d.id)} onChange={()=>toggle(d.id)}/><span>{d.name}</span></label>)}</div>
      <div className="note-strip">The contract text is sent only when you run review. It is processed for this request and is not saved to server-side document storage. AI usage is billed by OpenAI separately.</div><button className="btn btn-primary" disabled={mutation.isPending||text.trim().length<20} onClick={run}>{mutation.isPending?<><RefreshCw className="spin"/> Reviewing…</>:<><FileSearch/> Review contract</>}</button>{mutation.isError&&<div className="error-box">{errorText(mutation.error)} <button className="text-btn" onClick={run}>Retry</button></div>}
    </section><section className="panel panel-pad"><div className="section-head"><div><p className="eyebrow">Review report</p><h2>{result?.title??'Findings & proposed changes'}</h2></div>{result&&<button className="btn" onClick={saveRevised}><FilePlus2/> Save revised copy</button>}</div>{!result&&!mutation.isPending?<div className="empty-state"><span className="empty-icon"><ClipboardCheck/></span><h3>Nothing reviewed yet</h3><p>Review findings will be grounded in the text you explicitly submit.</p></div>:mutation.isPending?<div className="stack"><div className="loading-line"/><div className="loading-line"/><div className="loading-line"/></div>:<>
      <p className="muted">{result.overview}</p><div className="tab-row">{[['findings','Findings'],['redline','Changes'],['revised','Revised text']].map(([key,label])=><button key={key} className={`tab-button ${tab===key?'selected':''}`} onClick={()=>setTab(key as any)}>{label}</button>)}</div>
      {tab==='findings'&&(result.findings.length?result.findings.map((f:any)=><article className="finding" key={f.id}><h3><span className={`severity ${f.severity}`}>{f.severity}</span>{f.clause}</h3><p><strong>Observation:</strong> {f.observation}</p><p><strong>Concern:</strong> {f.concern}</p><p><strong>Missing information:</strong> {f.missingInformation}</p><p><strong>Suggested change:</strong> {f.suggestedChange}</p><blockquote>{f.excerpt}</blockquote></article>):<div className="empty-state">No findings returned for the supplied text.</div>)}
      {tab==='redline'&&(result.changes.length?result.changes.map((c:any,i:number)=><div className="change-card" key={i}><h3>{c.clause}</h3><div className="diff-before">{c.before}</div><div className="diff-after">{c.after}</div><p className="muted">{c.reason}</p></div>):<div className="empty-state">No revision changes returned.</div>)}
      {tab==='revised'&&<div><div className="result-box">{result.revisedDraft||'No revised text returned.'}</div><div style={{marginTop:10}}><button className="btn" onClick={async()=>{await navigator.clipboard.writeText(result.revisedDraft);onFlash('Revised text copied.')}}><Copy/> Copy revised text</button></div></div>}
      {result.assumptions?.length>0&&<div className="note-strip" style={{marginTop:15}}><strong>Assumptions to check</strong>{result.assumptions.map((a:string,i:number)=><div key={i}>• {a}</div>)}</div>}{result.citationChecks?.length>0&&<CitationList checks={result.citationChecks}/>}
    </>}</section></div>
  </div>;
}

function ResearchPage({docs,mutation,onFlash,requestConsent}:{docs:LocalDoc[];mutation:any;onFlash:(m:string)=>void;requestConsent:(n:number,action:()=>void)=>void}) {
  const [citationText,setCitationText]=useState('');const [selected,setSelected]=useState<string[]>([]);const [result,setResult]=useState<any>(null);
  const refs=docs.filter(d=>selected.includes(d.id));
  const verifyNow=()=>{const citations=citationText.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,40);const supportingMaterials=refs.slice(0,8).map(d=>({name:d.name,text:d.text.slice(0,20000)}));if(!citations.length)return;requestConsent(refs.length,()=>mutation.mutate({data:{citations,supportingMaterials}},{onSuccess:(r:any)=>setResult(r),onError:(e:unknown)=>onFlash(errorText(e))}));};
  return <div className="page-wrap"><PageHead eyebrow="Research · Source-bounded checks" title="Check the record you actually have." desc="Compare citation strings against user-provided materials. This workspace does not search external legal sources or determine current validity."/>
    <div className="grid-two"><section className="panel panel-pad stack"><label><span className="field-label">Citations to compare · one per line</span><textarea className="field" value={citationText} onChange={e=>setCitationText(e.target.value)} maxLength={20000} placeholder={'Example: Smith v. Jones, 123 F.3d 456 (9th Cir. 2022)'} /><small className="tiny-hint">Up to 40 citations; each line is compared to supplied materials only.</small></label>
      <div><span className="field-label">Materials to compare against</span>{docs.filter(d=>d.kind==='document').length===0?<div className="empty-inline">No reference materials saved. Add documents in the local library first.</div>:docs.filter(d=>d.kind==='document').map(d=><label className="material-option" key={d.id}><input type="checkbox" checked={selected.includes(d.id)} onChange={()=>setSelected(s=>s.includes(d.id)?s.filter(x=>x!==d.id):[...s,d.id])}/><span>{d.name}</span></label>)}</div>
      <div className="note-strip"><ShieldCheck/> Selected material is sent only when you choose Compare. Results reflect comparison to supplied materials only, not external legal verification. AI usage is billed by OpenAI separately.</div><button className="btn btn-primary" onClick={verifyNow} disabled={mutation.isPending||!citationText.trim()}>{mutation.isPending?<><RefreshCw className="spin"/> Comparing…</>:<><Search/> Compare citations</>}</button>{mutation.isError&&<div className="error-box">{errorText(mutation.error)} <button className="text-btn" onClick={verifyNow}>Retry</button></div>}
    </section><section className="panel panel-pad"><div className="section-head"><div><p className="eyebrow">Comparison results</p><h2>Evidence, not assurance</h2></div></div>{!result&&!mutation.isPending?<div className="empty-state"><span className="empty-icon"><BookOpen/></span><h3>Waiting for materials</h3><p>Results distinguish matches from citations not found in your selected materials.</p></div>:mutation.isPending?<div className="loading-line"/>:<><div className="citation-boundary">{result.scopeNote} External verification: <strong>not done.</strong></div><CitationList checks={result.checks}/></>}</section></div>
  </div>;
}
function CitationList({checks}:{checks:DraftmateCitationCheck[]}) {
  if(!checks?.length)return <p className="muted">No citation checks were returned.</p>;
  return <div className="citation-list">{checks.map((c,i)=><article className="citation-row" key={`${c.citation}-${i}`}><div style={{display:'flex',justifyContent:'space-between',gap:12}}><strong>{c.citation}</strong><span className={`citation-status ${c.status}`}>{c.status===DraftmateCitationStatus.matched_in_provided_material?'Matched in provided material':c.status===DraftmateCitationStatus.not_found_in_provided_material?'Not found in provided material':'Not checked'}</span></div>{c.sourceName&&<div className="doc-meta">Source: {c.sourceName}</div>}{c.matchedExcerpt&&<blockquote>{c.matchedExcerpt}</blockquote>}<p className="muted">{c.note}</p><div className="external-status">External legal-source verification: not done</div></article>)}</div>;
}

async function extractFileText(file:File) {
  const ext=file.name.split('.').pop()?.toLowerCase();
  if(ext==='txt'||ext==='md'||ext==='markdown')return await file.text();
  if(ext==='docx'){const mammoth=await import('mammoth');const array=await file.arrayBuffer();const parsed=await mammoth.extractRawText({arrayBuffer:array});return parsed.value;}
  if(ext==='pdf'){const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=pdfWorkerUrl;const bytes=new Uint8Array(await file.arrayBuffer());const pdf=await pdfjs.getDocument({data:bytes}).promise;let out='';for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p);const content=await page.getTextContent();out+=content.items.map((item:any)=>item.str).join(' ')+'\n\n';}return out;}
  throw new Error('Choose a PDF, DOCX, TXT, or Markdown file.');
}
function LibraryPage({docs,setDocs,drafts,setDrafts,askConfirm,onFlash}:{docs:LocalDoc[];setDocs:(f:(v:LocalDoc[])=>LocalDoc[])=>void;drafts:LocalDraft[];setDrafts:(f:(v:LocalDraft[])=>LocalDraft[])=>void;askConfirm:(t:string,b:string,a:()=>void)=>void;onFlash:(m:string)=>void}) {
  const [tab,setTab]=useState<'documents'|'drafts'|'templates'>('documents');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [search,setSearch]=useState('');const [editor,setEditor]=useState<LocalDoc|null>(null);const [newTemplate,setNewTemplate]=useState(false);const inputRef=useRef<HTMLInputElement>(null);
  const upload=async(file?:File)=>{if(!file)return;setBusy(true);setError('');try{const text=await extractFileText(file);if(!text.trim())throw new Error('No readable text was found in that file.');const doc:LocalDoc={id:uid(),name:file.name,text:text.slice(0,100000),kind:'document',updatedAt:new Date().toISOString()};setDocs(old=>[doc,...old]);onFlash('Document extracted and saved in this browser.');}catch(e){setError(errorText(e));}finally{setBusy(false);if(inputRef.current)inputRef.current.value='';}};
  const createTemplate=()=>{setEditor({id:uid(),name:'Untitled template',text:'',kind:'template',updatedAt:new Date().toISOString()});setNewTemplate(true);setTab('templates');};
  const editDoc=(doc:LocalDoc)=>askConfirm('Edit this browser-local text?','Review the selected text before saving. Saving will replace the current local version after a second confirmation.',()=>{setEditor({...doc});setNewTemplate(false);});
  const saveEditor=()=>{if(!editor)return;if(newTemplate){setDocs(old=>[{...editor,updatedAt:new Date().toISOString()},...old]);onFlash('Template saved in this browser.');setEditor(null);return;}askConfirm('Replace this saved document?','This replaces the existing browser-local text for “'+editor.name+'”. The previous text cannot be recovered.',()=>{setDocs(old=>old.map(d=>d.id===editor.id?{...editor,updatedAt:new Date().toISOString()}:d));setEditor(null);onFlash('Local text updated.');});};
  const removeDoc=(doc:LocalDoc)=>askConfirm('Delete this local document?','This permanently removes the browser-local text for “'+doc.name+'”. This cannot be undone.',()=>setDocs(old=>old.filter(d=>d.id!==doc.id)));
  const removeDraft=(draft:LocalDraft)=>askConfirm('Delete this draft?','This permanently removes “'+draft.title+'” from this browser.',()=>setDrafts(old=>old.filter(d=>d.id!==draft.id)));
  const shownDocs=docs.filter(d=>tab==='templates'?d.kind==='template':d.kind==='document').filter(d=>d.name.toLowerCase().includes(search.toLowerCase()));
  const shownDrafts=drafts.filter(d=>d.title.toLowerCase().includes(search.toLowerCase()));
  return <div className="page-wrap"><PageHead eyebrow="Library · Stored in this browser" title="Keep your source material close." desc="Documents, templates, and saved drafts stay on this device in browser storage. Text is extracted locally; no upload reaches the server."/>
    <div className="library-toolbar"><div className="tab-row"><button className={`tab-button ${tab==='documents'?'selected':''}`} onClick={()=>setTab('documents')}>Reference documents</button><button className={`tab-button ${tab==='drafts'?'selected':''}`} onClick={()=>setTab('drafts')}>Drafts</button><button className={`tab-button ${tab==='templates'?'selected':''}`} onClick={()=>setTab('templates')}>Templates</button></div><div style={{display:'flex',gap:8}}><label className="search-box"><Search size={15}/><input aria-label="Search local library" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search this library"/></label>{tab==='templates'?<button className="btn btn-primary" onClick={createTemplate}><Plus/> New template</button>:tab==='documents'?<button className="btn btn-primary" disabled={busy} onClick={()=>inputRef.current?.click()}>{busy?<RefreshCw className="spin"/>:<Upload/>} Add document</button>:null}<input ref={inputRef} hidden type="file" accept=".pdf,.docx,.txt,.md,.markdown" onChange={e=>upload(e.target.files?.[0])}/></div></div>
    <div className="note-strip"><LockKeyhole size={15}/> Browser-only storage. Supported formats: PDF, DOCX, TXT, Markdown. PDF and DOCX text is extracted on your device. Browser storage can be cleared by your browser.</div>
    {error&&<div role="alert" className="error-box" style={{marginTop:14}}>{error}</div>}
    <section className="panel panel-pad" style={{marginTop:16}}>{tab==='drafts'?shownDrafts.length===0?<div className="empty-state"><span className="empty-icon"><PenLine/></span><h3>No saved drafts</h3><p>Use “Save to local library” in Drafting or Contract review to keep a working copy here.</p></div>:shownDrafts.map(d=><div className="list-row" key={d.id}><button className="record-open" onClick={()=>askConfirm('Copy this local draft?','The draft text will be copied to your clipboard. It will not overwrite anything.',()=>{navigator.clipboard.writeText(d.text);onFlash('Draft text copied. Paste it into your working editor when ready.');})}><FileText/><span><span className="doc-title">{d.title}</span><span className="doc-meta">Draft · {formatDate(d.updatedAt)} · {d.text.length.toLocaleString()} characters</span></span></button><button className="btn icon-btn btn-danger" aria-label={`Delete ${d.title}`} onClick={()=>removeDraft(d)}><Trash2/></button></div>):shownDocs.length===0?<div className="empty-state"><span className="empty-icon"><FolderOpen/></span><h3>{tab==='templates'?'No templates yet':'Your library is empty'}</h3><p>{tab==='templates'?'Create a personal template to keep reusable structure in this browser.':'Add a source document to use as optional context in a specific AI action.'}</p>{tab==='documents'&&<button className="btn" onClick={()=>inputRef.current?.click()}><Upload/> Choose a document</button>}</div>:shownDocs.map(d=><div className="list-row library-record" key={d.id}><details className="record-details"><summary><FileText/><span><span className="doc-title">{d.name}</span><span className="doc-meta">{d.kind==='template'?'Template':'Reference document'} · {formatDate(d.updatedAt)} · {d.text.length.toLocaleString()} characters</span></span><ChevronRight/></summary><div className="record-text">{d.text||'This local template is currently blank.'}</div></details><div className="record-actions"><button className="btn icon-btn" aria-label={`Edit ${d.name}`} onClick={()=>editDoc(d)}><PenLine/></button><button className="btn icon-btn btn-danger" aria-label={`Delete ${d.name}`} onClick={()=>removeDoc(d)}><Trash2/></button></div></div>)}</section>
    {editor&&<div className="modal-backdrop"><div className="modal edit-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title"><div className="section-head"><h2 id="editor-title">{newTemplate?'Create a local template':'Edit local text'}</h2><button className="btn icon-btn btn-quiet" onClick={()=>setEditor(null)} aria-label="Close editor"><X/></button></div><label><span className="field-label">Name</span><input className="field" value={editor.name} onChange={e=>setEditor({...editor,name:e.target.value})}/></label><label><span className="field-label">Text</span><textarea className="field edit-textarea" value={editor.text} onChange={e=>setEditor({...editor,text:e.target.value})} placeholder="Add reusable legal structure or working material."/></label><div className="note-strip">This content remains in your browser until you explicitly select it for an AI action.</div><div className="modal-actions"><button className="btn" onClick={()=>setEditor(null)}>Cancel</button><button className="btn btn-primary" onClick={saveEditor}>{newTemplate?'Save template':'Continue to save'}</button></div></div></div>}
  </div>;
}

function SkillsPage({skills,loading,error,retry}:{skills:DraftmateSkill[];loading:boolean;error:unknown;retry:()=>void}) {
  const [filter,setFilter]=useState('All');const categories=useMemo(()=>['All',...Array.from(new Set(skills.map(s=>s.category)))],[skills]);const visible=skills.filter(s=>filter==='All'||s.category===filter);
  return <div className="page-wrap"><PageHead eyebrow="Modular capability · Server catalogue" title="Choose the work, not a generic prompt." desc="Skills keep each workflow pointed at a specific legal task. Select the right workflow and stay responsible for the result."/>
    {Boolean(error)&&<div role="alert" className="error-box">The skill catalogue could not be loaded. <button className="btn" onClick={retry}>Retry</button></div>}
    {loading?<div className="skill-grid">{[1,2,3,4,5,6].map(i=><div className="skill-card" key={i}><div className="loading-line"/><div className="loading-line" style={{marginTop:12,width:'65%'}}/></div>)}</div>:<><div className="chips" style={{marginBottom:18}}>{categories.map(c=><button key={c} className={`chip filter-chip ${filter===c?'current':''}`} onClick={()=>setFilter(c)}>{c}</button>)}</div><div className="skill-grid">{visible.map(skill=><article className="skill-card" key={skill.id}><div className="skill-card-top"><span className="skill-mark"><Gavel size={16}/></span><span className="chip">{skill.category}</span></div><h3>{skill.label}</h3><p>{skill.description}</p><Link href={skill.id==='contract-review'||skill.id==='redlining'?'/review':skill.id==='legal-research'?'/research':'/draft'} className="btn">Open workflow <ChevronRight/></Link></article>)}</div></>}
    <div className="note-strip" style={{marginTop:22}}>Catalogue reflects server-provided skills when available. AI-assisted output is a working aid, not legal advice.</div>
  </div>;
}
function SettingsPage({prefs,setPrefs,health}:{prefs:{model:ModelId;privacy:boolean};setPrefs:(v:{model:ModelId;privacy:boolean})=>void;health:any}) {
  return <div className="page-wrap"><PageHead eyebrow="Preferences · Local controls" title="Set the boundaries first." desc="Model choice and privacy preferences are stored in this browser. Each AI action remains an explicit choice."/>
    <div className="settings-grid"><section className="panel panel-pad stack"><div className="section-head"><div><p className="eyebrow">Generation defaults</p><h2>Model selection</h2></div><Sparkles/></div><p className="muted">Choose among models available to this workspace. This preference is local to your browser.</p><ModelField model={prefs.model} onChange={m=>setPrefs({...prefs,model:m})}/><div className="model-note"><strong>{modelNames[prefs.model]}</strong><p className="muted">This choice will be used when you submit drafting or review work.</p></div></section>
      <section className="panel panel-pad stack"><div className="section-head"><div><p className="eyebrow">Data handling</p><h2>Your source boundary</h2></div><LockKeyhole/></div><ul className="privacy-list"><li><Check/> Documents and drafts are stored in browser localStorage.</li><li><Check/> PDF and DOCX extraction happens in this browser.</li><li><Check/> Documents are not sent or persisted until you invoke an AI action.</li><li><Check/> Only selected text/material is sent for that action.</li><li><Check/> The service does not store legal document text server-side.</li></ul><label className="toggle-row"><span><strong>Ask before including local references</strong><small>Current consent model: selected material is sent only when action is invoked.</small></span><input type="checkbox" checked={prefs.privacy} onChange={e=>setPrefs({...prefs,privacy:e.target.checked})}/></label><div className="note-strip">No external legal source search is performed. Citation matches apply only to materials you provide. AI usage is billed by OpenAI separately.</div></section></div>
    <section className="panel panel-pad status-settings"><div><p className="eyebrow">Service check</p><h2>API connection</h2><p className="muted">Health checks do not include document content.</p></div><div>{health.isLoading?'Checking…':health.isError?<span className="status-error">Unavailable · <button className="text-btn" onClick={()=>health.refetch()}>Retry</button></span>:<span className="status-good"><i className="status-dot"/>{health.data?.status??'Available'}</span>}</div></section>
    <div className="disclaimer"><Scale size={18}/><span><strong>Professional judgment stays with you.</strong> DraftMate supports legal work but does not provide legal advice, confirm legal validity, or replace independent verification.</span></div>
  </div>;
}
function NotFound({onBack}:{onBack:()=>void}) {
  return <div className="page-wrap"><div className="panel empty-state"><span className="empty-icon"><CircleHelp/></span><h1>That page isn’t in this workspace.</h1><p>Return to your DraftMate workbench.</p><button className="btn btn-primary" onClick={onBack}>Back to workspace</button></div></div>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Studio/></WouterRouter></QueryClientProvider>;
}

export default App;
