import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Check, CheckCircle2, Clock3, ImagePlus, LockKeyhole, QrCode, Upload, UserRound, X } from 'lucide-react';

const ACCOUNT_KEY = 'zplay-account-v1';
const PROFILE_KEY = 'zplay-player-v1';
const SUBMISSION_KEY = 'zplay-join-submission-v1';
const readJson = (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } };
const phoneValid = (value) => /^[6-9]\d{9}$/.test(value.replace(/\D/g, ''));
const normalizePhone = (value) => value.replace(/\D/g, '').slice(-10);

async function digestPassword(value) {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  return btoa(unescape(encodeURIComponent(value)));
}

function Brand() {
  return <Link to="/join" className="brand" aria-label="ZPLAY home"><span className="brand-mark">Z</span><span>ZPLAY</span></Link>;
}

function Header() {
  return <header className="site-header"><div className="header-inner"><Brand /><span className="header-title">Tournament registration</span></div></header>;
}

function StepBar({ active }) {
  const steps = ['Player details', 'Payment', 'Confirmation'];
  return <ol className="steps" aria-label="Registration progress">
    {steps.map((step, index) => <li className={`${index + 1 === active ? 'active' : ''} ${index + 1 < active ? 'done' : ''}`} key={step}>
      <span className="step-number">{index + 1 < active ? <Check size={13} /> : index + 1}</span><span>{step}</span>
    </li>)}
  </ol>;
}

function AuthPanel({ onSuccess }) {
  const [tab, setTab] = useState('register');
  const [form, setForm] = useState({ name: '', mobile: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const switchTab = (next) => { setTab(next); setError(''); setForm((current) => ({ ...current, name: '' })); };

  const submit = async (event) => {
    event.preventDefault(); setError('');
    if (!phoneValid(form.mobile)) return setError('Enter a valid 10-digit mobile number.');
    if (form.password.length < 6) return setError('Your password must be at least 6 characters.');
    if (tab === 'register' && !form.name.trim()) return setError('Please enter your user name.');
    setBusy(true);
    try {
      const mobile = normalizePhone(form.mobile);
      const passwordDigest = await digestPassword(form.password);
      if (tab === 'register') {
        if (readJson(ACCOUNT_KEY)?.mobile === mobile) { setError('An account with this number already exists. Please log in.'); setBusy(false); return; }
        const account = { name: form.name.trim(), mobile, passwordDigest };
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
        onSuccess(account);
      } else {
        const saved = readJson(ACCOUNT_KEY);
        if (!saved || saved.mobile !== mobile || saved.passwordDigest !== passwordDigest) { setError('Mobile number and password do not match. Please try again.'); setBusy(false); return; }
        onSuccess(saved);
      }
    } catch { setError('Could not save your account on this device. Please try again.'); }
    setBusy(false);
  };

  return <section className="content-card auth-card">
    <div className="card-heading"><h1>Join the tournament</h1><p>Sign in or create an account to continue.</p></div>
    <div className="tabs" role="tablist" aria-label="Account options">
      <button type="button" role="tab" aria-selected={tab === 'register'} className={tab === 'register' ? 'selected' : ''} onClick={() => switchTab('register')}>Register</button>
      <button type="button" role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'selected' : ''} onClick={() => switchTab('login')}>Login</button>
    </div>
    <form className="form-stack" onSubmit={submit} noValidate>
      {tab === 'register' && <label className="field"><span>User name</span><input autoComplete="name" placeholder="Enter your user name" value={form.name} onChange={update('name')} /></label>}
      <label className="field"><span>Mobile number</span><div className="phone-field"><span>+91</span><input inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile number" value={form.mobile} onChange={(event) => setForm((current) => ({ ...current, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) }))} /></div></label>
      <label className="field"><span>Password</span><input type="password" autoComplete={tab === 'register' ? 'new-password' : 'current-password'} placeholder={tab === 'register' ? 'Set a password' : 'Enter your password'} value={form.password} onChange={update('password')} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary" disabled={busy}>{busy ? 'Please wait…' : tab === 'register' ? 'Register' : 'Login'}<ArrowRight size={16} /></button>
    </form>
    <p className="security-note"><LockKeyhole size={14} /> Your account will be remembered on this device.</p>
  </section>;
}

function PlayerDetails({ account, onContinue }) {
  const [values, setValues] = useState({ name: account?.name || '', mobile: account?.mobile || '', email: '', gameUid: '', gameLevel: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }));
  const submit = (event) => {
    event.preventDefault(); setError('');
    if (!values.name.trim()) return setError('Please enter your user name.');
    if (!phoneValid(values.mobile)) return setError('Enter a valid 10-digit mobile number.');
    if (!/^\S+@\S+\.\S+$/.test(values.email)) return setError('Enter a valid email address.');
    if (!values.gameUid.trim()) return setError('Enter your game UID number.');
    if (!values.gameLevel) return setError('Enter your Game ID level.');
    setBusy(true);
    const player = { ...values, mobile: normalizePhone(values.mobile) };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(player));
    setTimeout(() => { onContinue(player); setBusy(false); }, 150);
  };

  return <section className="content-card">
    <div className="card-heading"><h1>Player details</h1><p>Enter the details linked to your game account.</p></div>
    <div className="account-note"><BadgeCheck size={17} /><span>Signed in as</span><b>+91 {account?.mobile}</b></div>
    <form className="form-stack" onSubmit={submit} noValidate>
      <div className="form-grid">
        <label className="field"><span>User name</span><input autoComplete="name" placeholder="Your user name" value={values.name} onChange={update('name')} /></label>
        <label className="field"><span>Mobile number</span><div className="phone-field"><span>+91</span><input inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" value={values.mobile} onChange={(event) => setValues((current) => ({ ...current, mobile: event.target.value.replace(/\D/g, '').slice(0, 10) }))} /></div></label>
      </div>
      <label className="field"><span>Email</span><input type="email" autoComplete="email" placeholder="you@example.com" value={values.email} onChange={update('email')} /></label>
      <label className="field"><span>Game UID number</span><input inputMode="numeric" placeholder="Enter your in-game UID" value={values.gameUid} onChange={update('gameUid')} /></label>
      <label className="field"><span>Your Game ID level</span><input type="number" min="1" max="9999" step="1" inputMode="numeric" placeholder="Enter your current game level" value={values.gameLevel} onChange={update('gameLevel')} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : 'Continue'}<ArrowRight size={16} /></button>
    </form>
  </section>;
}

function QRPlaceholder() {
  return <div className="qr-placeholder"><QrCode size={44} /><strong>QR code</strong><span>Organizer QR will appear here</span></div>;
}

function PaymentPage({ player, onComplete }) {
  const [utr, setUtr] = useState('');
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => () => { if (image?.url) URL.revokeObjectURL(image.url); }, [image?.url]);
  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choose an image file.');
    if (file.size > 8 * 1024 * 1024) return setError('Image must be smaller than 8 MB.');
    setError(''); setImage({ file, url: URL.createObjectURL(file) });
  };
  const submit = (event) => {
    event.preventDefault(); setError('');
    if (!utr.trim()) return setError('Enter your UTR number.');
    if (!image) return setError('Upload your payment image.');
    setBusy(true);
    const submission = { player, utr: utr.trim(), receiptName: image.file.name, submittedAt: new Date().toISOString(), status: 'Under review' };
    localStorage.setItem(SUBMISSION_KEY, JSON.stringify(submission));
    setTimeout(() => { onComplete(submission); setBusy(false); }, 150);
  };

  return <section className="content-card payment-card">
    <div className="card-heading"><h1>Payment</h1><p>Scan the tournament QR and enter your payment details.</p></div>
    <div className="payment-grid">
      <div className="payment-info">
        <QRPlaceholder />
        <div className="holder-name"><span>Holder name</span><strong>Organizer name will appear here</strong></div>
      </div>
      <form className="form-stack" onSubmit={submit} noValidate>
        <label className="field"><span>Enter UTR number</span><input autoComplete="off" placeholder="Transaction reference number" value={utr} onChange={(event) => setUtr(event.target.value)} /></label>
        <div className="field"><span>Upload payment image</span><input ref={inputRef} type="file" accept="image/*" className="visually-hidden" onChange={handleImage} />
          <button type="button" className={`upload-box ${image ? 'has-file' : ''}`} onClick={() => inputRef.current?.click()}>
            {image ? <><img src={image.url} alt="Payment screenshot preview" /><span className="upload-file"><CheckCircle2 size={15} />{image.file.name}</span><span className="change-file">Change</span></> : <><ImagePlus size={25} /><strong>Choose a screenshot</strong><span>JPG or PNG · Max 8 MB</span><small>Browse files <Upload size={13} /></small></>}
          </button>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary" disabled={busy}>{busy ? 'Submitting…' : 'Complete'}<ArrowRight size={16} /></button>
      </form>
    </div>
    <Link to="/join" className="back-link"><ArrowLeft size={14} /> Back to player details</Link>
  </section>;
}

function SuccessModal({ onClose, onView }) {
  useEffect(() => {
    const handleKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    document.body.classList.add('modal-open');
    return () => { window.removeEventListener('keydown', handleKey); document.body.classList.remove('modal-open'); };
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="success-modal" role="dialog" aria-modal="true" aria-labelledby="success-title">
      <button className="modal-close" onClick={onClose} aria-label="Close"><X size={17} /></button>
      <span className="success-icon"><Check size={22} /></span>
      <h2 id="success-title">Registration submitted</h2>
      <p>Your tournament joining form has been submitted successfully. We’ll verify your details and payment. You should appear on the tournament list within a few minutes.</p>
      <button className="button button-primary" onClick={onView}>View registration status<ArrowRight size={16} /></button>
    </section>
  </div>;
}

function RegistrationDestination({ submission }) {
  if (!submission) return <Navigate to="/join" replace />;
  return <section className="content-card destination-card">
    <div className="card-heading"><h1>Registration status</h1><p>Your submission has been received. Check back shortly for an update.</p></div>
    <div className="account-note"><Clock3 size={17} /><span>Payment and player details are being reviewed.</span></div>
    <Link to="/join" className="back-link"><ArrowLeft size={14} /> Back to joining page</Link>
  </section>;
}

export default function App() {
  const [account, setAccount] = useState(() => readJson(ACCOUNT_KEY));
  const [player, setPlayer] = useState(() => readJson(PROFILE_KEY));
  const [submission, setSubmission] = useState(() => readJson(SUBMISSION_KEY));
  const [showSuccess, setShowSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const step = location.pathname === '/payment' ? 2 : location.pathname === '/registration' ? 3 : 1;
  const complete = (data) => { setSubmission(data); setShowSuccess(true); };
  const viewRegistration = () => { setShowSuccess(false); navigate('/registration'); };

  return <div className="app-shell">
    <Header />
    <main className="page-wrap">
      <StepBar active={step} />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/join" replace />} />
          <Route path="/join" element={account ? <PlayerDetails account={account} onContinue={(data) => { setPlayer(data); navigate('/payment'); }} /> : <AuthPanel onSuccess={(value) => { setAccount(value); setPlayer({ name: value.name, mobile: value.mobile, email: '', gameUid: '', gameLevel: '' }); }} />} />
          <Route path="/payment" element={account && player?.gameUid ? <PaymentPage player={player} onComplete={complete} /> : <Navigate to="/join" replace />} />
          <Route path="/registration" element={<RegistrationDestination submission={submission} />} />
          <Route path="*" element={<Navigate to="/join" replace />} />
        </Routes>
      </div>
      <footer className="site-footer">ZPLAY · Tournament registration</footer>
    </main>
    {showSuccess && <SuccessModal onClose={() => setShowSuccess(false)} onView={viewRegistration} />}
  </div>;
}
