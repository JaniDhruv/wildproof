import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { Leaf, Map, ClipboardList, Info, Camera, Trash, Plus, Check } from 'lucide-react';
import { getExpedition, saveExpedition, Expedition, EvidenceItem, MissionType, FieldReport } from './lib/db';

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="bg-emerald-100 p-4 rounded-full mb-6">
        <Leaf className="w-12 h-12 text-emerald-600" />
      </div>
      <h1 className="text-4xl font-bold text-neutral-900 mb-4 tracking-tight">FieldProof</h1>
      <p className="text-lg text-neutral-600 mb-8 max-w-md">
        An offline-first open-AI companion for turning ordinary walks into trustworthy field notes.
      </p>
      <Link 
        to="/missions" 
        className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-emerald-700 transition shadow-sm hover:shadow active:scale-95"
      >
        Start an Expedition
      </Link>
    </div>
  );
}

function Missions() {
  const navigate = useNavigate();

  const startMission = async (id: MissionType) => {
    const expId = generateId();
    // eslint-disable-next-line
    const ts = new Date().toISOString();
    const newExp: Expedition = {
      id: expId,
      missionType: id,
      startedAt: ts,
      evidence: [],
      status: 'draft',
    };
    await saveExpedition(newExp);
    navigate(`/expedition/${expId}`);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Select a Mission</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {[
          { id: 'habitat-comparison', title: 'Habitat Comparison', desc: 'Compare sunny and shaded areas.', icon: Map },
          { id: 'pattern-hunt', title: 'Pattern Hunt', desc: 'Find three visually different natural objects.', icon: Leaf },
          { id: 'sound-and-scene', title: 'Sound & Scene', desc: 'Capture environmental audio and describe the scene.', icon: Info }
        ].map(m => (
          <button 
            key={m.id} 
            onClick={() => startMission(m.id as MissionType)} 
            className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition group text-left w-full"
          >
            <m.icon className="w-8 h-8 text-neutral-400 group-hover:text-emerald-500 mb-4" />
            <h3 className="font-semibold text-lg">{m.title}</h3>
            <p className="text-neutral-600 text-sm mt-1">{m.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function ActiveExpedition() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expedition, setExpedition] = useState<Expedition | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    if (id) {
      getExpedition(id).then(exp => {
        if (exp) setExpedition(exp);
      });
    }
  }, [id]);

  if (!expedition) return <div className="p-4 text-center mt-10">Loading expedition...</div>;

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const newEv: EvidenceItem = {
          id: generateId(),
          kind: 'photo',
          localUrl: ev.target?.result as string,
          capturedAt: new Date().toISOString(),
        };
        const updated = { ...expedition, evidence: [...expedition.evidence, newEv] };
        await saveExpedition(updated);
        setExpedition(updated);
      };
      reader.readAsDataURL(file);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    const newEv: EvidenceItem = {
      id: generateId(),
      kind: 'note',
      text: noteText,
      capturedAt: new Date().toISOString(),
    };
    const updated = { ...expedition, evidence: [...expedition.evidence, newEv] };
    await saveExpedition(updated);
    setExpedition(updated);
    setNoteText('');
  };

  const deleteEvidence = async (evId: string) => {
    const updated = { ...expedition, evidence: expedition.evidence.filter(e => e.id !== evId) };
    await saveExpedition(updated);
    setExpedition(updated);
  };

  const completeExpedition = async () => {
    const updated = { ...expedition, status: 'queued' as const, completedAt: new Date().toISOString() };
    await saveExpedition(updated);
    navigate(`/report/${expedition.id}`);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold capitalize">{expedition.missionType.replace('-', ' ')}</h2>
          <p className="text-neutral-500 text-sm">Status: {expedition.status}</p>
        </div>
        <button onClick={completeExpedition} className="bg-emerald-600 text-white px-4 py-2 rounded font-medium flex items-center gap-1 hover:bg-emerald-700">
          <Check className="w-4 h-4"/> Generate Report
        </button>
      </div>

      <div className="space-y-4 mb-8">
        {expedition.evidence.length === 0 && (
          <div className="text-center p-8 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-500">
            No evidence yet. Start capturing your surroundings!
          </div>
        )}
        {expedition.evidence.map(ev => (
          <div key={ev.id} className="flex items-start justify-between bg-white p-4 rounded-xl shadow-sm border border-neutral-200">
            <div className="flex-1">
              <span className="text-xs uppercase font-bold text-neutral-400 mb-1 block">{ev.kind}</span>
              {ev.kind === 'photo' && ev.localUrl && (
                <img src={ev.localUrl} alt="Evidence" className="w-full h-48 object-cover rounded mt-2 bg-neutral-100" />
              )}
              {ev.kind === 'note' && <p className="text-neutral-800 mt-1">{ev.text}</p>}
              <p className="text-xs text-neutral-400 mt-2">{new Date(ev.capturedAt).toLocaleTimeString()}</p>
            </div>
            <button onClick={() => deleteEvidence(ev.id)} className="text-red-500 p-2 ml-4 hover:bg-red-50 rounded">
              <Trash className="w-5 h-5"/>
            </button>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto flex gap-2">
          <label className="flex-1 flex justify-center items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 py-3 rounded-lg cursor-pointer font-medium transition">
            <Camera className="w-5 h-5" /> Add Photo
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={addPhoto} />
          </label>
          
          <div className="flex-[2] flex gap-2">
            <input 
              type="text" 
              placeholder="Add a field note..." 
              className="flex-1 bg-neutral-100 border-none rounded-lg px-4 focus:ring-2 focus:ring-emerald-500"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
            />
            <button onClick={addNote} className="bg-neutral-800 hover:bg-neutral-900 text-white px-4 rounded-lg flex items-center justify-center transition">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Report() {
  const { id } = useParams<{ id: string }>();
  const [expedition, setExpedition] = useState<Expedition | null>(null);

  useEffect(() => {
    if (id) {
      getExpedition(id).then(exp => {
        if (exp) {
          // If not analyzed, we mock it for Phase 3
          if (!exp.report) {
            const mockReport: FieldReport = {
              summary: "A brief walk yielding partial insights into the local habitat.",
              observations: [
                { claim: "Found broadleaf patterns near the pathway.", confidence: "observed", supportingEvidenceIds: [] },
                { claim: "Likely a moderately humid micro-climate.", confidence: "inferred", supportingEvidenceIds: [] },
              ],
              missingEvidence: ["Audio capturing ambient bird sounds.", "Temperature readings."],
              suggestedNextStep: "Return at dusk to capture nocturnal insect patterns."
            };
            const updated = { ...exp, status: 'complete' as const, report: mockReport };
            saveExpedition(updated);
            setExpedition(updated);
          } else {
            setExpedition(exp);
          }
        }
      });
    }
  }, [id]);

  if (!expedition || !expedition.report) return <div className="p-4 text-center mt-10">Generating report...</div>;

  const { report } = expedition;

  return (
    <div className="p-4 max-w-2xl mx-auto mt-4">
      <h2 className="text-3xl font-bold mb-2">Field Report</h2>
      <p className="text-neutral-500 mb-6">{new Date(expedition.completedAt || expedition.startedAt).toLocaleString()}</p>

      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl mb-6">
        <p className="text-emerald-900 leading-relaxed">{report.summary}</p>
      </div>

      <h3 className="text-xl font-semibold mb-4">Observations</h3>
      <div className="space-y-3 mb-8">
        {report.observations.map((obs: any, i: number) => (
          <div key={i} className="flex items-start gap-3 bg-white p-4 border border-neutral-200 rounded-lg shadow-sm">
            <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wide mt-0.5
              ${obs.confidence === 'observed' ? 'bg-blue-100 text-blue-700' : ''}
              ${obs.confidence === 'inferred' ? 'bg-amber-100 text-amber-700' : ''}
              ${obs.confidence === 'unknown' ? 'bg-neutral-100 text-neutral-600' : ''}
            `}>
              {obs.confidence}
            </span>
            <p className="text-neutral-800 flex-1">{obs.claim}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white p-5 border border-neutral-200 rounded-xl shadow-sm">
          <h4 className="font-semibold text-neutral-900 mb-2">Missing Evidence</h4>
          <ul className="list-disc pl-5 text-sm text-neutral-600 space-y-1">
            {report.missingEvidence.map((e: string, i: number) => <li key={i}>{e}</li>)}
          </ul>
        </div>
        <div className="bg-white p-5 border border-neutral-200 rounded-xl shadow-sm">
          <h4 className="font-semibold text-neutral-900 mb-2">Suggested Next Step</h4>
          <p className="text-sm text-neutral-600">{report.suggestedNextStep}</p>
        </div>
      </div>
    </div>
  );
}

function About() {
  return (
    <div className="p-4 max-w-xl mx-auto mt-8 text-neutral-800">
      <h2 className="text-3xl font-bold mb-4">About FieldProof</h2>
      <p className="text-lg leading-relaxed mb-4">
        FieldProof turns a 20-minute walk into structured, evidence-backed field research using local AI.
      </p>
      <p className="leading-relaxed">
        Instead of telling you to go outside and guessing what you took a photo of, we structure your observation, identify missing data, and make explicit distinctions between what is directly observed versus what is inferred.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans bg-neutral-50 pb-20 md:pb-0">
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-neutral-800 hover:opacity-80">
              <Leaf className="w-6 h-6 text-emerald-600" />
              FieldProof
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-neutral-600">
              <Link to="/missions" className="hover:text-emerald-600 flex items-center gap-1"><ClipboardList className="w-4 h-4 hidden sm:block"/> Missions</Link>
              <Link to="/about" className="hover:text-emerald-600 flex items-center gap-1"><Info className="w-4 h-4 hidden sm:block"/> About</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full max-w-4xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/expedition/:id" element={<ActiveExpedition />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
