"use client";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}) {
  return <main className="shell">
    <header className="brand">♡ KleiderPfad</header>
    <h1>Aktion konnte nicht abgeschlossen werden</h1>
    <p className="muted">Prüfe die Angaben und versuche es erneut. Bei einer offenen Übergabe müssen eventuell zuerst andere Pakete bearbeitet werden.</p>
    <button onClick={()=>reset()} className="btn">Erneut versuchen</button>
  </main>;
}
