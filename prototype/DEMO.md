# E-skool V1 demo script (about 10 minutes)

Open `prototype/v1-demo.html` in Chrome or Edge (double-click works). Fictional school "GS Les Lauréats", Douala, 31/10/2026, 12 pupils. Press **Réinitialiser la démo** (bottom left) before you start. Switch the person with **Je suis connecté comme**.

Say first: this is a clickable prototype of V1 with demo data; the real app is being built on the same rules (multi-school database isolation is already done and tested).

1. **Promoteur → Tableau de bord** (the owner's view). Tranche 1 collection rate vs last year, cash taken today, late vs under a payment delay, yesterday's cash gap (-15 000 FCFA, approved with a comment), pupils sent home today.
2. **Caissier → Caisse.** Type `mbap`, pick Junior; the app proposes his sister Grâce (same parent phone). Amounts are pre-filled with what is left on Tranche 1. **Encaisser** → numbered receipt with the balance left; print it (80 mm) and stamp it as today. A WhatsApp confirmation appears for the mother. Point out: the cashier has no "Annuler" button.
3. **Directeur → Renvois du jour.** Built from recorded payments: Junior and Grâce are no longer on it. Exclude one pupil with a reason, then **Confirmer la liste**: parents get the amount to pay for the child to come back. Key message: if a parent brings a stamped receipt but the child is still on the list, the receipt was never recorded, so a cashier who pockets cash is caught the next morning.
4. **Directeur → Élèves → a late pupil → Accorder un délai** (3 instalments, reason required). The pupil leaves the send-home list.
5. **Caissier → Clôture de caisse.** Enter a counted amount (try 5 000 less than taken). Only then does the app show the expected amount and the gap. **Directeur → Clôture** approves the gap with a comment; the promoter sees it.
6. **Directeur → Caisse → Annuler** a receipt (reason required): it stays visible as "Annulé" and the pupil goes back on the send-home list.
7. **Enseignante → Notes.** Type a mark out of 20; 25 is refused. **Directeur → Bulletins**: averages with coefficients and ranks are computed; **Signer le trimestre** locks the marks; open and print a report card.

Not in V1 (say if asked): parent portal, Mobile Money, calendar, exams, Teams/Google links — parked, each modelled on proven software.
