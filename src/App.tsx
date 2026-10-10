import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Leaf, Map, ClipboardList, Info } from 'lucide-react';

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
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Select a Mission</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {/* Mission Cards */}
        {[
          { id: 'habitat-comparison', title: 'Habitat Comparison', desc: 'Compare sunny and shaded areas.', icon: Map },
          { id: 'pattern-hunt', title: 'Pattern Hunt', desc: 'Find three visually different natural objects.', icon: Leaf },
          { id: 'sound-and-scene', title: 'Sound & Scene', desc: 'Capture environmental audio and describe the scene.', icon: Info }
        ].map(m => (
          <Link key={m.id} to={`/expedition/${m.id}`} className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition group">
            <m.icon className="w-8 h-8 text-neutral-400 group-hover:text-emerald-500 mb-4" />
            <h3 className="font-semibold text-lg">{m.title}</h3>
            <p className="text-neutral-600 text-sm mt-1">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Expedition() {
  return <div className="p-4 text-center mt-10">Active Expedition (Coming Soon)</div>;
}

function Report() {
  return <div className="p-4 text-center mt-10">Field Report (Coming Soon)</div>;
}

function About() {
  return (
    <div className="p-4 max-w-xl mx-auto mt-8 prose prose-emerald">
      <h2>About FieldProof</h2>
      <p>FieldProof turns a 20-minute walk into structured, evidence-backed field research using local AI.</p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans">
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-neutral-800">
              <Leaf className="w-6 h-6 text-emerald-600" />
              FieldProof
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-neutral-600">
              <Link to="/missions" className="hover:text-emerald-600 flex items-center gap-1"><ClipboardList className="w-4 h-4"/> Missions</Link>
              <Link to="/about" className="hover:text-emerald-600 flex items-center gap-1"><Info className="w-4 h-4"/> About</Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full max-w-4xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/missions" element={<Missions />} />
            <Route path="/expedition/:id" element={<Expedition />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
