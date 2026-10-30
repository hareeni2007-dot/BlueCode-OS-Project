import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const plans = [
  { id: "starter", name: "Starter", price: "₹99", detail: "For trying BlueCode OS" },
  { id: "product", name: "Product", price: "₹299", detail: "For individual builders", popular: true },
  { id: "team", name: "Team", price: "₹799", detail: "For small teams" }
];

function PaymentResult() {
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status") || "unknown";
  const txnid = params.get("txnid");
  const title = status === "success" ? "Payment successful" :
    status === "failed" ? "Payment not completed" :
    "We could not verify this payment";
  const message = status === "success"
    ? "The payment response was verified and a subscription record was activated."
    : status === "failed" ? "PayU reported that this transaction did not succeed. You can try again."
    : "Please contact support before retrying. Do not pay again until the transaction is checked.";
  return <main className="result-wrap"><section className="result-card">
    <div className={`result-icon ${status === "success" ? "good" : "bad"}`}>{status === "success" ? "✓" : "!"}</div>
    <p className="eyebrow">BLUECODE OS · PAYU</p><h1>{title}</h1><p className="muted">{message}</p>
    {txnid && <p className="transaction">Transaction ID: <code>{txnid}</code></p>}
    <a className="button" href="/">Back to plans</a>
  </section></main>;
}

function Checkout({ plan, onClose }) {
  const [form, setForm] = useState({ firstname: "", email: "", phone: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function pay(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch(`${API}/api/payments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, ...form })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to start payment.");
      // Submit to PayU's hosted checkout; secret salt stays on the backend.
      const formElement = document.createElement("form");
      formElement.method = "POST";
      formElement.action = data.paymentUrl;
      Object.entries(data.fields).forEach(([name, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value ?? "");
        formElement.appendChild(input);
      });
      document.body.appendChild(formElement);
      formElement.submit();
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setBusy(false);
    }
  }

  return <div className="overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <button className="close" onClick={onClose} aria-label="Close">×</button>
      <p className="eyebrow">SECURE CHECKOUT</p><h2 id="checkout-title">{plan.name} plan</h2>
      <p className="price large">{plan.price}<span>/month</span></p>
      <form onSubmit={pay}>
        <label>Full name<input name="firstname" value={form.firstname} onChange={update} autoComplete="name" minLength="2" required /></label>
        <label>Email address<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required /></label>
        <label>Phone number<input name="phone" type="tel" value={form.phone} onChange={update} autoComplete="tel" minLength="8" required /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="button full" type="submit" disabled={busy}>{busy ? "Preparing payment…" : `Continue to PayU · ${plan.price}`}</button>
      </form>
      <p className="fine-print">Test mode starter. Your card/UPI details are entered only on PayU's hosted checkout page.</p>
    </section>
  </div>;
}

function App() {
  const [selected, setSelected] = useState(null);
  const [apiState, setApiState] = useState("checking");
  useEffect(() => {
    fetch(`${API}/api/health`).then(r => r.ok ? setApiState("online") : setApiState("offline")).catch(() => setApiState("offline"));
  }, []);

  if (window.location.pathname === "/payment-result") return <PaymentResult />;

  return <main className="page">
    <nav className="nav"><a className="brand" href="/"><span className="brand-mark">B</span> BlueCode OS</a><span className={`api-status ${apiState}`}><i /> API {apiState}</span></nav>
    <section className="hero">
      <p className="eyebrow">BUILD · CONNECT · GROW</p>
      <h1>Choose a plan.<br /><span>Build something great.</span></h1>
      <p className="hero-copy">Pick a BlueCode OS plan to continue. Checkout is handled securely by PayU.</p>
    </section>
    <section className="plans" aria-label="Subscription plans">
      {plans.map(plan => <article className={`plan ${plan.popular ? "popular" : ""}`} key={plan.id}>
        {plan.popular && <span className="popular-tag">POPULAR</span>}
        <h2>{plan.name}</h2><p className="plan-detail">{plan.detail}</p>
        <p className="price">{plan.price}<span>/month</span></p>
        <ul><li>Access to the selected plan</li><li>Secure PayU checkout</li><li>Payment confirmation</li></ul>
        <button className={`button ${plan.popular ? "" : "secondary"}`} onClick={() => setSelected(plan)}>Choose {plan.name}</button>
      </article>)}
    </section>
    <footer>Payments powered by PayU · Merchant credentials stay on the server.</footer>
    {selected && <Checkout plan={selected} onClose={() => setSelected(null)} />}
  </main>;
}
export default App;
